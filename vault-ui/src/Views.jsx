import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Monitor, Plus, Activity } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Views() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('vault_token');
    fetch(`${API_BASE}/api/assets`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(data => setAssets(Array.isArray(data) ? data : []));
    fetch(`${API_BASE}/api/stats/all`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(data => setStats(data));
  }, []);

  const filtered = assets.filter(a => a.hostname.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col bg-[#111318] text-slate-200">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-white">Global Asset Inventory</h1>
        <button onClick={() => navigate('/assets/new')} className="flex items-center gap-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 px-4 py-2 rounded font-bold transition-colors">
          <Plus size={16} /> Create Asset
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 shrink-0">
          <div className="bg-[#1a1d24] border border-slate-800 rounded-lg p-4 h-56 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Assets by Department</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {stats.departments.map(dept => (
                <div key={dept.label} className="w-full">
                  <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{dept.label}</span><span>{dept.value}</span></div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#5eb1e6] h-full" style={{ width: `${(dept.value / stats.totals.total_assets) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#1a1d24] border border-slate-800 rounded-lg p-4 h-56 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-100 mb-4">Assets by Location</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {stats.locations.map(loc => (
                <div key={loc.label} className="w-full">
                  <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{loc.label}</span><span>{loc.count}</span></div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: `${(loc.count / stats.totals.total_assets) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center bg-[#111318] border border-slate-700 rounded px-3 py-1.5 w-[300px]">
            <Search size={14} className="text-slate-500 mr-2" />
            <input type="text" placeholder="Search hostname..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111318] text-slate-400 sticky top-0 border-b border-slate-800">
              <tr><th className="p-4">Hostname</th><th className="p-4">Category</th><th className="p-4">Department</th><th className="p-4">IP Address</th><th className="p-4">MAC Address</th><th className="p-4">Manufacturer</th><th className="p-4">Model</th><th className="p-4">Serial</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(a => (
                <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)} className="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                  <td className="p-4 font-medium text-[#5eb1e6] flex items-center gap-2"><Monitor size={16}/> {a.hostname}</td>
                  <td className="p-4"><span className="bg-slate-800 px-2 py-1 rounded text-[11px]">{a.category}</span></td>
                  <td className="p-4">{a.department_name || 'Unassigned'}</td>
                  <td className="p-4 text-slate-300 font-mono text-xs">{a.ip_address}</td><td className="p-4 font-mono text-xs">{a.mac_address}</td>
                  <td className="p-4">{a.manufacturer}</td><td className="p-4">{a.model}</td><td className="p-4 font-mono">{a.serial_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}