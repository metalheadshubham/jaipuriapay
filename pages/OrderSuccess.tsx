import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Home, Utensils, ShoppingBag } from 'lucide-react';
import { DbService } from '../services/db.ts';
import { Order, OrderStatus } from '../types';

// Web Audio API Helper for Notifications
const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        // Gentle "Ping" (Sine wave)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

const OrderSuccess: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [displayId, setDisplayId] = useState<number | null>(null);
    const [isNewUpdate, setIsNewUpdate] = useState(false);

    // --- Real-time Sync Logic ---
    useEffect(() => {
        if (!orderId) return;

        // 1. First fetch the specific order to get metadata (stallId)
        // We actually need the Stall ID to fetch the relevant list for counting.
        // However, for MVP, we can just use the global stream if stalls are few, 
        // OR just fetch the single order first, then subscribe to the list.

        // Strategy: Subscribe to the Single Order to get the StallId
        const unsubscribeOrder = DbService.subscribeToOrder(orderId, (latestOrder) => {
            setOrder(prev => {
                if (latestOrder && prev && latestOrder.status !== prev.status) {
                    setIsNewUpdate(true);
                    setTimeout(() => setIsNewUpdate(false), 2000);
                    if (latestOrder.status === OrderStatus.COMPLETED) playNotificationSound();
                }
                return latestOrder;
            });
        });

        return () => {
            unsubscribeOrder();
        };
    }, [orderId]);

    // 2. Separate Effect: Once we have the order, subscribe to the LIST to get the COUNT/INDEX
    useEffect(() => {
        if (!order) return;

        // Subscribe to all orders for this stall to calculate index
        // This is "heavy" for a receipt page but necessary for the "Sequential ID" requirement without backend changes.
        const unsubscribeList = DbService.subscribeToOrders(order.stallId, (allOrders) => {
            // Sort Oldest -> Newest to find true index
            const sorted = [...allOrders].sort((a, b) => a.timestamp - b.timestamp);
            const index = sorted.findIndex(o => o.id === orderId);
            if (index !== -1) {
                setDisplayId(100 + index);
            }
        });

        return () => unsubscribeList();
    }, [order?.stallId, orderId]);

    if (!order) return <div className="text-center p-10 text-slate-500">Loading Order...</div>;

    return (
        <div className="flex flex-col items-center justify-center pt-6 px-4 animate-enter pb-24">

            {/* --- RECEIPT CARD --- */}
            <div className={`w-full max-w-sm bg-[#0f172a] rounded-t-xl overflow-hidden shadow-2xl shadow-black/50 relative border border-white/5 transition-all duration-500 ${isNewUpdate ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''}`}>

                {/* Header */}
                <div className="bg-[#1e293b] p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-indigo-600"></div>
                    <h2 className="text-lg font-bold tracking-tight">
                        Jaipuria<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-500">पे</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-mono uppercase mt-1">Digital Receipt</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Order Number</p>
                        <div className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                            #{displayId ? displayId : '...'}
                        </div>
                        <div className="inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Paid & Verified
                        </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 mb-6">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm group">
                                <span className="text-slate-400 font-medium"><span className="text-white font-bold">{item.quantity}x</span> {item.name}</span>
                                <span className="text-white font-bold">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-dashed border-white/10 my-6"></div>

                    {/* Totals */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-white mt-2">
                            <span>Total Paid</span>
                            <span>₹{order.totalAmount}</span>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="mt-8 pt-4 border-t border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 font-mono">
                            REF: {order.customerUtr} • {new Date(order.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                {/* ZigZag Bottom Edge */}
                <div className="receipt-edge" style={{ backgroundImage: 'linear-gradient(135deg, #0f172a 8px, transparent 0), linear-gradient(-135deg, #0f172a 8px, transparent 0)' }}></div>
            </div>

            {/* --- LIVE TRACKING --- */}
            <div className="w-full max-w-sm mt-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Status</h3>
                    {isNewUpdate && <span className="text-[10px] text-indigo-400 font-bold animate-pulse">Updated just now</span>}
                </div>

                <div className="relative pl-4 border-l-2 border-slate-800 space-y-8 ml-2">

                    {/* Step 1: Placed (Always Done) */}
                    <div className="relative">
                        <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-[#020617] shadow-sm z-10"></div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2"><ShoppingBag className="w-3 h-3" /> Order Placed</h4>
                        <p className="text-xs text-slate-500 mt-1">We've received your order.</p>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className={`relative transition-all duration-500 ${order.status === OrderStatus.VERIFIED || order.status === OrderStatus.COMPLETED ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-[#020617] shadow-sm z-10 flex items-center justify-center transition-colors duration-500 ${order.status === OrderStatus.VERIFIED ? 'bg-indigo-500 animate-pulse' : (order.status === OrderStatus.COMPLETED ? 'bg-indigo-500' : 'bg-slate-800')}`}>
                            {order.status === OrderStatus.VERIFIED && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${order.status === OrderStatus.VERIFIED ? 'text-indigo-400' : 'text-slate-300'}`}>
                            <Utensils className="w-3 h-3" /> Preparing
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Chef is working on your dish.</p>
                    </div>

                    {/* Step 3: Ready */}
                    <div className={`relative transition-all duration-500 ${order.status === OrderStatus.COMPLETED ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-[#020617] z-10 transition-colors duration-500 ${order.status === OrderStatus.COMPLETED ? 'bg-emerald-500 scale-125' : 'bg-slate-800'}`}></div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${order.status === OrderStatus.COMPLETED ? 'text-emerald-400' : 'text-slate-300'}`}>
                            <Check className="w-3 h-3" /> Ready to Pickup
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            {order.status === OrderStatus.COMPLETED ? "Please collect your order from the counter!" : "Listen for your number."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 left-0 right-0 text-center px-4">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium text-sm transition-colors bg-[#1e293b] px-6 py-3 rounded-full shadow-lg shadow-black/20 border border-white/5 active:scale-95">
                    <Home className="w-4 h-4" /> Return to Home
                </Link>
            </div>
        </div>
    );
};

export default OrderSuccess;