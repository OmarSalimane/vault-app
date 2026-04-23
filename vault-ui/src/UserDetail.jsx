import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Shield, Monitor, Mail, Briefcase, Activity, Save, UserX, UserCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('assets');
  
  // Edit Form State
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // IAM Check
  const currentUser = JSON.parse(localStorage.getItem('vault_user') || '{}');
  const canManageUsers = currentUser.role_id === 1; // IAM Administrator

  const fetchData = async () => {
    const token = localStorage.getItem('vault_token');
    try {
      const [userRes, groupRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/${id}`, { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch(`${API_BASE}/api/groups`, { headers: { 'Authorization': `Bearer ${token}` }})
      ]);

      const userData = await userRes.json();
      if (userRes.ok) {
        setData(userData);
        setEditForm({
          job_title: userData.user.job_title || '',
          group_id: userData.user.group_id || '',
          role_id: userData.user.role_id,
          is_active: userData.user.is_active
        });
      }
      if (groupRes.ok) setGroups(await groupRes.json());
    } catch (err) { console.error("Failed to load user details."); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` },
        body: JSON.stringify(editForm)
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'User profile updated successfully.' });
        fetchData();
      } else { setMessage({ type: 'error', text: result.error }); }
    } catch (err) { setMessage({ type: 'error', text: 'Server error during update.' }); }
    finally { setIsSaving(false); }
  };

  if (!data) return <div className="flex h-full items-center justify-center text-slate-400"><Activity className="animate-spin" size={32}/></div>;

  const { user, assets } = data;

  return (
    <div className="p-4 md:p-6 w-full h-full flex flex-col bg-[#111318] text-slate-200 overflow-y-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/members')} className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5eb1e6] to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                {user.first_name} {user.last_name}
                {!user.is_active && <span className="bg-rose-500/10 text-rose-400 text-xs px-2 py-1 rounded border border-rose-500/20">Account Disabled</span>}
              </h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><Mail size={14}/> {user.email}</span>
                <span className="flex items-center gap-1"><Briefcase size={14}/> {user.job_title || 'No Title'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg">
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><Monitor size={16}/> Assigned Hardware</p>
          <p className="text-3xl font-bold text-white truncate">{assets.length}</p>
        </div>
        <div className="bg-[#1a1d24] border border-slate-800 p-5 rounded-lg">
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><Briefcase size={16}/> Department</p>
          <p className="text-xl font-bold text-[#5eb1e6] truncate">{user.group_name || 'Unassigned'}</p>
        </div>
        <div className={`bg-[#1a1d24] border p-5 rounded-lg border-slate-800`}>
          <p className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2"><Shield size={16}/> IAM Policy Role</p>
          <p className={`text-xl font-bold text-purple-400`}>{user.role_name}</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg flex flex-col overflow-hidden min-h-[400px]">
        <div className="flex border-b border-slate-800 overflow-x-auto hide-scrollbar shrink-0">
          <button onClick={() => setActiveTab('assets')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'assets' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
            Hardware Custody
          </button>
          {canManageUsers && (
            <button onClick={() => setActiveTab('manage')} className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'manage' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
              Access & Policy Management
            </button>
          )}
        </div>

        {/* Tab: Assigned Assets */}
        {activeTab === 'assets' && (
          <div className="overflow-y-auto flex-1 p-0">
            {assets.length === 0 ? (
              <div className="p-8 text-center text-slate-500">This user currently holds no hardware assets.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#111318] text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr><th className="p-4">Hostname</th><th className="p-4">Device Type</th><th className="p-4">IP Address</th><th className="p-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {assets.map(a => (
                    <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)} className="hover:bg-slate-800/30 cursor-pointer group">
                      <td className="p-4 flex items-center gap-3 font-medium text-[#5eb1e6] group-hover:underline">
                        <Monitor size={14} className="text-slate-500"/> {a.hostname}
                      </td>
                      <td className="p-4 text-slate-300">{a.type}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{a.ip_address || 'N/A'}</td>
                      <td className="p-4"><span className="bg-[#111318] border border-slate-700 px-2 py-1 rounded text-xs">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Access Management */}
        {activeTab === 'manage' && canManageUsers && (
          <div className="p-6">
            <form onSubmit={handleUpdate} className="max-w-2xl">
              {message.text && (
                <div className={`p-3 mb-6 rounded text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {message.text}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Job Title</label>
                  <input type="text" value={editForm.job_title} onChange={e => setEditForm({...editForm, job_title: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Department Assignment</label>
                  <select value={editForm.group_id} onChange={e => setEditForm({...editForm, group_id: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]">
                    <option value="">-- No Department --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-5 border border-slate-700 bg-[#111318] rounded-lg mb-8">
                 <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-purple-400"/> Security Policy</h3>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">IAM Role Binding</label>
                      <select value={editForm.role_id} onChange={e => setEditForm({...editForm, role_id: e.target.value})} className="w-full bg-[#1a1d24] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-purple-500">
                        <option value={4}>Standard User (Read-only personal assets)</option>
                        <option value={3}>Security Analyst (Read-only global, Risk access)</option>
                        <option value={2}>IT Asset Manager (Hardware/Software CRUD)</option>
                        <option value={1}>IAM Administrator (User/Role CRUD)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                       <input type="checkbox" id="activeToggle" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} className="w-4 h-4 accent-purple-500 bg-[#1a1d24] border-slate-700 rounded" />
                       <label htmlFor="activeToggle" className="text-sm font-medium text-slate-300 select-none cursor-pointer flex items-center gap-2">
                         {editForm.is_active ? <UserCheck size={16} className="text-emerald-400"/> : <UserX size={16} className="text-rose-400"/>}
                         Account Login Enabled
                       </label>
                    </div>
                 </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2.5 px-6 rounded transition-colors disabled:opacity-50">
                  <Save size={18}/> {isSaving ? 'Updating Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}