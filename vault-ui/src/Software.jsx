import React, { useState, useEffect } from 'react';
import { Globe, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Software() {
  const [software, setSoftware] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/software`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` } })
      .then(r => r.json()).then(data => setSoftware(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="p-6 w-full h-full flex flex-col bg-[#111318] text-slate-200">
      <h1 className="text-2xl font-bold mb-6 text-white">Software & Licenses</h1>
      <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#111318] text-slate-400 sticky top-0 border-b border-slate-800">
              <tr><th className="p-4">Software Name</th><th className="p-4">Publisher</th><th className="p-4">License Type</th><th className="p-4">Seats (Used/Total)</th><th className="p-4">OS Support</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {software.map(s => (
                <tr key={s.id} onClick={() => navigate(`/software/${s.id}`)} className="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${s.brand_color}`}></div> {s.software_name}
                  </td>
                  <td className="p-4">{s.publisher}</td><td className="p-4">{s.license_type}</td>
                  <td className="p-4 font-bold text-slate-300">{s.seats_used} / {s.total_seats}</td><td className="p-4">{s.os_support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}