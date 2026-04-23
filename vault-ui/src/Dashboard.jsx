import React, { useState, useEffect } from 'react';
import { Monitor, Activity, Server, Users, Disc, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  
  // Get user info and calculate a nice greeting
  const user = JSON.parse(localStorage.getItem('vault_user') || '{"name": "User"}');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const token = localStorage.getItem('vault_token');
    fetch(`${API_BASE}/api/dashboard/full`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
    .then(r => r.json())
    .then(fetchedData => setData(fetchedData))
    .catch(err => console.error("Failed to load dashboard:", err));
  }, []);

  if (!data) return (
    <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-4">
      <Activity className="animate-spin text-[#5eb1e6]" size={36} />
      <p className="animate-pulse">Loading secure telemetry...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 md:px-8 w-full text-slate-200 h-full overflow-y-auto max-w-[1400px] mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <span className="flex w-2 h-2 rounded-full bg-emerald-500 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            </span>
            System operations normal. Data synced just now.
          </p>
        </div>
        <button onClick={() => navigate('/assets/new')} className="bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2 px-5 rounded-lg transition-colors shadow-lg shadow-[#5eb1e6]/20">
          + Provision Asset
        </button>
      </div>

      {/* 1. KPI Tier (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <KPICard title="Total Assets" value={data.kpis.assets} icon={<Monitor size={20} className="text-[#5eb1e6]"/>} trend="+12 this month" />
        <KPICard title="Active Users" value={data.kpis.users} icon={<Users size={20} className="text-emerald-400"/>} trend="Stable" />
        <KPICard title="Software Licenses" value={data.kpis.software} icon={<Disc size={20} className="text-purple-400"/>} trend="2 expiring soon" />
        <KPICard title="Open Threats" value={data.kpis.risks} icon={<ShieldAlert size={20} className="text-rose-400"/>} trend="Action required" isAlert />
      </div>

      {/* 2. Analytics Tier (2 Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        
        {/* Category Distribution Chart */}
        <div className="bg-[#1a1d24] border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-100 mb-5 flex items-center justify-between">
            Infrastructure by Category <span className="text-xs font-normal text-slate-500 hover:text-[#5eb1e6] cursor-pointer">View Details</span>
          </h3>
          <div className="space-y-4">
            {data.charts.categories.map((cat, i) => {
              const colors = ['bg-[#5eb1e6]', 'bg-emerald-400', 'bg-purple-400', 'bg-orange-400'];
              const pct = Math.round((cat.value / data.kpis.assets) * 100) || 0;
              return (
                <div key={cat.label} className="w-full">
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                    <span>{cat.label}</span>
                    <span className="text-slate-500">{cat.value} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#111318] h-2 rounded-full overflow-hidden border border-slate-800/50">
                    <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Posture Chart */}
        <div className="bg-[#1a1d24] border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-100 mb-5 flex items-center justify-between">
            Active Risk Posture <span className="text-xs font-normal text-slate-500 hover:text-rose-400 cursor-pointer">Open Triage</span>
          </h3>
          <div className="flex h-32 items-end justify-around pb-2 border-b border-slate-800/50 mb-4 px-4">
            {data.charts.risks.map(risk => {
              const h = `${Math.max((risk.value / data.kpis.risks) * 100, 10)}%`;
              const isCrit = risk.label === 'Critical';
              return (
                <div key={risk.label} className="flex flex-col items-center justify-end w-16 h-full group">
                  <span className={`text-xs mb-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isCrit ? 'text-rose-400' : 'text-orange-400'}`}>{risk.value}</span>
                  <div className={`w-full rounded-t-sm transition-all duration-500 ${isCrit ? 'bg-gradient-to-t from-rose-900/40 to-rose-500' : 'bg-gradient-to-t from-orange-900/40 to-orange-400'}`} style={{ height: h }}></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-around text-xs text-slate-400 font-medium tracking-wide">
            {data.charts.risks.map(risk => <span key={risk.label}>{risk.label.toUpperCase()}</span>)}
          </div>
        </div>
      </div>

      {/* 3. Operational Tier (Split Table & Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 pb-8">
        
        {/* Recent Assets Table (Takes up 2/3 of space) */}
        <div className="lg:col-span-2 bg-[#1a1d24] border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-gradient-to-b from-slate-800/20 to-transparent">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2"><Server size={16} className="text-slate-400"/> Recently Provisioned Assets</h3>
            <button onClick={() => navigate('/assets/views')} className="text-xs text-[#5eb1e6] hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111318]/80 text-slate-400 text-xs uppercase tracking-wider">
                <tr><th className="px-5 py-3 font-medium">Hostname</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 font-medium">IP Address</th><th className="px-5 py-3 font-medium">Department</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.feeds.recentAssets.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5 font-medium text-white group-hover:text-[#5eb1e6] transition-colors">{a.hostname}</td>
                    <td className="px-5 py-3.5 text-slate-300">{a.type}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{a.ip_address || 'DHCP'}</td>
                    <td className="px-5 py-3.5"><span className="bg-[#111318] border border-slate-700/50 px-2.5 py-1 rounded-md text-[11px] text-slate-300">{a.department || 'Unassigned'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Threat Feed (Takes up 1/3 of space) */}
        <div className="bg-[#1a1d24] border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-rose-900/10 to-transparent">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><AlertTriangle size={16} className="text-rose-500"/> Critical Alert Feed</h3>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            {data.feeds.topRisks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No critical threats detected.</div>
            ) : (
              <ul className="space-y-1">
                {data.feeds.topRisks.map(risk => (
                  <li key={risk.id} className="p-3 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-rose-400 truncate pr-2" title={risk.vulnerability}>{risk.vulnerability}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1"><Clock size={10}/> 2h</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600"></span> Affected: <span className="text-slate-300 font-medium">{risk.hostname}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 border-t border-slate-800 text-center">
            <button onClick={() => navigate('/risk')} className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors">Open Security Center →</button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable KPI Component
function KPICard({ title, value, icon, trend, isAlert }) {
  return (
    <div className={`bg-[#1a1d24] border ${isAlert ? 'border-rose-900/50 shadow-rose-900/10' : 'border-slate-800 shadow-black/20'} rounded-xl p-5 shadow-lg relative overflow-hidden group`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${isAlert ? 'bg-rose-500' : 'bg-[#5eb1e6]'}`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className={`p-2 rounded-lg ${isAlert ? 'bg-rose-500/10' : 'bg-[#111318] border border-slate-800'}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className={`text-xs font-medium ${isAlert ? 'text-rose-400' : 'text-slate-500'}`}>{trend}</p>
      </div>
    </div>
  );
}