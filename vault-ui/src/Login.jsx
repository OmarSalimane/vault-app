// src/Login.jsx
import React, { useState } from 'react';

export default function Login({ setAuthToken }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save the JWT to localStorage so it persists across page reloads
                localStorage.setItem('vault_token', data.token);
                // Also save basic user info if you want to display their name in the UI
                localStorage.setItem('vault_user', JSON.stringify(data.user));
                
                // Update the app state to show the main dashboard
                setAuthToken(data.token);
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Cannot connect to server.");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-[#111318]">
            <div className="bg-[#1a1d24] p-8 rounded-lg border border-slate-800 shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Vault Authentication</h2>
                
                {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#5eb1e6]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-[#111318] border border-slate-700 rounded p-2 text-white outline-none focus:border-[#5eb1e6]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-[#5eb1e6] hover:bg-[#4a9ac9] text-slate-900 font-bold py-2 px-4 rounded mt-2 transition-colors"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}