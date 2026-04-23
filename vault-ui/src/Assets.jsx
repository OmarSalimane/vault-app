import React, { useState, useEffect } from 'react';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA FROM REAL BACKEND
  useEffect(() => {
    fetch('http://35.178.42.137/api/assets')
      .then(res => res.json())
      .then(data => {
        setAssets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch assets:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-white">Loading Items...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
           <span className="text-blue-500">💻</span> Managed Hardware
        </h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-500 transition-colors">+ Create Asset</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {assets.map(asset => (
          <div key={asset.id} className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm relative p-4 hover:border-slate-600 transition-colors">
            <span className={`text-xs px-2 py-1 rounded-full mb-3 inline-block font-medium ${asset.custody !== '--' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'bg-green-500/20 text-green-400 border border-green-500/20'}`}>
              {asset.custody !== '--' ? 'Assigned' : 'Available'}
            </span>
            <h3 className="font-bold text-slate-100 mb-4">{asset.name}</h3>
            
            <div className="grid grid-cols-2 gap-y-3 text-xs text-slate-400">
              <span>Serial Number</span> <span className="text-right text-slate-200 font-medium">{asset.sn || 'N/A'}</span>
              <span>Type</span> <span className="text-right text-slate-200">{asset.type}</span>
              <span>IP Address</span> <span className="text-right text-slate-200">{asset.ip || 'N/A'}</span>
              <span>Custody</span> <span className="text-right text-blue-400 font-medium">{asset.custody}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}