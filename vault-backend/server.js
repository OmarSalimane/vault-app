require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const requirePermission = (permissionFlag) => {
    return async (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Access Denied.' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const result = await pool.query(`SELECT r.* FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`, [decoded.id]);
            const userRole = result.rows[0];
            
            if (!userRole) return res.status(403).json({ error: 'Role not found.' });
            if (!permissionFlag || userRole[permissionFlag] === true) {
                req.user = { id: decoded.id, role: userRole };
                next(); 
            } else {
                res.status(403).json({ error: `Forbidden: Lacks ${permissionFlag}` });
            }
        } catch (err) { res.status(401).json({ error: 'Invalid token.' }); }
    };
};

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, name: `${user.first_name} ${user.last_name}`, role_id: user.role_id }});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// RICH DASHBOARD API
// ==========================================
app.get('/api/dashboard/full', requirePermission(null), async (req, res) => {
    try {
        // 1. High-Level KPIs
        const assets = await pool.query(`SELECT COUNT(*) as count FROM assets`);
        const users = await pool.query(`SELECT COUNT(*) as count FROM users WHERE is_active = true`);
        const software = await pool.query(`SELECT COUNT(*) as count FROM software_licenses`);
        const risks = await pool.query(`SELECT COUNT(*) as count FROM risks WHERE status != 'Mitigated'`);

        // 2. Chart Analytics
        const categoryStats = await pool.query(`SELECT category as label, COUNT(*) as value FROM assets GROUP BY category ORDER BY value DESC`);
        const riskStats = await pool.query(`SELECT severity as label, COUNT(*) as value FROM risks WHERE status != 'Mitigated' GROUP BY severity ORDER BY value DESC`);

        // 3. Operational Feeds
        const recentAssets = await pool.query(`
            SELECT a.id, a.hostname, a.ip_address, a.type, g.group_name as department 
            FROM assets a LEFT JOIN user_groups g ON a.department_id = g.id 
            ORDER BY a.id DESC LIMIT 5
        `);
        const topRisks = await pool.query(`
            SELECT r.id, r.vulnerability, r.severity, a.hostname, r.discovered_at 
            FROM risks r JOIN assets a ON r.asset_id = a.id 
            WHERE r.status != 'Mitigated' ORDER BY r.cvss_score DESC LIMIT 5
        `);

        res.json({
            kpis: {
                assets: parseInt(assets.rows[0].count),
                users: parseInt(users.rows[0].count),
                software: parseInt(software.rows[0].count),
                risks: parseInt(risks.rows[0].count)
            },
            charts: { categories: categoryStats.rows, risks: riskStats.rows },
            feeds: { recentAssets: recentAssets.rows, topRisks: topRisks.rows }
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// STANDARD CRUD APIs
// ==========================================
app.get('/api/assets', requirePermission(null), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.first_name || ' ' || u.last_name as custodian_name, g.group_name as department_name 
            FROM assets a LEFT JOIN users u ON a.custodian_id = u.id LEFT JOIN user_groups g ON a.department_id = g.id ORDER BY a.id ASC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/assets', requirePermission('can_manage_assets'), async (req, res) => {
    const { hostname, type, category, manufacturer, model, serial_number, mac_address, ip_address, location, department_id, status, os_lifecycle } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO assets (hostname, type, category, manufacturer, model, serial_number, mac_address, ip_address, location, department_id, status, os_lifecycle) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [hostname, type, category, manufacturer, model, serial_number, mac_address, ip_address, location, department_id || null, status, os_lifecycle]
        );
        res.status(201).json({ message: "Asset created", asset: result.rows[0] });
    } catch (err) { res.status(400).json({ error: "Creation failed. Serial/MAC may exist." }); }
});

// POST /api/assets/bulk (BULK CSV IMPORT)
app.post('/api/assets/bulk', requirePermission('can_manage_assets'), async (req, res) => {
    const { assets } = req.body;
    
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ error: "No assets provided in payload." });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start transaction
        let successCount = 0;

        for (const asset of assets) {
            // Require the bare minimum to register an asset
            if (!asset.hostname || !asset.serial_number) continue;

            await client.query(
                `INSERT INTO assets (hostname, type, category, manufacturer, model, serial_number, mac_address, ip_address, location, status, os_lifecycle) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    asset.hostname, 
                    asset.type || 'Workstation', 
                    asset.category || 'End User Computing', 
                    asset.manufacturer || 'Unknown', 
                    asset.model || 'Unknown', 
                    asset.serial_number, 
                    asset.mac_address || null, 
                    asset.ip_address || null, 
                    asset.location || 'HQ', 
                    asset.status || 'Available', 
                    asset.os_lifecycle || 'Supported'
                ]
            );
            successCount++;
        }

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({ message: `Successfully provisioned ${successCount} assets to the Vault.` });
    } catch (err) {
        await client.query('ROLLBACK'); // Abort on failure
        console.error("Bulk Import Error:", err);
        if (err.code === '23505') {
            res.status(400).json({ error: "Import failed: One or more Serial Numbers / MAC Addresses already exist in the database." });
        } else {
            res.status(500).json({ error: "Database transaction failed during bulk import." });
        }
    } finally {
        client.release();
    }
});

// ==========================================
// ASSET MANAGEMENT & DEEP DIVES
// ==========================================

// GET single asset details, including installed software and active risks
app.get('/api/assets/:id', requirePermission(null), async (req, res) => {
    try {
        const assetId = req.params.id;
        
        // 1. Fetch Asset + User + Department
        const assetRes = await pool.query(`
            SELECT a.*, u.first_name || ' ' || u.last_name as custodian_name, g.group_name as department_name 
            FROM assets a 
            LEFT JOIN users u ON a.custodian_id = u.id 
            LEFT JOIN user_groups g ON a.department_id = g.id 
            WHERE a.id = $1
        `, [assetId]);
        
        if (assetRes.rows.length === 0) return res.status(404).json({ error: "Asset not found." });

        // 2. Fetch Software installed on this asset
        const softwareRes = await pool.query(`
            SELECT s.id, s.software_name, s.publisher, s.brand_color 
            FROM asset_software asw 
            JOIN software_licenses s ON asw.software_id = s.id 
            WHERE asw.asset_id = $1
        `, [assetId]);

        // 3. Fetch Risks associated with this asset
        const riskRes = await pool.query(`
            SELECT * FROM risks WHERE asset_id = $1
        `, [assetId]);

        res.json({ 
            asset: assetRes.rows[0], 
            software: softwareRes.rows, 
            risks: riskRes.rows 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update asset details (Requires 'can_manage_assets')
app.put('/api/assets/:id', requirePermission('can_manage_assets'), async (req, res) => {
    const { status, location, department_id, custodian_id, os_lifecycle } = req.body;
    try {
        const result = await pool.query(`
            UPDATE assets 
            SET status = $1, location = $2, department_id = $3, custodian_id = $4, os_lifecycle = $5, last_scan = CURRENT_TIMESTAMP
            WHERE id = $6 RETURNING *
        `, [
            status, location, 
            department_id || null, 
            custodian_id || null, 
            os_lifecycle, req.params.id
        ]);
        
        res.json({ message: "Asset successfully updated.", asset: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Failed to update asset." }); }
});

// ==========================================
// ASSET GROUPS & DEPARTMENTS API (FIXED)
// ==========================================

// READ: Safely fetch groups without crashing on missing timestamp columns
app.get('/api/groups', requirePermission(null), async (req, res) => {
    try {
        const query = `
            SELECT g.id, g.group_name, g.description, 
            (SELECT COUNT(a.id) FROM assets a WHERE a.department_id = g.id) as asset_count 
            FROM user_groups g 
            ORDER BY g.group_name ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { 
        console.error("Backend Error fetching groups:", err);
        res.status(500).json({ error: "Failed to fetch groups from database." }); 
    }
});

// CREATE: Securely create a group
app.post('/api/groups', requirePermission('can_manage_assets'), async (req, res) => {
    const { group_name, description } = req.body;
    
    if (!group_name) return res.status(400).json({ error: "Group name is required." });

    try {
        const result = await pool.query(
            `INSERT INTO user_groups (group_name, description) VALUES ($1, $2) RETURNING id, group_name, description`,
            [group_name, description || '']
        );
        res.status(201).json({ message: "Group created successfully", group: result.rows[0] });
    } catch (err) { 
        if (err.code === '23505') {
            res.status(400).json({ error: "A group with this name already exists." });
        } else {
            res.status(500).json({ error: "Failed to create group." }); 
        }
    }
});

app.get('/api/software', requirePermission(null), async (req, res) => {
    try {
        const result = await pool.query(`SELECT s.*, (SELECT COUNT(*) FROM asset_software asw WHERE asw.software_id = s.id) as seats_used FROM software_licenses s`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// SOFTWARE MANAGEMENT & DEEP DIVES
// ==========================================

// GET details of a specific software, including who is using it
app.get('/api/software/:id', requirePermission(null), async (req, res) => {
    try {
        const swId = req.params.id;
        
        // Fetch the software details
        const swRes = await pool.query(`
            SELECT s.*, (SELECT COUNT(*) FROM asset_software asw WHERE asw.software_id = s.id) as seats_used 
            FROM software_licenses s WHERE s.id = $1
        `, [swId]);
        
        if (swRes.rows.length === 0) return res.status(404).json({ error: "Software not found." });

        // Fetch the assets and users currently assigned to this software
        const assignments = await pool.query(`
            SELECT a.id as asset_id, a.hostname, a.type, a.ip_address, u.first_name || ' ' || u.last_name as custodian_name
            FROM asset_software asw
            JOIN assets a ON asw.asset_id = a.id
            LEFT JOIN users u ON a.custodian_id = u.id
            WHERE asw.software_id = $1
            ORDER BY a.hostname ASC
        `, [swId]);

        res.json({ software: swRes.rows[0], assignments: assignments.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update license details (Requires 'can_manage_software' IAM permission)
app.put('/api/software/:id', requirePermission('can_manage_software'), async (req, res) => {
    const { total_seats, expiry_date } = req.body;
    try {
        const result = await pool.query(
            `UPDATE software_licenses SET total_seats = $1, expiry_date = $2 WHERE id = $3 RETURNING *`,
            [total_seats, expiry_date || null, req.params.id]
        );
        res.json({ message: "License updated successfully.", software: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Failed to update license." }); }
});

// POST assign software to an asset
app.post('/api/software/:id/assign', requirePermission('can_manage_software'), async (req, res) => {
    const { asset_id } = req.body;
    try {
        await pool.query(`INSERT INTO asset_software (asset_id, software_id) VALUES ($1, $2)`, [asset_id, req.params.id]);
        res.status(201).json({ message: "Seat assigned successfully." });
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: "This asset already has this software." });
        res.status(500).json({ error: "Failed to assign seat." }); 
    }
});

// DELETE revoke software from an asset
app.delete('/api/software/:id/revoke/:asset_id', requirePermission('can_manage_software'), async (req, res) => {
    try {
        await pool.query(`DELETE FROM asset_software WHERE software_id = $1 AND asset_id = $2`, [req.params.id, req.params.asset_id]);
        res.json({ message: "Seat revoked successfully." });
    } catch (err) { res.status(500).json({ error: "Failed to revoke seat." }); }
});

// ==========================================
// USER MANAGEMENT & DEEP DIVES
// ==========================================

// GET all users (Live Table Feed)
app.get('/api/users', requirePermission(null), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.first_name || ' ' || u.last_name as name, u.email, u.job_title, 
            u.is_active, u.created_at, r.role_name, g.group_name as department 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            LEFT JOIN user_groups g ON u.group_id = g.id
            ORDER BY u.first_name ASC
        `);
        res.json(result.rows);
    } catch (err) { 
        console.error("Users Query Error:", err);
        res.status(500).json({ error: "Failed to fetch users from database." }); 
    }
});

// GET single user deep dive (Profile + Assigned Assets)
app.get('/api/users/:id', requirePermission(null), async (req, res) => {
    try {
        const userId = req.params.id;
        
        const userRes = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.job_title, u.is_active, u.created_at, 
            r.id as role_id, r.role_name, g.id as group_id, g.group_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            LEFT JOIN user_groups g ON u.group_id = g.id 
            WHERE u.id = $1
        `, [userId]);
        
        if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found." });

        const assetRes = await pool.query(`
            SELECT id, hostname, type, ip_address, status, os_lifecycle 
            FROM assets WHERE custodian_id = $1
        `, [userId]);

        res.json({ user: userRes.rows[0], assets: assetRes.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create a new user (Requires 'can_manage_users')
app.post('/api/users', requirePermission('can_manage_users'), async (req, res) => {
    const { first_name, last_name, email, password, job_title, role_id, group_id } = req.body;
    try {
        // Hash the provided password, or default to a standard one
        const hashedPassword = await bcrypt.hash(password || 'ChangeMe123!', 10);
        
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, job_title, role_id, group_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email`,
            [first_name, last_name, email, hashedPassword, job_title, role_id || 4, group_id || null]
        );
        res.status(201).json({ message: "User provisioned successfully.", user: result.rows[0] });
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: "Email address already exists." });
        res.status(500).json({ error: "Failed to create user." }); 
    }
});

// PUT update user access and details (Requires 'can_manage_users')
app.put('/api/users/:id', requirePermission('can_manage_users'), async (req, res) => {
    const { job_title, role_id, group_id, is_active } = req.body;
    try {
        await pool.query(`
            UPDATE users SET job_title = $1, role_id = $2, group_id = $3, is_active = $4 WHERE id = $5
        `, [job_title, role_id, group_id || null, is_active, req.params.id]);
        
        res.json({ message: "User profile updated successfully." });
    } catch (err) { res.status(500).json({ error: "Failed to update user." }); }
});

app.get('/api/risks', requirePermission(null), async (req, res) => {
    try {
        const result = await pool.query(`SELECT r.*, a.hostname as asset_name, a.ip_address as ip FROM risks r JOIN assets a ON r.asset_id = a.id ORDER BY r.cvss_score DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Vault API running on port ${PORT}`));