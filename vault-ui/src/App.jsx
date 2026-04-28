import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Component Imports
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Views from './Views';
import NewAsset from './NewAsset';
import Categorization from './Categorization';
import Software from './Software';
import Members from './Members';
import RiskInsights from './Risk';
import Settings from './Settings';
import SoftwareDetail from './SoftwareDetail';
import AssetDetail from './AssetDetail';
import UserDetail from './UserDetail';

export default function App() {
  // 1. Initialize authentication state directly from localStorage
  // This ensures the user stays logged in even if they refresh the page
  const [authToken, setAuthToken] = useState(localStorage.getItem('vault_token'));

  // 2. Create a logout function to pass down to your Layout (for a logout button)
  const handleLogout = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    setAuthToken(null);
  };

  // 3. Gatekeeper: If no token exists, render ONLY the Login page
  if (!authToken) {
    return <Login setAuthToken={setAuthToken} />;
  }

  // 4. Authenticated View: Render the standard Router and Layout
  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets/views" element={<Views />} /> 
          <Route path="/assets/new" element={<NewAsset />} /> 
          <Route path="/assets/categorization" element={<Categorization />} />
          <Route path="/software" element={<Software />} />
          <Route path="/members" element={<Members />} />
          <Route path="/risk" element={<RiskInsights />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/software/:id" element={<SoftwareDetail />} />
          <Route path="/assets/:id" element={<AssetDetail />} />
          <Route path="/users/:id" element={<UserDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}