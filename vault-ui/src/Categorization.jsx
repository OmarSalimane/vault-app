import React, { useState, useEffect } from 'react';
import { Search, Plus, Info, X, Tag, MoreHorizontal, Activity, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Categorization() {
  const [showBanner, setShowBanner] = useState(true);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('vault_user') || '{}');
  const canManageAssets = user.role_id === 2;

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Server communication failed. Please restart the backend container.");
      }

      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setGroups(data);
        setTableError(null);
      } else {
        throw new Error(data.error || "Failed to load group data.");
      }
    } catch (err) {
      setTableError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/groups`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vault_token')}`
        },
        body: JSON.stringify({ group_name: newGroup.name, description: newGroup.description })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setNewGroup({ name: '', description: '' });
        fetchGroups(); // Fetch the new data instantly
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (err) {
      setError('Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGroups = groups.filter(g => g.group_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-6 w-full text-slate-200 flex flex-col h-full bg-[#111318] relative">
      
      <div className="flex items-center gap-6 mb-6 border-b border-slate-800 pb-4 shrink-0">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Tag size={24} className="text-[#5eb1e6]"/> Asset Categorization</h1>
      </div>

      {showBanner && (
        <div className="flex items-start justify-between bg-[#195e94]/40 border border-[#195e94] text-white p-4 rounded-lg mb-6 shrink-0">
          <div className="flex gap-3">
            <Info size={20} className="mt-0.5 text-[#5eb1e6]" />
            <div>
              <h3 className="font-semibold text-sm">Dynamic Asset Organization</h3>
              <p className="text-sm text-slate-300 mt-1">
                Create departments or logical groups here. When provisioning new assets, you can assign them directly to these categories.
              </p>
            </div>
          </div>
          <X size={18} className="cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowBanner(false)} />
        </div>
      )}

      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-slate-100">Registered Groups</h2>
        {canManageAssets && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 rounded font-bold transition-colors shadow-lg shadow-[#5eb1e6]/20">
            <Plus size={16} /> Create Group
          </button>
        )}
      </div>

      <div className="bg-[#1a1d24] border border-slate-800 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center bg-[#111318] border border-slate-700 rounded px-3 py-1.5 w-full md:w-[300px] focus-within:border-[#5eb1e6] transition-colors">
            <Search size={14} className="text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search by group name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-slate-200 placeholder-slate-600" 
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-500"><Activity className="animate-spin" /></div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap">
              <thead className="bg-[#111318] text-slate-400 font-semibold border-b border-slate-800 text-xs sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-48">Group Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 w-32 text-center">Tracked Assets</th>
                  <th className="p-4 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tableError ? (
                  <tr><td colSpan="4" className="p-8 text-center text-rose-400 bg-rose-500/10"><ShieldAlert className="mx-auto mb-2" size={32}/>{tableError}</td></tr>
                ) : filteredGroups.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">No groups found in the database.</td></tr>
                ) : (
                  filteredGroups.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors text-xs font-medium group">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[#5eb1e6]">
                          <Tag size={14} className="transform -rotate-90" />
                        </div>
                        <span className="font-semibold text-white">{row.group_name}</span>
                      </td>
                      <td className="p-4 text-slate-400 truncate max-w-xs" title={row.description}>
                        {row.description || '--'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-[#111318] text-[#5eb1e6] font-bold px-3 py-1.5 rounded-md border border-slate-700">
                          {row.asset_count || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <MoreHorizontal size={16} className="text-slate-600 group-hover:text-slate-300 cursor-pointer inline-block" />
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
          <div className="bg-[#1a1d24] border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#111318]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Plus size={18} className="text-[#5eb1e6]"/> New Asset Group</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="p-6">
              {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-sm">{error}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Group / Department Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required autoFocus
                    placeholder="e.g., Human Resources" 
                    value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6] transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Description (Optional)</label>
                  <textarea 
                    rows="3"
                    placeholder="What is this group used for?" 
                    value={newGroup.description} onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6] transition-colors resize-none" 
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2 px-6 rounded transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}