import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Mail, Shield, UserCheck, UserX, X, Activity, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Members() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', email: '', password: 'password123', job_title: '', role_id: 4, group_id: '' });
  const [message, setMessage] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('vault_user') || '{}');
  const canManageUsers = currentUser.role_id === 1; // IAM Admin

  const fetchData = async () => {
    setLoading(true);
    setTableError(null);
    const token = localStorage.getItem('vault_token');
    
    try {
      const res = await fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }});
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Server communication failed. Please check backend logs.");
      }

      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      } else {
        throw new Error(data.error || "Failed to load user data.");
      }

      if (canManageUsers) {
        const groupRes = await fetch(`${API_BASE}/api/groups`, { headers: { 'Authorization': `Bearer ${token}` }});
        if (groupRes.ok) setGroups(await groupRes.json());
      }
    } catch (err) { 
      setTableError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else { setMessage(data.error); }
    } catch (err) { setMessage('Server error during creation.'); }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-6 w-full text-slate-200 flex flex-col h-full bg-[#111318]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={24} className="text-[#5eb1e6]" /> Organization Users</h1>
        {canManageUsers && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 rounded font-bold transition-colors">
            <Plus size={16} /> Provision User
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-[#1a1d24] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center bg-[#111318] border border-slate-700 rounded px-3 py-1.5 w-full sm:max-w-[350px]">
            <Search size={14} className="text-slate-500 mr-2" />
            <input type="text" placeholder="Search name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none text-sm w-full text-slate-200" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? <div className="flex h-32 items-center justify-center text-slate-500"><Activity className="animate-spin"/></div> : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#111318] text-slate-400 font-semibold border-b border-slate-800 text-xs sticky top-0">
                <tr><th className="p-4 w-10"></th><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Department</th><th className="p-4">IAM Role</th><th className="p-4 text-center">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tableError ? (
                  <tr><td colSpan="6" className="p-8 text-center text-rose-400 bg-rose-500/10"><ShieldAlert className="mx-auto mb-2" size={32}/>{tableError}</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">No users match your criteria.</td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="hover:bg-slate-800/40 cursor-pointer group text-xs font-medium">
                      <td className="p-4 text-center">
                         <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{u.name.charAt(0)}</div>
                      </td>
                      <td className="p-4 text-[#5eb1e6] group-hover:underline">{u.name}<div className="text-[10px] text-slate-500 font-normal">{u.job_title}</div></td>
                      <td className="p-4 text-slate-400 flex items-center gap-2"><Mail size={12}/> {u.email}</td>
                      <td className="p-4">{u.department || '--'}</td>
                      <td className="p-4 flex items-center gap-1.5"><Shield size={12} className={u.role_name === 'Standard User' ? 'text-slate-500' : 'text-purple-400'}/> {u.role_name}</td>
                      <td className="p-4 text-center">
                        {u.is_active ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[11px]"><UserCheck size={12} className="inline mr-1"/>Active</span> : <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded text-[11px]"><UserX size={12} className="inline mr-1"/>Disabled</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d24] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#111318]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-[#5eb1e6]"/> Provision New User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {message && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-sm">{message}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-slate-400 mb-1">First Name</label><input required value={newUser.first_name} onChange={e=>setNewUser({...newUser, first_name: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">Last Name</label><input required value={newUser.last_name} onChange={e=>setNewUser({...newUser, last_name: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none" /></div>
                <div className="col-span-2"><label className="block text-sm text-slate-400 mb-1">Email Address</label><input type="email" required value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none" /></div>
                <div><label className="block text-sm text-slate-400 mb-1">Job Title</label><input value={newUser.job_title} onChange={e=>setNewUser({...newUser, job_title: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none" /></div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Department</label>
                  <select value={newUser.group_id} onChange={e=>setNewUser({...newUser, group_id: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none">
                    <option value="">-- No Department --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">IAM Security Role</label>
                  <select value={newUser.role_id} onChange={e=>setNewUser({...newUser, role_id: e.target.value})} className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none">
                    <option value={4}>Standard User (Read-only personal assets)</option>
                    <option value={3}>Security Analyst (Read-only global, Risk access)</option>
                    <option value={2}>IT Asset Manager (Hardware/Software CRUD)</option>
                    <option value={1}>IAM Administrator (User/Role CRUD)</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white px-4 py-2">Cancel</button>
                <button type="submit" className="bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2 px-6 rounded">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}