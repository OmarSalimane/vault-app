-- 1. ROLES & PERMISSIONS
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    can_manage_users BOOLEAN DEFAULT false,
    can_manage_assets BOOLEAN DEFAULT false,
    can_manage_software BOOLEAN DEFAULT false,
    can_view_all BOOLEAN DEFAULT true
);

-- 2. DEPARTMENTS / USER GROUPS
CREATE TABLE user_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 3. USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    job_title VARCHAR(100),
    role_id INTEGER REFERENCES roles(id),
    group_id INTEGER REFERENCES user_groups(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSETS 
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100) DEFAULT 'Uncategorized', 
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    mac_address VARCHAR(50) UNIQUE,
    ip_address VARCHAR(50),
    location VARCHAR(100),
    domain VARCHAR(100) DEFAULT 'vault.local',
    status VARCHAR(50) DEFAULT 'Available',
    os_lifecycle VARCHAR(50) DEFAULT 'Supported',
    department_id INTEGER REFERENCES user_groups(id) ON DELETE SET NULL, 
    custodian_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_scan TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SOFTWARE & LICENSES
CREATE TABLE software_licenses (
    id SERIAL PRIMARY KEY,
    software_name VARCHAR(150) NOT NULL,
    publisher VARCHAR(100),
    license_type VARCHAR(50),
    total_seats INTEGER NOT NULL,
    expiry_date DATE,
    os_support VARCHAR(100),
    brand_color VARCHAR(50) DEFAULT 'bg-blue-500'
);

-- 6. ASSET_SOFTWARE MAPPING
CREATE TABLE asset_software (
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    software_id INTEGER REFERENCES software_licenses(id) ON DELETE CASCADE,
    PRIMARY KEY (asset_id, software_id)
);

