import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Monitor, ShieldAlert, Disc, User, MapPin, Activity, Save } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('specs');
  
  // Edit Form State
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // IAM Check
  const currentUser = JSON.parse(localStorage.getItem('vault_user') || '{}');
  const canManageAssets = currentUser.role_id === 2; // IT Asset Manager

  const fetchData = async () => {
    const token = localStorage.getItem('vault_token');
    try {
      const [assetRes, userRes, groupRes] = await Promise.all([
        fetch(`${API_BASE}/api/assets/${id}`, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(`${API_BASE}/api/groups`, { headers: { 'Authorization': `Bearer ${token}` }})
      ]);

      const assetData = await assetRes.json();
      if (assetRes.ok) {
        setData(assetData);
        setEditForm({
          status: assetData.asset.status,
          location: assetData.asset.location || '',
          department_id: assetData.asset.department_id || '',
          custodian_id: assetData.asset.custodian_id || '',
          os_lifecycle: assetData.asset.os_lifecycle
        });
      }
      
      if (userRes.ok) setUsers(await userRes.json());
      if (groupRes.ok) setGroups(await groupRes.json());
    } catch (err) {
      console.error("Failed to load asset details.");
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` },
        body: JSON.stringify(editForm)
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Asset updated successfully.' });
        fetchData(); // Refresh data
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error during update.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return <div className="flex h-full items-center justify-center text-slate-400"><Activity className="animate-spin" size={32}/></div>;

  const { asset, software, risks } = data;

  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col bg-[#111318] text-slate-200 overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assets/views')} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Monitor className="text-[#5eb1e6]"/> {asset.hostname}
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-mono">{asset.mac_address || 'No MAC'} • {asset.ip_address || 'DHCP'}</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Last Scan</p>
          <p className="text-sm text-slate-300 font-mono">{new Date(asset.last_scan).toLocaleString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg">
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><User size={16}/> Assigned Custodian</p>
          <p className="text-xl font-bold text-white truncate">{asset.custodian_name || 'Available in Inventory'}</p>
          <p className="text-xs text-slate-500 mt-1 bg-slate-800 inline-block px-2 py-0.5 rounded">{asset.department_name || 'No Department'}</p>
        </div>
        <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg">
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><MapPin size={16}/> Current Status</p>
          <p className="text-xl font-bold text-[#5eb1e6] truncate">{asset.status}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{asset.location || 'Unknown Location'}</p>
        </div>
        <div className={`bg-[#1a1d24] border p-5 rounded-lg ${asset.os_lifecycle === 'End of Life' ? 'border-rose-900/50 bg-rose-500/5' : 'border-slate-800'}`}>
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><Activity size={16}/> OS Lifecycle</p>
          <p className={`text-xl font-bold ${asset.os_lifecycle === 'End of Life' ? 'text-rose-400' : 'text-emerald-400'}`}>
            {asset.os_lifecycle}
          </p>
          <p className="text-xs text-slate-500 mt-1">{risks.length} Active Vulnerabilities</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg flex flex-col overflow-hidden min-h-[400px]">
        <div className="flex border-b border-slate-800 overflow-x-auto hide-scrollbar shrink-0">
          <button onClick={() => setActiveTab('specs')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'specs' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
            Hardware & Identity
          </button>
          <button onClick={() => setActiveTab('software')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'software' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
            Installed Software <span className="bg-slate-800 text-slate-300 py-0.5 px-2 rounded-full text-[10px]">{software.length}</span>
          </button>
          {canManageAssets && (
            <button onClick={() => setActiveTab('manage')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'manage' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
              Manage Assignment
            </button>
          )}
        </div>

        {/* Tab: Specs */}
        {activeTab === 'specs' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Hardware Info</h3>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">Manufacturer</span><span className="font-medium text-slate-200">{asset.manufacturer || '--'}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">Model</span><span className="font-medium text-slate-200">{asset.model || '--'}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">Category</span><span className="font-medium text-slate-200">{asset.category}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">Device Type</span><span className="font-medium text-slate-200">{asset.type}</span></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Network & Identity</h3>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">Domain</span><span className="font-medium text-slate-200">{asset.domain}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">IPv4 Address</span><span className="font-mono text-slate-300">{asset.ip_address || '--'}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">MAC Address</span><span className="font-mono text-slate-300">{asset.mac_address || '--'}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm"><span className="text-slate-500">Serial Number</span><span className="font-mono text-[#5eb1e6]">{asset.serial_number}</span></div>
            </div>
          </div>
        )}

        {/* Tab: Software & Risks */}
        {activeTab === 'software' && (
          <div className="overflow-y-auto flex-1 p-0">
            {software.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No managed software licenses detected on this asset.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/50">
                  {software.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="p-4 flex items-center gap-3 font-medium text-white">
                        <div className={`w-3 h-3 rounded-sm ${s.brand_color}`}></div> {s.software_name}
                      </td>
                      <td className="p-4 text-slate-400">{s.publisher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {risks.length > 0 && (
              <div className="mt-8 border-t border-slate-800">
                <div className="bg-rose-900/10 p-3 border-b border-slate-800 flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <ShieldAlert size={16}/> Active Vulnerabilities Detected
                </div>
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-800/50">
                    {risks.map(r => (
                      <tr key={r.id} className="hover:bg-slate-800/30">
                        <td className="p-4 text-slate-300">{r.vulnerability}</td>
                        <td className="p-4"><span className="bg-rose-500/10 text-rose-400 font-bold px-2 py-1 rounded text-xs border border-rose-500/20">{r.severity}</span></td>
                        <td className="p-4 font-mono text-slate-400 text-xs">CVSS {r.cvss_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Manage Assignment */}
        {activeTab === 'manage' && canManageAssets && (
          <div className="p-6">
            <form onSubmit={handleUpdate} className="max-w-2xl">
              {message.text && (
                <div className={`p-3 mb-6 rounded text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {message.text}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Asset Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]">
                    <option value="Available">Available (In Stock)</option>
                    <option value="Checked Out">Checked Out (In Use)</option>
                    <option value="In Maintenance">In Maintenance</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Physical Location</label>
                  <input type="text" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="e.g. Server Room Rack A" className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Assign to User</label>
                  <select value={editForm.custodian_id} onChange={e => setEditForm({...editForm, custodian_id: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]">
                    <option value="">-- Unassigned (Inventory) --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.job_title})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Assign to Department</label>
                  <select value={editForm.department_id} onChange={e => setEditForm({...editForm, department_id: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]">
                    <option value="">-- No Department --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2.5 px-6 rounded transition-colors disabled:opacity-50">
                  <Save size={18}/> {isSaving ? 'Updating System...' : 'Save Asset Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}