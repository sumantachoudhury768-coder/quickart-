export type UserRole = 'customer' | 'vendor' | 'delivery' | 'admin';

export type ProductCategory =
  | 'Fresh Produce'
  | 'Dairy & Bakery'
  | 'Snacks & Instant'
  | 'Beverages'
  | 'Staples & Grains'
  | 'Household & Care';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'upi';
export type PaymentStatus = 'pending' | 'paid';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  role: UserRole;
  deliveryZone: string;
  defaultAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  zone: string;
  address: string;
  ownerId: string;
  etaMinutes: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  unit: string;
  price: number;
  mrp: number;
  stock: number;
  inStock: boolean;
  storeId: string;
  storeName: string;
  vendorId: string;
  imageUrl: string;
  description: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryZone: string;
  deliveryAddress: string;
  storeId: string;
  storeName: string;
  vendorId: string;
  deliveryPartnerId: string;
  deliveryPartnerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  itemCount: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryOtp: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettings {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  serviceCity: string;
  supportPhone: string;
  updatedAt: string;
}

export type AppView = 'shop' | 'orders' | 'vendor' | 'delivery' | 'admin';
