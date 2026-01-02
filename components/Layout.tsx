import React from 'react';
import { ShieldCheck, ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/';

  // Branding Component for consistency
  const BrandLogo = () => (
    <div className="flex items-center gap-3 group">
       {!isAdmin ? (
         <div className="w-10 h-10 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-xl flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/10 group-active:scale-95 transition-transform">
           <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-indigo-500 text-sm tracking-tight">JP</span>
         </div>
       ) : (
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center ring-1 ring-white/5">
             <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
       )}
       
       <div>
         <h1 className="font-bold text-lg tracking-tight leading-none text-white">
           Jaipuria<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-500">पेय</span>
         </h1>
         <p className="text-[10px] font-medium leading-none mt-1 text-slate-400 tracking-wide uppercase opacity-80">
           {isAdmin ? 'Vendor Console' : 'Secure Campus Dining'}
         </p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#020617] text-white overflow-x-hidden">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-50 transition-all duration-300 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020617]/60">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isHome && !isAdmin && (
               <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 active:scale-95 transition-all text-slate-400 hover:text-white">
                  <ChevronLeft className="w-6 h-6" />
               </button>
            )}
            
            <Link to={isAdmin ? "/admin/dashboard" : "/"}>
               <BrandLogo />
            </Link>
          </div>

          <nav className="flex gap-4">
            {!isAdmin ? (
               <Link to="/admin" className="text-[10px] font-bold text-slate-400 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95">
                 VENDOR
               </Link>
            ) : (
              <Link to="/" className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-all bg-rose-950/20 px-4 py-2 rounded-full border border-rose-500/20 hover:bg-rose-900/40">
                EXIT
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-md mx-auto w-full px-4 pt-6 pb-24 animate-enter">
        {children}
      </main>

      {/* Minimal Footer */}
      {!isAdmin && (
        <footer className="py-10 text-center border-t border-white/5 mt-auto bg-[#020617]">
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                <ShieldCheck className="w-5 h-5 text-indigo-500/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">256-Bit Secure Payments</span>
                <span className="text-[10px] opacity-30">v3.1.0 • Jaipuria Institute</span>
            </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;