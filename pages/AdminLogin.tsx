import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { DbService } from '../services/db.ts';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [stallId, setStallId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const stall = DbService.getStallById(stallId);
    
    if (stall && stall.password === password) {
      sessionStorage.setItem('admin_stall_id', stall.id);
      navigate('/admin/dashboard');
    } else {
      setError('Invalid Stall ID or Password.');
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-enter px-4">
      <div className="bg-[#0f172a] p-8 rounded-2xl shadow-2xl border border-white/5 w-full max-w-sm">
        <div className="flex justify-center mb-8">
            <div className="bg-white/5 p-4 rounded-2xl ring-1 ring-white/10">
                <Lock className="w-8 h-8 text-indigo-400" />
            </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-2">Vendor Portal</h2>
        <p className="text-center text-slate-400 text-sm mb-8">Enter your credentials to access dashboard.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Stall ID</label>
            <input 
              type="text" 
              value={stallId}
              onChange={(e) => setStallId(e.target.value)}
              placeholder="e.g. chaat-101"
              className="w-full p-3.5 bg-[#1e293b] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full p-3.5 bg-[#1e293b] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-600 transition-all"
            />
          </div>

          {error && <p className="text-rose-500 text-xs text-center font-bold bg-rose-500/10 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-white text-slate-950 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/5 flex items-center justify-center gap-2 group mt-2"
          >
            Access Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
        
        <div className="mt-8 text-center text-[10px] text-slate-600 font-mono bg-[#020617] p-3 rounded-lg border border-white/5">
            <p>DEMO CREDENTIALS</p>
            <p className="mt-1">ID: chaat-101 | PASS: admin</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;