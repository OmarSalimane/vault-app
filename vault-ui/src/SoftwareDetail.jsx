import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Disc, Users, AlertTriangle, Monitor, ShieldX, Plus, Save } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SoftwareDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [allAssets, setAllAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('assignments');
  
  // Edit State
  const [editSeats, setEditSeats] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [assignAssetId, setAssignAssetId] = useState('');

  // IAM Check
  const user = JSON.parse(localStorage.getItem('vault_user') || '{}');
  const canManageSoftware = user.role_id === 2; // IT Asset Manager

  const fetchDetails = async () => {
    const token = localStorage.getItem('vault_token');
    const res = await fetch(`${API_BASE}/api/software/${id}`, { headers: { 'Authorization': `Bearer ${token}` }});
    const result = await res.json();
    if (res.ok) {
      setData(result);
      setEditSeats(result.software.total_seats);
      // Format date for the input field
      setEditExpiry(result.software.expiry_date ? result.software.expiry_date.split('T')[0] : '');
    }
  };

  const fetchAssets = async () => {
    const res = await fetch(`${API_BASE}/api/assets`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` }});
    const result = await res.json();
    if (res.ok) setAllAssets(result);
  };

  useEffect(() => {
    fetchDetails();
    fetchAssets();
  }, [id]);

  const handleUpdateLicense = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/api/software/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` },
      body: JSON.stringify({ total_seats: editSeats, expiry_date: editExpiry })
    });
    fetchDetails();
    setActiveTab('assignments');
  };

  const handleRevoke = async (assetId) => {
    if (!window.confirm("Are you sure you want to revoke this license seat?")) return;
    await fetch(`${API_BASE}/api/software/${id}/revoke/${assetId}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` }
    });
    fetchDetails();
  };

  const handleAssign = async () => {
    if (!assignAssetId) return;
    await fetch(`${API_BASE}/api/software/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` },
      body: JSON.stringify({ asset_id: assignAssetId })
    });
    setAssignAssetId('');
    fetchDetails();
  };

  if (!data) return <div className="p-8 text-slate-400 animate-pulse">Loading license data...</div>;

  const sw = data.software;
  const assignments = data.assignments;
  const availableSeats = sw.total_seats - sw.seats_used;
  const isOverProvisioned = availableSeats < 0;

  // Filter out assets that already have this software installed
  const assignableAssets = allAssets.filter(a => !assignments.find(assigned => assigned.asset_id === a.id));

  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col bg-[#111318] text-slate-200 overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/software')} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className={`w-4 h-4 rounded-sm ${sw.brand_color}`}></div> {sw.software_name}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{sw.publisher} • {sw.license_type} License</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg">
          <p className="text-sm font-medium text-slate-400 mb-1">Total Purchased Seats</p>
          <p className="text-3xl font-bold text-white">{sw.total_seats}</p>
        </div>
        <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg">
          <p className="text-sm font-medium text-slate-400 mb-1">Seats in Use</p>
          <p className="text-3xl font-bold text-[#5eb1e6] flex items-center gap-2">
            {sw.seats_used} <Users size={16} className="text-slate-500"/>
          </p>
        </div>
        <div className={`bg-[#1a1d24] border p-5 rounded-lg ${isOverProvisioned ? 'border-rose-900/50 bg-rose-500/5' : 'border-slate-800'}`}>
          <p className="text-sm font-medium text-slate-400 mb-1">Available Seats</p>
          <p className={`text-3xl font-bold ${isOverProvisioned ? 'text-rose-400' : 'text-emerald-400'}`}>
            {availableSeats}
            {isOverProvisioned && <AlertTriangle size={20} className="inline ml-2 text-rose-500" />}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg flex flex-col overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button onClick={() => setActiveTab('assignments')} className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'assignments' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
            Active Assignments
          </button>
          {canManageSoftware && (
            <button onClick={() => setActiveTab('edit')} className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'edit' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
              Manage Contract & Seats
            </button>
          )}
        </div>

        {/* Tab: Assignments */}
        {activeTab === 'assignments' && (
          <div className="flex flex-col h-full">
            {canManageSoftware && (
              <div className="p-4 border-b border-slate-800 bg-[#111318]/50 flex gap-3 items-center">
                <select value={assignAssetId} onChange={(e) => setAssignAssetId(e.target.value)} className="bg-[#1a1d24] border border-slate-700 rounded p-2 text-sm text-slate-200 outline-none w-64">
                  <option value="">-- Select an Asset to Provision --</option>
                  {assignableAssets.map(a => <option key={a.id} value={a.id}>{a.hostname} ({a.custodian_name || 'Unassigned'})</option>)}
                </select>
                <button onClick={handleAssign} disabled={!assignAssetId} className="flex items-center gap-2 px-4 py-2 bg-[#5eb1e6] text-slate-900 rounded text-sm font-bold disabled:opacity-50 transition-colors">
                  <Plus size={16}/> Provision Seat
                </button>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111318] text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr><th className="p-4">Assigned Asset</th><th className="p-4">Type</th><th className="p-4">Benefiting Account (Custodian)</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {assignments.length === 0 ? (
                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">No seats currently allocated.</td></tr>
                  ) : (
                    assignments.map(a => (
                      <tr key={a.asset_id} className="hover:bg-slate-800/30 text-slate-300">
                        <td className="p-4 font-medium flex items-center gap-2"><Monitor size={14} className="text-slate-500"/> {a.hostname}</td>
                        <td className="p-4">{a.type}</td>
                        <td className="p-4 font-medium text-[#5eb1e6]">{a.custodian_name || <span className="text-slate-500 font-normal">Unassigned</span>}</td>
                        <td className="p-4 text-right">
                          {canManageSoftware ? (
                            <button onClick={() => handleRevoke(a.asset_id)} className="text-rose-400 hover:text-rose-300 flex items-center justify-end gap-1 ml-auto text-xs font-semibold px-2 py-1 rounded hover:bg-rose-500/10 transition-colors">
                              <ShieldX size={14}/> Revoke Seat
                            </button>
                          ) : <span className="text-slate-600 text-xs">Locked</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Edit Contract */}
        {activeTab === 'edit' && canManageSoftware && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Contract Specifications</h3>
            <form onSubmit={handleUpdateLicense} className="max-w-md space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Total Licensed Seats</label>
                <input 
                  type="number" min={sw.seats_used} required 
                  value={editSeats} onChange={e => setEditSeats(e.target.value)}
                  className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" 
                />
                <p className="text-xs text-slate-500 mt-1">Cannot be set lower than currently active assignments ({sw.seats_used}).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Contract Expiry Date</label>
                <input 
                  type="date" 
                  value={editExpiry} onChange={e => setEditExpiry(e.target.value)}
                  className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" 
                />
              </div>
              <button type="submit" className="flex items-center gap-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2 px-6 rounded transition-colors mt-4">
                <Save size={16}/> Save Updates
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}