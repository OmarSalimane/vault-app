import React, { useState, useEffect, useRef } from 'react';
import { Server, Lock, UploadCloud, FileText, CheckCircle2, ShieldAlert, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function NewAsset() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Form State
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    hostname: '', type: 'Workstation', category: 'End User Computing', manufacturer: '', model: '', serial_number: '', mac_address: '', ip_address: '', location: '', department_id: '', status: 'Available', os_lifecycle: 'Supported'
  });

  // Bulk Upload State
  const [dragActive, setDragActive] = useState(false);
  const [parsedAssets, setParsedAssets] = useState([]);
  const fileInputRef = useRef(null);

  // IAM Check
  const user = JSON.parse(localStorage.getItem('vault_user') || '{}');
  const canManageAssets = user.role_id === 2;

  useEffect(() => {
    if (canManageAssets) {
        fetch(`${API_BASE}/api/groups`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` } })
        .then(res => res.json()).then(data => setDepartments(Array.isArray(data) ? data : []));
    }
  }, [canManageAssets]);

  if (!canManageAssets) return <div className="p-8 text-center text-rose-400"><Lock className="mx-auto mb-4" size={48}/><h2>Access Restricted. IT Asset Managers only.</h2></div>;

  // --- MANUAL FORM LOGIC ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${API_BASE}/api/assets`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` }, body: JSON.stringify(formData) 
      });
      const data = await res.json();
      if (res.ok) { setMessage({ type: 'success', text: 'Asset provisioned!' }); setTimeout(() => navigate('/assets/views'), 1500); } 
      else setMessage({ type: 'error', text: data.error });
    } catch (err) { setMessage({ type: 'error', text: 'Server error.' }); }
    finally { setIsSubmitting(false); }
  };

  // --- CSV PARSING & BULK LOGIC ---
  const handleFileUpload = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      return setMessage({ type: 'error', text: 'Please upload a valid .csv file.' });
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const assets = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, i) => { obj[header] = values[i]; });
        return obj;
      });

      // Basic validation
      if (assets.length === 0 || !assets[0].hostname || !assets[0].serial_number) {
        return setMessage({ type: 'error', text: 'CSV format invalid. Must contain "hostname" and "serial_number" columns.' });
      }

      setParsedAssets(assets);
      setMessage({ type: 'success', text: `Successfully parsed ${assets.length} assets. Ready for import.` });
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/assets/bulk`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('vault_token')}` }, 
        body: JSON.stringify({ assets: parsedAssets }) 
      });
      const data = await res.json();
      if (res.ok) { 
        setMessage({ type: 'success', text: data.message }); 
        setTimeout(() => navigate('/assets/views'), 2000); 
      } else { setMessage({ type: 'error', text: data.error }); }
    } catch (err) { setMessage({ type: 'error', text: 'Server error during batch import.' }); }
    finally { setIsSubmitting(false); }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,hostname,serial_number,type,category,manufacturer,model,ip_address,location\nLAPTOP-001,ABC12345,Workstation,End User Computing,Dell,Latitude 7420,10.0.0.5,HQ\nSERVER-001,XYZ98765,Server,Data Center,HP,ProLiant,10.0.0.10,Datacenter A";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Vault_Asset_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-slate-200">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Server className="text-[#5eb1e6]"/> Provision Assets</h1>
      </div>

      <div className="bg-[#1a1d24] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-[#111318]">
          <button onClick={() => { setActiveTab('manual'); setMessage({type:'',text:''}); }} className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'manual' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
            Manual Entry
          </button>
          <button onClick={() => { setActiveTab('bulk'); setMessage({type:'',text:''}); }} className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'bulk' ? 'border-b-2 border-[#5eb1e6] text-[#5eb1e6]' : 'text-slate-400 hover:text-slate-200'}`}>
            Bulk CSV Import
          </button>
        </div>

        <div className="p-6 md:p-8">
          
          {/* Notifications */}
          {message.text && (
            <div className={`p-4 mb-6 rounded-md flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
              {message.text}
            </div>
          )}

          {/* TAB 1: MANUAL FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1.5">Hostname <span className="text-rose-500">*</span></label>
                 <input required placeholder="e.g. LON-LT-09" onChange={e => setFormData({...formData, hostname: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none focus:border-[#5eb1e6]" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1.5">Serial Number <span className="text-rose-500">*</span></label>
                 <input required placeholder="Unique SN/Service Tag" onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none focus:border-[#5eb1e6]" />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1.5">Category</label>
                 <select onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none focus:border-[#5eb1e6]">
                  <option>End User Computing</option><option>Data Center</option><option>Networking</option><option>IoT / Physical Security</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1.5">Assign to Department</label>
                 <select onChange={e => setFormData({...formData, department_id: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none focus:border-[#5eb1e6]">
                  <option value="">-- No Department --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.group_name}</option>)}
                 </select>
              </div>

              <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Manufacturer</label><input placeholder="e.g. Dell" onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Location</label><input placeholder="e.g. New York HQ" onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none" /></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-1.5">IP Address</label><input placeholder="e.g. 10.0.0.1" onChange={e => setFormData({...formData, ip_address: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none font-mono text-sm" /></div>
              <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1.5">Device Type</label>
                 <select onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[#111318] border border-slate-700 p-2.5 rounded text-white outline-none focus:border-[#5eb1e6]">
                  <option>Workstation</option><option>Server</option><option>Router</option><option>Switch</option><option>Camera</option>
                 </select>
              </div>

              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-800 flex justify-end">
                 <button type="submit" disabled={isSubmitting} className="bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2.5 px-8 rounded transition-colors disabled:opacity-50">
                   {isSubmitting ? 'Provisioning...' : 'Save Asset'}
                 </button>
              </div>
            </form>
          )}

          {/* TAB 2: BULK CSV IMPORT */}
          {activeTab === 'bulk' && (
            <div className="flex flex-col items-center">

              {/* Native Drag & Drop Zone */}
              <div 
                className={`w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-colors relative cursor-pointer
                  ${dragActive ? 'border-[#5eb1e6] bg-[#5eb1e6]/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'}
                  ${parsedAssets.length > 0 ? 'border-emerald-500/50 bg-emerald-500/5' : ''}
                `}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current.click()}
              >
                <input 
                  type="file" ref={fileInputRef} accept=".csv" className="hidden"
                  onChange={(e) => { if (e.target.files && e.target.files[0]) handleFileUpload(e.target.files[0]); }}
                />
                
                {parsedAssets.length > 0 ? (
                  <>
                    <FileText size={48} className="text-emerald-400 mb-4" />
                    <p className="text-lg font-bold text-white mb-1">CSV Parsed Successfully</p>
                    <p className="text-sm text-slate-400">{parsedAssets.length} assets ready for database injection.</p>
                    <p className="text-xs text-[#5eb1e6] mt-4">Click to upload a different file</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-slate-500 mb-4" />
                    <p className="text-lg font-bold text-white mb-1">Drag & Drop your CSV file here</p>
                    <p className="text-sm text-slate-400">or click to browse from your computer</p>
                  </>
                )}
              </div>

              {/* Submit Button */}
              {parsedAssets.length > 0 && (
                <div className="w-full mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                  <p className="text-sm text-slate-400 text-left">
                    Preview: <strong className="text-white">{parsedAssets[0].hostname}</strong> (SN: {parsedAssets[0].serial_number}) ...
                  </p>
                  <button 
                    onClick={handleBulkSubmit} disabled={isSubmitting}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 px-8 rounded transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Importing Batch...' : 'Confirm Bulk Import'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}