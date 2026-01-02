import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, X, Loader2, IndianRupee, ShieldCheck } from 'lucide-react';
import { DbService } from '../services/db.ts';
import { CartItem, Stall } from '../types';

// Robust Web Audio API Helper
const playSoundEffect = (type: 'click' | 'success' | 'pop') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'click') {
      // Crisp UI Click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'pop') {
      // New Crisp Pop (High Pitch)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      // Premium Success Chime (Polyphonic)
      // Voice 1: Main Tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);

      // Voice 2: Harmony
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now); // E5
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.start(now);
      osc2.stop(now + 1.2);
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const StallMenu: React.FC = () => {
  const { stallId } = useParams<{ stallId: string }>();
  const navigate = useNavigate();
  
  const [stall, setStall] = useState<Stall | undefined>(undefined);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Payment States
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'CONFIRM' | 'PROCESSING' | 'SUCCESS'>('CONFIRM');

  useEffect(() => {
    if(stallId) {
        const s = DbService.getStallById(stallId);
        setStall(s);
    }
  }, [stallId]);

  // Cart Logic
  const addToCart = (item: any) => {
    playSoundEffect('pop');
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    playSoundEffect('click');
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.id !== itemId);
    });
  };

  const getItemQty = (itemId: string) => cart.find(i => i.id === itemId)?.quantity || 0;
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const handlePaymentStart = () => {
    setIsPaySheetOpen(true);
    setPaymentStep('CONFIRM');
    playSoundEffect('click');
  };

  const handleSeamlessPayment = async () => {
    // Immediate feedback sound
    playSoundEffect('click');

    setPaymentStep('PROCESSING');
    
    // Simulate Razorpay / Bank Verification Latency
    await new Promise(r => setTimeout(r, 2000)); 
    
    try {
        const order = await DbService.createOrder({
            stallId: stall!.id,
            items: cart,
            subtotal,
            totalAmount: subtotal,
        });
        
        setPaymentStep('SUCCESS');
        
        // Success Sound
        playSoundEffect('success');

        // Allow user to soak in the success tick
        setTimeout(() => {
            navigate(`/order/${order.id}`);
        }, 2200);

    } catch (err: any) {
        setPaymentStep('CONFIRM');
    }
  };

  if (!stall) return <div className="p-10 text-center text-slate-500">Loading Stall...</div>;

  return (
    <div className="pb-32 animate-enter">
      {/* Stall Hero */}
      <div className="relative mb-6 rounded-2xl overflow-hidden shadow-2xl h-48 ring-1 ring-white/10">
           <img src={stall.image} className="w-full h-full object-cover opacity-80" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent"></div>
           <div className="absolute bottom-4 left-4 text-white">
               <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg">{stall.name}</h1>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mt-2">
                   <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">Live Kitchen</span>
                   <span className="text-slate-400">• Mock Payments</span>
               </div>
           </div>
      </div>

      {/* Menu Grid */}
      <div className="space-y-3">
        {stall.menu.map(item => (
          <div key={item.id} className="group bg-[#0f172a] rounded-xl p-4 border border-white/5 shadow-sm flex justify-between items-center transition-all hover:border-indigo-500/30 hover:bg-[#1e293b]">
            <div className="flex-1 pr-4">
              <div className="flex items-start justify-between">
                 <h3 className="font-bold text-slate-100 text-base">{item.name}</h3>
                 <span className={`shrink-0 ml-2 w-2 h-2 rounded-full mt-1.5 ${item.isVeg ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></span>
              </div>
              <p className="text-slate-400 font-medium text-sm mt-1">₹{item.price}</p>
            </div>
            
            {getItemQty(item.id) > 0 ? (
                <div className="flex items-center gap-1 bg-indigo-600 text-white rounded-lg p-1 shadow-lg shadow-indigo-500/20">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="font-bold w-6 text-center text-sm">{getItemQty(item.id)}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
            ) : (
                <button onClick={() => addToCart(item)} className="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-300 rounded-lg border border-white/5 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all active:scale-90">
                    <Plus className="w-5 h-5" />
                </button>
            )}
          </div>
        ))}
      </div>

      {/* Sticky Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-30 animate-slide-up-spring">
            <button 
                onClick={handlePaymentStart}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-1 pl-1 pr-4 rounded-full shadow-2xl shadow-indigo-500/40 flex justify-between items-center group active:scale-[0.98] transition-all border border-white/10"
            >
                <div className="bg-black/20 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-md">
                    <span className="font-bold text-sm">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                </div>
                <span className="text-sm font-bold uppercase tracking-widest mr-auto ml-4 text-indigo-100">Checkout</span>
                
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">₹{subtotal}</span>
                    <div className="bg-white text-indigo-600 rounded-full p-2 shadow-lg">
                        <IndianRupee className="w-4 h-4" />
                    </div>
                </div>
            </button>
        </div>
      )}

      {/* --- SEAMLESS PAYMENT MODAL (Floating Card Style) --- */}
      {isPaySheetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300" onClick={() => setIsPaySheetOpen(false)} />
              
              {/* Floating Card Design */}
              <div className="bg-[#0f172a] w-full max-w-md rounded-3xl relative z-10 overflow-hidden shadow-2xl shadow-black border border-white/10 animate-slide-up-spring min-h-[440px] flex flex-col mx-4 mb-4">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1e293b]/50 backdrop-blur-sm">
                      <div>
                          <h2 className="text-lg font-bold text-white">Payment</h2>
                          <p className="text-xs text-slate-400 font-medium">Paying {stall.name}</p>
                      </div>
                      {paymentStep === 'CONFIRM' && (
                          <button onClick={() => setIsPaySheetOpen(false)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"><X className="w-5 h-5" /></button>
                      )}
                  </div>

                  <div className="flex-1 p-8 flex flex-col justify-center">
                      
                      {/* STEP 1: CONFIRMATION */}
                      {paymentStep === 'CONFIRM' && (
                          <div className="space-y-8 animate-enter">
                             <div className="text-center">
                                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Amount</p>
                                 <p className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">₹{subtotal}</p>
                             </div>

                             <div className="space-y-4">
                                <button 
                                    onClick={handleSeamlessPayment}
                                    className="block w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-2xl text-center shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] text-lg"
                                >
                                    Pay securely
                                </button>
                                
                                <div className="flex items-center justify-center gap-2 text-slate-500 mt-4">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-xs font-medium">Bank-grade Security (Mock)</span>
                                </div>
                             </div>
                          </div>
                      )}

                      {/* STEP 2: PROCESSING */}
                      {paymentStep === 'PROCESSING' && (
                          <div className="flex flex-col items-center justify-center text-center animate-enter">
                              <div className="relative mb-8">
                                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                                  <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-2">Processing...</h3>
                              <p className="text-slate-400 text-sm">Securely contacting bank</p>
                          </div>
                      )}

                      {/* STEP 3: SUCCESS */}
                      {paymentStep === 'SUCCESS' && (
                          <div className="flex flex-col items-center justify-center text-center">
                              {/* The Dopamine Tick */}
                              <div className="checkmark-wrapper mb-6 scale-110">
                                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                      <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                                      <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                  </svg>
                              </div>
                              <h3 className="text-2xl font-bold text-white animate-enter" style={{animationDelay: '0.2s'}}>Payment Successful</h3>
                              <p className="text-emerald-400 font-medium text-sm mt-2 animate-enter" style={{animationDelay: '0.3s'}}>Redirecting...</p>
                          </div>
                      )}

                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StallMenu;