-- 7. CYBER RISKS
CREATE TABLE risks (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    vulnerability VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    risk_type VARCHAR(100),
    cvss_score DECIMAL(3,1),
    status VARCHAR(50) DEFAULT 'Unpatched',
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MASSIVE ENTERPRISE SEED DATA
-- ==========================================

INSERT INTO roles (role_name, can_manage_users, can_manage_assets, can_manage_software) VALUES 
('IAM Administrator', true, false, false), ('IT Asset Manager', false, true, true), 
('Security Analyst', false, false, false), ('Standard User', false, false, false);

-- Departments
INSERT INTO user_groups (group_name, description) VALUES 
('Information Technology', 'IT Ops and Helpdesk'), ('Cybersecurity', 'SOC and Risk'),
('Engineering', 'Software Devs'), ('Marketing', 'Global Marketing'),
('Human Resources', 'HR & Recruiting'), ('Finance', 'Accounting & Payroll');

INSERT INTO users (first_name, last_name, email, password_hash, job_title, role_id, group_id) VALUES 
('Marcus', 'Vance', 'm.vance@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'IAM Engineer', 1, 2),
('Sarah', 'Jenkins', 's.jenkins@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'IT Asset Manager', 2, 1),
('David', 'Chen', 'd.chen@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'SOC Analyst', 3, 2),
('Elena', 'Rodriguez', 'e.rodriguez@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'Marketing Director', 4, 4),
('James', 'Holden', 'j.holden@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'Lead Developer', 4, 3),
('Naomi', 'Nagata', 'n.nagata@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'Systems Engineer', 4, 3),
('Amos', 'Burton', 'a.burton@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'Mechanic / Facilities', 4, 1),
('Chrisjen', 'Avasarala', 'c.avasarala@vault.io', '$2b$10$Z21t/ylrJeHIP2a0DYujYOTkFacP4N9jhIGbJ0RFmXsa0WkRTAhHG', 'CFO', 4, 6);

INSERT INTO assets (hostname, type, category, manufacturer, model, serial_number, mac_address, ip_address, location, status, os_lifecycle, department_id, custodian_id) VALUES 
('LON-SRV-01', 'Server', 'Data Center', 'Dell', 'PowerEdge R740', 'DLX9921', 'AA:BB:CC:DD:EE:01', '10.22.18.40', 'London Office', 'In Use', 'Supported', 1, 2),
('NYC-LT-042', 'Workstation', 'End User Computing', 'Apple', 'MacBook Pro', 'C02CG12345', '11:22:33:44:55:01', '10.12.34.87', 'New York HQ', 'Checked Out', 'End of Life', 4, 4),
('BER-RT-01', 'Router', 'Networking', 'Cisco', 'ISR 4331', 'CSX8829', '30:B1:B5:91:D7:01', '192.168.1.1', 'Berlin Factory', 'In Use', 'Supported', 1, NULL),
('SGP-CAM-02', 'Camera', 'IoT / Physical Security', 'TP-Link', 'Tapo C310', 'TPL99281', 'DC:62:79:8E:E4:01', '10.50.1.200', 'Singapore DC', 'Available', 'Supported', 2, NULL),
('NYC-LT-088', 'Workstation', 'End User Computing', 'Lenovo', 'ThinkPad T14', 'PF3J9X1', '44:55:66:77:88:01', '10.12.34.99', 'New York HQ', 'Checked Out', 'Supported', 3, 5),
('LON-SW-10', 'Switch', 'Networking', 'Juniper', 'EX4300', 'JUN11223', '99:88:77:66:55:01', '10.22.18.2', 'London Office', 'In Use', 'End of Life', 1, NULL),
('BER-LT-012', 'Workstation', 'End User Computing', 'Dell', 'Latitude 7420', 'LAT9912', '55:44:33:22:11:01', '192.168.1.55', 'Berlin Factory', 'Checked Out', 'Supported', 6, 8),
('SGP-SRV-99', 'Server', 'Data Center', 'HP', 'ProLiant DL380', 'HPE12345', '12:34:56:78:90:01', '10.50.1.10', 'Singapore DC', 'In Use', 'Supported', 1, NULL);

-- Software
INSERT INTO software_licenses (software_name, publisher, license_type, total_seats, expiry_date, os_support, brand_color) VALUES 
('Google Workspace Enterprise', 'Google', 'SaaS', 150, '2026-12-31', 'Web / Mobile', 'bg-blue-500'),
('Slack Enterprise Grid', 'Salesforce', 'SaaS', 150, '2026-10-15', 'Cross-platform', 'bg-purple-600'),
('Jira Software Premium', 'Atlassian', 'SaaS', 50, '2026-08-01', 'Web', 'bg-blue-600'),
('GitHub Enterprise', 'Microsoft', 'SaaS', 60, '2026-05-14', 'Web', 'bg-slate-800'),
('CrowdStrike Falcon', 'CrowdStrike', 'Endpoint Security', 200, '2026-09-22', 'Windows/macOS/Linux', 'bg-red-600'),
('Figma Organization', 'Figma', 'SaaS', 25, '2026-11-20', 'Web / macOS', 'bg-pink-500'),
('Notion Enterprise', 'Notion Labs', 'SaaS', 150, '2027-01-01', 'Cross-platform', 'bg-slate-900'),
('Datadog Pro', 'Datadog', 'Monitoring', 30, '2026-04-30', 'Cloud', 'bg-purple-500'),
('1Password Business', 'AgileBits', 'SaaS', 150, '2026-03-01', 'Cross-platform', 'bg-blue-700'),
('Zendesk Suite', 'Zendesk', 'SaaS', 15, '2026-07-15', 'Web', 'bg-emerald-600');


INSERT INTO asset_software (asset_id, software_id) VALUES 
(1, 5), (1, 8), 
(2, 1), (2, 2), (2, 4), (2, 5), (2, 6), (2, 9), 
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 7), (5, 9), 
(7, 1), (7, 2), (7, 5), (7, 9); 
-- Risks
INSERT INTO risks (asset_id, vulnerability, severity, risk_type, cvss_score, status) VALUES 
(1, 'CVE-2023-4911 (Looney Tunables)', 'Critical', 'OS Flaw', 10.0, 'Unpatched'),
(2, 'macOS Monterey EOL', 'High', 'OS EOL', 7.2, 'Open'),
(3, 'Default SSH Credentials', 'Critical', 'Misconfiguration', 9.8, 'Unpatched'),
(6, 'Juniper Firmware EOL', 'Medium', 'Firmware EOL', 5.5, 'Risk Accepted'),
(8, 'Missing CrowdStrike Agent', 'High', 'Compliance', 8.5, 'Open');