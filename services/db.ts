import { Stall, StallStatus, Order, OrderStatus, AnalyticsData } from '../types';
import { db, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp, getDoc, runTransaction, setDoc } from './firebase';

// Constants
const FREE_ACCESS_MS = 3 * 60 * 60 * 1000; // 3 Hours
const TOPUP_ACCESS_MS = 1.5 * 60 * 60 * 1000; // 1.5 Hours

// Initial Data
const INITIAL_STALLS: Stall[] = [
  {
    id: 'chaat-101',
    name: 'Royal Chaat',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
    password: 'admin',
    upiId: 'chaat101@upi',
    activationTime: Date.now() - (2 * 60 * 60 * 1000), // Activated 2 hours ago (1 hr left)
    expiryTime: Date.now() + (1 * 60 * 60 * 1000),
    menu: [
      { id: 'm1', name: 'Pani Puri (6pcs)', price: 40, isVeg: true },
      { id: 'm2', name: 'Aloo Tikki', price: 60, isVeg: true },
      { id: 'm3', name: 'Masala Chai', price: 20, isVeg: true },
    ]
  },
  {
    id: 'burger-202',
    name: 'Burger & Bytes',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    password: 'admin',
    upiId: 'burger202@upi',
    activationTime: null, // Inactive
    expiryTime: null,
    menu: [
      { id: 'b1', name: 'Veggie Supreme', price: 90, isVeg: true },
      { id: 'b2', name: 'Chicken Crispy', price: 120, isVeg: false },
    ]
  }
];

const KEYS = {
  STALLS: 'jp_stalls_v2',
};

const EVENTS_COLLECTION = 'events/jaipuria-2025/orders';
const COUNTER_DOC = 'events/jaipuria-2025/shards/orderCounter';

export const DbService = {
  // --- Stall Management (Client-Side Only for MVP) ---

  init: () => {
    if (!localStorage.getItem(KEYS.STALLS)) {
      localStorage.setItem(KEYS.STALLS, JSON.stringify(INITIAL_STALLS));
    }
  },

  getStalls: (): Stall[] => {
    return JSON.parse(localStorage.getItem(KEYS.STALLS) || JSON.stringify(INITIAL_STALLS));
  },

  getStallById: (id: string): Stall | undefined => {
    const stalls = DbService.getStalls();
    return stalls.find(s => s.id === id);
  },

  getStallStatus: (stall: Stall): StallStatus => {
    if (!stall.activationTime || !stall.expiryTime) return StallStatus.INACTIVE;
    if (Date.now() > stall.expiryTime) return StallStatus.SUSPENDED;
    return StallStatus.ACTIVE;
  },

  activateStall: async (stallId: string, utr: string): Promise<void> => {
    // Keep this local for now as requested
    const stalls = DbService.getStalls();
    const updated = stalls.map(s => {
      if (s.id === stallId) {
        const now = Date.now();
        return {
          ...s,
          activationTime: now,
          expiryTime: now + FREE_ACCESS_MS
        };
      }
      return s;
    });
    localStorage.setItem(KEYS.STALLS, JSON.stringify(updated));
  },

  topUpStall: async (stallId: string, utr: string): Promise<void> => {
    // Keep this local for now
    const stalls = DbService.getStalls();
    const updated = stalls.map(s => {
      if (s.id === stallId) {
        const baseTime = (s.expiryTime && s.expiryTime > Date.now()) ? s.expiryTime : Date.now();
        return {
          ...s,
          expiryTime: baseTime + TOPUP_ACCESS_MS
        };
      }
      return s;
    });
    localStorage.setItem(KEYS.STALLS, JSON.stringify(updated));
  },

  // --- Order Logic (Firestore) ---

  subscribeToOrders: (stallId: string, callback: (orders: Order[]) => void) => {
    // FIX: Removing 'orderBy' from Firestore query to prevent missing index errors.
    // We will sort client-side instead.
    console.log(`[Firestore] Subscribing to orders for stall: "${stallId}"`);

    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('stallId', '==', stallId)
    );

    return onSnapshot(q, (snapshot) => {
      console.log(`[Firestore] Snapshot received. Docs: ${snapshot.docs.length}`);

      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Handle serverTimestamp (null for local pending writes)
          timestamp: data.createdAt?.toMillis() || Date.now(),
        } as Order;
      });

      // Sort client-side: Newest first
      const sortedOrders = orders.sort((a, b) => b.timestamp - a.timestamp);

      callback(sortedOrders);
    }, (error) => {
      console.error("[Firestore] Subscription Error:", error);
    });
  },

  subscribeToOrder: (orderId: string, callback: (order: Order | null) => void) => {
    const docRef = doc(db, EVENTS_COLLECTION, orderId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          ...data,
          id: docSnap.id,
          timestamp: data.createdAt?.toMillis() || Date.now()
        } as Order);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("[Firestore] Order Subscription Error:", error);
    });
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'timestamp' | 'status' | 'customerUtr'> & { customerUtr?: string }): Promise<Order> => {
    // Check if stall is active (Local Check)
    const stall = DbService.getStallById(orderData.stallId);
    if (!stall || DbService.getStallStatus(stall) !== StallStatus.ACTIVE) {
      throw new Error("Stall is currently unavailable.");
    }

    console.log(`[Firestore] Creating order for stall: "${orderData.stallId}"`);

    // Auto-generate UTR if not provided (Seamless flow)
    const finalUtr = orderData.customerUtr || Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const timestamp = serverTimestamp();

    // Create in Firestore and AWAIT it
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...orderData,
      customerUtr: finalUtr,
      status: OrderStatus.VERIFIED, // Auto-verified
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: 'customer_device'
    });

    console.log(`[Firestore] Order created with ID: ${docRef.id}`);

    // Return optimistic order object
    return {
      ...orderData,
      id: docRef.id,
      status: OrderStatus.VERIFIED,
      customerUtr: finalUtr,
      timestamp: Date.now()
    } as Order;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    const docRef = doc(db, EVENTS_COLLECTION, orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin_dashboard'
    });
  },

  getAnalytics: (stallId: string): AnalyticsData => {
    // Deprecated in favor of AdminDashboard local calc, but keeping for type safety if used elsewhere
    return { totalOrders: 0, totalRevenue: 0 };
  }
};

// Initialize on load
DbService.init();