import React, { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [userData, setUserData] = useState({ name: '', email: '', department: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('vault_user') || '{}');
    setUserData({
      name: storedUser.name || '',
      email: storedUser.email || '',
      department: storedUser.department || ''
    });
  }, []);

  const getToken = () => localStorage.getItem('vault_token');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setMessage({ type: 'info', text: 'Saving profile...' });
    
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ name: userData.name, department: userData.department })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML. Check backend container.");
      }

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        const storedUser = JSON.parse(localStorage.getItem('vault_user'));
        storedUser.name = `${data.firstName} ${data.lastName}`.trim();
        storedUser.department = userData.department;
        localStorage.setItem('vault_user', JSON.stringify(storedUser));
        
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setMessage({ type: 'error', text: "New password must be at least 6 characters." });
    
    setMessage({ type: 'info', text: 'Updating password...' });

    try {
      const response = await fetch(`${API_BASE}/api/users/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML. Check backend container.");
      }

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="p-4 md:p-6 w-full text-slate-200 h-full bg-[#111318] overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-[#5eb1e6]" size={24} /> Account Settings
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
            <TabButton 
              active={activeTab === 'general'} 
              onClick={() => {setActiveTab('general'); setMessage({type:'',text:''});}} 
              icon={<User size={18}/>} 
              label="General Profile" 
            />
            <TabButton 
              active={activeTab === 'security'} 
              onClick={() => {setActiveTab('security'); setMessage({type:'',text:''});}} 
              icon={<Lock size={18}/>} 
              label="Security & Passwords" 
            />
          </div>

          <div className="flex-1 bg-[#1a1d24] border border-slate-800 rounded-lg shadow-sm p-6">
            
            {message.text && (
                <div className={`p-3 mb-5 rounded text-sm font-medium ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400' : 
                    message.type === 'info' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                }`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'general' && (
              <form onSubmit={handleProfileSave}>
                <h2 className="text-lg font-semibold text-white mb-5 border-b border-slate-800 pb-3">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={userData.name} 
                      onChange={(e) => setUserData({...userData, name: e.target.value})} 
                      required
                      className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={userData.email} 
                      className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-slate-500 outline-none cursor-not-allowed" 
                      disabled 
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Department / Team</label>
                  <input 
                    type="text" 
                    value={userData.department} 
                    onChange={(e) => setUserData({...userData, department: e.target.value})} 
                    className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" 
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button type="submit" className="flex items-center gap-2 bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2 px-6 rounded transition-colors">
                    <Save size={16} /> Save Profile
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordSave}>
                <h2 className="text-lg font-semibold text-white mb-5 border-b border-slate-800 pb-3">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                    <input 
                      type="password" 
                      required
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="w-full bg-[#111318] border border-slate-700 rounded p-2.5 text-white outline-none focus:border-[#5eb1e6]" 
                    />
                  </div>
                  <button type="submit" className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded mt-2 transition-colors">
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      type="button"
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${active ? 'bg-[#5eb1e6]/10 text-[#5eb1e6]' : 'text-slate-400 hover:bg-[#1a1d24] hover:text-slate-200'}`}
    >
      {icon} {label}
    </button>
  );
}