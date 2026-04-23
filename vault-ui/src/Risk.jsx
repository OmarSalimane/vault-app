import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertOctagon, Activity } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RiskInsights() {
  const [risks, setRisks] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('vault_token');
    fetch(`${API_BASE}/api/risks`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(data => setRisks(Array.isArray(data) ? data : []));
    fetch(`${API_BASE}/api/stats/all`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).then(data => setStats(data));
  }, []);

  return (
    <div className="p-6 w-full h-full flex flex-col bg-[#111318] text-slate-200">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShieldAlert className="text-red-500" /> Risk Insights</h1>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0">
          <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg flex flex-col justify-center relative overflow-hidden">
            <div className="text-sm font-medium text-slate-400 mb-1">Total Active Risks</div>
            <div className="text-4xl font-bold text-white">{risks.length}</div>
            <Activity size={80} className="absolute -right-4 -bottom-4 text-slate-700/20" />
          </div>
          
          <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg col-span-2">
             <h3 className="text-sm font-semibold text-slate-100 mb-3">Risk Severity Distribution</h3>
             <div className="flex gap-4">
               {stats.risks.map(risk => {
                 const color = risk.label === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                               risk.label === 'High' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 
                               'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                 return (
                   <div key={risk.label} className={`flex-1 border rounded-lg p-3 ${color} flex flex-col items-center justify-center`}>
                      <span className="text-3xl font-bold">{risk.count}</span>
                      <span className="text-xs uppercase font-bold tracking-wider mt-1">{risk.label}</span>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#111318] text-slate-400 border-b border-slate-800">
            <tr><th className="p-4">Asset</th><th className="p-4">Vulnerability</th><th className="p-4 text-center">Severity</th><th className="p-4 text-center">CVSS</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {risks.map(r => (
              <tr key={r.id} className="hover:bg-slate-800/50">
                <td className="p-4 font-medium text-[#5eb1e6]">{r.asset_name}<div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.ip}</div></td>
                <td className="p-4 text-slate-300">{r.vulnerability}</td>
                <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${r.severity === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>{r.severity}</span></td>
                <td className="p-4 text-center font-mono">{r.cvss_score}</td>
                <td className="p-4 text-red-400">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}