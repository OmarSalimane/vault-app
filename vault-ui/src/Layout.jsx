import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import logoImage from './assets/vault.svg';
import { 
  PieChart, Monitor, Disc, Users, ShieldAlert, 
  Radar, Share2, GitMerge, Search, Bell, Store, Settings,
  ChevronDown, ChevronRight, Menu, X, LogOut, LifeBuoy, User 
} from 'lucide-react';

export default function Layout({ children, onLogout }) {
  const [isAssetsOpen, setIsAssetsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // New State for the Profile Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve user info from local storage
  const user = JSON.parse(localStorage.getItem('vault_user') || '{"name": "Unknown", "role_id": 4}');
  
  // Map integer roles to human-readable strings for the UI
  const roleMap = {
    1: "IAM Administrator",
    2: "IT Asset Manager",
    3: "Security Analyst",
    4: "Standard User"
  };
  const roleName = roleMap[user.role_id] || "User";

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Secure Sign Out Handler
  const handleSignOut = () => {
    setDropdownOpen(false);
    if (onLogout) onLogout(); // Tell App.jsx to wipe the token
    navigate('/'); // Force redirect to login page
  };

  return (
    <div className="flex h-screen w-full bg-[#111318] font-sans text-slate-300 overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Responsive) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1d24] flex flex-col border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
             <img src={logoImage} alt="Vault Logo" className="h-10 w-auto object-contain" />
             
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          <NavItem icon={<PieChart size={18}/>} label="Dashboard Overview" to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div>
            <div 
              className="flex items-center justify-between px-6 py-2.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setIsAssetsOpen(!isAssetsOpen)}
            >
              <div className="flex items-center gap-3">
                <Monitor size={18}/> <span className="text-sm font-medium">Asset Inventory</span>
              </div>
              <ChevronDown size={14} className={`transform transition-transform ${isAssetsOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isAssetsOpen && (
              <div className="bg-[#111318]/50 py-1 border-y border-slate-800/50">
                <SubNavItem label="All Assets & Views" to="/assets/views" onClick={() => setIsMobileMenuOpen(false)} />
                <SubNavItem label="Add New Asset" to="/assets/new" onClick={() => setIsMobileMenuOpen(false)} />
                <SubNavItem label="Categorization" to="/assets/categorization" onClick={() => setIsMobileMenuOpen(false)} />
              </div>
            )}
          </div>

          <NavItem icon={<Disc size={18}/>} label="Software & Licenses" to="/software" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem icon={<Users size={18}/>} label="Members & Access" to="/members" onClick={() => setIsMobileMenuOpen(false)} />
          <NavItem icon={<ShieldAlert size={18}/>} label="Risk Insights" to="/risk" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        
        {/* TOP HEADER */}
        <header className="h-16 shrink-0 bg-[#1a1d24] border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 z-20">
          
          {/* Left: Mobile Menu Toggle & Search */}
          <div className="flex items-center gap-4">
            <button 
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center bg-[#111318] border border-slate-700/50 rounded-md px-3 py-1.5 w-full max-w-sm hidden sm:flex">
              <Search size={14} className="text-slate-500 mr-2" />
              <input type="text" placeholder="Search across Vault..." className="bg-transparent outline-none text-sm w-full text-slate-200 placeholder-slate-600" />
            </div>
          </div>

          {/* Right: Notifications & Interactive Profile Dropdown */}
          <div className="flex items-center gap-4">
            <Bell size={20} className="text-slate-400 hover:text-slate-200 cursor-pointer hidden sm:block" />
            
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 focus:outline-none hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors"
              >
                {/* Dynamic Initials Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5eb1e6] to-indigo-500 flex items-center justify-center text-slate-900 font-bold text-sm shadow-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                
                {/* User Info (Hidden on very small mobile screens) */}
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-semibold text-slate-200 leading-none">{user.name}</span>
                  <span className="text-[11px] text-slate-500 leading-tight mt-1">{roleName}</span>
                </div>
                
                <ChevronDown size={14} className={`text-slate-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* The Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1a1d24] border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-sm text-white font-medium">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{roleName}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link 
                      to="/settings" 
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-[#252a33] hover:text-white transition-colors"
                    >
                      <Settings size={16} /> Account Settings
                    </Link>
                    <a 
                      href="#" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-[#252a33] hover:text-white transition-colors"
                    >
                      <LifeBuoy size={16} /> Support & Help
                    </a>
                  </div>
                  
                  <div className="border-t border-slate-800 py-1">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT */}
        <div className="flex-1 overflow-auto bg-[#111318]">
          {children}
        </div>
      </main>
    </div>
  );
}

// Navigation Helper Components
function NavItem({ icon, label, to, hasDropdown, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center justify-between px-6 py-2.5 cursor-pointer transition-colors ${isActive ? 'border-l-4 border-orange-500 text-slate-200 bg-slate-800/50 font-medium' : 'border-l-4 border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'}`}>
      <div className="flex items-center gap-3">{icon}<span className="text-sm">{label}</span></div>
      {hasDropdown && <ChevronRight size={14} className="text-slate-500" />}
    </NavLink>
  );
}

function SubNavItem({ label, to, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center pl-14 pr-6 py-2 text-sm cursor-pointer transition-colors ${isActive ? 'text-[#5eb1e6] font-medium' : 'text-slate-400 hover:text-slate-200'}`}>
      {label}
    </NavLink>
  );
}