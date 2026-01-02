export interface MenuItem {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
}

export enum StallStatus {
  INACTIVE = 'INACTIVE',       // Not onboarded
  ACTIVE = 'ACTIVE',           // Within valid time window
  SUSPENDED = 'SUSPENDED'      // Time expired, needs top-up
}

export interface Stall {
  id: string;
  name: string;
  image: string;
  password: string; 
  upiId: string; // Critical for direct payments
  menu: MenuItem[];
  
  // Membership Logic
  activationTime: number | null; // When they paid ₹350
  expiryTime: number | null;     // When access cuts off
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string; 
  stallId: string;
  items: CartItem[];
  subtotal: number;
  totalAmount: number;
  status: OrderStatus;
  timestamp: number;
  
  // Payment Proof
  customerUtr: string; 
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
}