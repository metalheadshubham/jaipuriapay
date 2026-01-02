import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Star } from 'lucide-react';
import { DbService } from '../services/db.ts';

const Home: React.FC = () => {
  const stalls = DbService.getStalls();

  return (
    <div className="space-y-8">
      
      {/* Hero Section */}
      <div className="text-center space-y-5 pt-8 pb-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Hungry? <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-500 animate-pulse">
            Skip the Line.
          </span>
        </h1>
        <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed font-medium opacity-90">
          Order food directly from your phone. 
          <span className="text-slate-500 block mt-1 text-xs uppercase tracking-wider font-bold">Fast • Cashless • Secure</span>
        </p>
      </div>

      {/* Stall Grid */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Kitchens</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-900/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Operational
            </span>
        </div>
        
        {stalls.map((stall, idx) => (
          <Link
            key={stall.id}
            to={`/stall/${stall.id}`}
            className="group block bg-[#0f172a] rounded-2xl p-4 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 transform active:scale-[0.97] relative overflow-hidden shadow-lg"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Subtle Gradient Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-20 h-20 bg-slate-800 rounded-xl overflow-hidden shrink-0 shadow-lg ring-1 ring-white/10 group-hover:ring-indigo-500/30 transition-all">
                <img src={stall.image} alt={stall.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg leading-tight truncate pr-2 group-hover:text-indigo-300 transition-colors">
                        {stall.name}
                    </h3>
                    <div className="bg-white/5 p-2 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>4.8</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Zap className="w-3 h-3 text-indigo-400" />
                        <span>~8 min</span>
                    </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-br from-indigo-950/40 to-slate-900/40 rounded-xl p-5 border border-indigo-500/20 flex items-start gap-4 backdrop-blur-md">
          <div className="bg-indigo-500/20 p-2.5 rounded-lg shrink-0">
             <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
              <h4 className="text-sm font-bold text-white">Prototype Mode</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Payments are simulated for this demo. No real money is deducted. 
              </p>
          </div>
      </div>
    </div>
  );
};

export default Home;