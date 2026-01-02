import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, TrendingUp } from 'lucide-react';
import { DbService } from '../services/db.ts';
import { Order, OrderStatus, Stall, StallStatus, AnalyticsData } from '../types';

const ADMIN_UPI = "jaipuria-admin@okicici";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stall, setStall] = useState<Stall | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [timeLeftPercent, setTimeLeftPercent] = useState(100);
  const [status, setStatus] = useState<StallStatus>(StallStatus.INACTIVE);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpUtr, setTopUpUtr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Derived Analytics
  const analytics: AnalyticsData = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED);
    return {
      totalOrders: validOrders.length,
      totalRevenue: validOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }, [orders]);

  // --- Initialization ---
  useEffect(() => {
    const stallId = sessionStorage.getItem('admin_stall_id');
    if (!stallId) { navigate('/admin'); return; }

    // Initial Stall Load
    const currentStall = DbService.getStallById(stallId);
    if (!currentStall) return;
    setStall(currentStall);
    setStatus(DbService.getStallStatus(currentStall));

    // Real-time Orders Listener (Cleanup prevents memory leaks)
    const unsubscribe = DbService.subscribeToOrders(stallId, (liveOrders) => {
      setOrders(liveOrders);
    });

    const timerInterval = setInterval(() => updateTimer(currentStall), 1000);

    return () => {
      unsubscribe();
      clearInterval(timerInterval);
    };
  }, [navigate]);

  const updateTimer = (currentStall: Stall) => {
    if (!currentStall || !currentStall.expiryTime) {
      setTimeLeftStr('--:--');
      setTimeLeftPercent(0);
      return;
    }
    const now = Date.now();
    const totalDuration = 3 * 60 * 60 * 1000; // Base 3 hours for calculation visuals
    const diff = currentStall.expiryTime - now;

    if (diff <= 0) {
      setTimeLeftStr('Expired');
      setTimeLeftPercent(0);
      setStatus(curr => curr !== StallStatus.SUSPENDED ? StallStatus.SUSPENDED : curr);
    } else {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftStr(`${h}h ${m}m`);

      let p = (diff / totalDuration) * 100;
      if (p > 100) p = 100;
      setTimeLeftPercent(p);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic Update is tricky with Firestore listeners as it might flash
    // But we can let the listener handle the update for single source of truth
    await DbService.updateOrderStatus(orderId, newStatus);
  };

  const handleTopUp = async () => {
    if (!stall || !topUpUtr) return;
    setIsLoading(true);
    if (status === StallStatus.INACTIVE) await DbService.activateStall(stall.id, topUpUtr);
    else await DbService.topUpStall(stall.id, topUpUtr);

    // Refresh stall info locally
    const updatedStall = DbService.getStallById(stall.id);
    if (updatedStall) {
      setStall(updatedStall);
      setStatus(DbService.getStallStatus(updatedStall));
    }

    setIsLoading(false);
    setShowTopUp(false);
    setTopUpUtr('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_stall_id');
    navigate('/admin');
  };

  if (!stall) return null;

  const isSuspended = status === StallStatus.SUSPENDED || status === StallStatus.INACTIVE;

  return (
    <div className="space-y-8 animate-enter pb-20">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-2xl text-white">{stall.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status === StallStatus.ACTIVE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              {status}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-white font-bold text-xs bg-white/5 px-3 py-1.5 rounded-lg transition-colors">
          Log Out
        </button>
      </div>

      {/* --- Platform Access & Analytics Grid --- */}
      <div className="grid grid-cols-2 gap-4">

        {/* Timer Card */}
        <div className={`p-4 rounded-2xl border relative overflow-hidden ${isSuspended ? 'bg-rose-950/30 border-rose-500/30' : 'bg-[#1e293b] border-white/5 text-white'}`}>
          <div className="relative z-10">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isSuspended ? 'text-rose-400' : 'text-slate-400'}`}>Access Time</p>
            <div className="flex items-baseline gap-1">
              <Clock className={`w-4 h-4 ${isSuspended ? 'text-rose-500' : 'text-indigo-400'}`} />
              <span className={`text-2xl font-mono font-bold ${isSuspended ? 'text-rose-400' : 'text-white'}`}>{timeLeftStr}</span>
            </div>
          </div>
          {/* Progress Bar Background */}
          {!isSuspended && (
            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000" style={{ width: `${timeLeftPercent}%` }}></div>
          )}
        </div>

        {/* Revenue Card */}
        <div className="p-4 rounded-2xl bg-[#1e293b] border border-white/5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Revenue</p>
          <div className="flex items-baseline gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-2xl font-bold text-white">₹{analytics?.totalRevenue || 0}</span>
          </div>
        </div>

        {/* Top Up CTA - Full Width */}
        <button
          onClick={() => setShowTopUp(true)}
          className={`col-span-2 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${isSuspended ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'}`}
        >
          {isSuspended ? 'Pay Platform Fee to Resume' : 'Extend Platform Access (+1.5h)'}
        </button>
      </div>

      {/* --- Top Up Modal --- */}
      {showTopUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] p-6 rounded-2xl shadow-2xl border border-white/10 w-full max-w-sm animate-enter">
            <h3 className="font-bold text-lg mb-1 text-white">Platform Fee</h3>
            <p className="text-sm text-slate-400 mb-4">Pay via UPI to {ADMIN_UPI}</p>

            <div className="bg-[#1e293b] p-4 rounded-xl mb-4 text-center border border-white/5">
              <p className="text-3xl font-bold text-white">₹{status === StallStatus.INACTIVE ? '350' : '20'}</p>
              <p className="text-xs text-slate-500 font-medium uppercase mt-1">Fee Amount</p>
            </div>

            <a href={`upi://pay?pa=${ADMIN_UPI}&pn=JaipuriaPAY&am=${status === StallStatus.INACTIVE ? '350' : '20'}&cu=INR`} className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-center mb-4 transition-colors">
              Pay Now
            </a>

            <input
              type="text"
              placeholder="Enter UTR Reference ID"
              value={topUpUtr}
              onChange={(e) => setTopUpUtr(e.target.value)}
              className="w-full p-3 bg-[#1e293b] border border-white/10 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm text-white placeholder-slate-600"
            />

            <div className="flex gap-3">
              <button onClick={() => setShowTopUp(false)} className="flex-1 py-3 text-slate-400 hover:text-white font-medium text-sm">Cancel</button>
              <button onClick={handleTopUp} disabled={isLoading || !topUpUtr} className="flex-1 bg-white text-slate-900 rounded-xl font-bold text-sm disabled:opacity-50">
                {isLoading ? 'Verifying...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Live Orders --- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Live Orders</h3>
          <span className="bg-slate-800 text-slate-300 border border-white/5 px-2.5 py-1 rounded text-xs font-bold">{orders.filter(o => o.status !== OrderStatus.COMPLETED).length} Pending</span>
        </div>

        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-[#1e293b]/50 rounded-xl border border-dashed border-white/10">
              <p className="text-slate-500 text-sm font-medium">No active orders</p>
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.id}
                className={`bg-[#1e293b] p-5 rounded-xl border shadow-sm transition-all animate-enter ${order.status === OrderStatus.COMPLETED ? 'border-white/5 opacity-50' : 'border-indigo-500/30 shadow-indigo-900/10'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center font-black text-slate-300 text-lg">
                      {/* Client-side Sequential ID Calculation */}
                      #{orders.filter(o => o.status !== OrderStatus.CANCELLED).length - orders.filter(o => o.status !== OrderStatus.CANCELLED).findIndex(x => x.id === order.id) + 99}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">ID: {order.id.slice(0, 6)}</p>
                      <p className="font-bold text-white">₹{order.totalAmount}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium"><span className="text-white font-bold">{item.quantity}x</span> {item.name}</span>
                    </div>
                  ))}
                </div>

                {order.status !== OrderStatus.COMPLETED ? (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.COMPLETED)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
                  >
                    <Check className="w-4 h-4" /> Mark Ready
                  </button>
                ) : (
                  <div className="w-full bg-emerald-500/10 text-emerald-400 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500/20">
                    <Check className="w-4 h-4" /> Completed
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;