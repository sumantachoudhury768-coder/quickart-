import type {
  CartItem,
  Order,
  OrderStatus,
  PlatformSettings,
  Product,
  ProductCategory,
} from '../types';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Fresh Produce',
  'Dairy & Bakery',
  'Snacks & Instant',
  'Beverages',
  'Staples & Grains',
  'Household & Care',
];

export const DEHRADUN_ZONES: string[] = [
  'DBS Global University Hostel, Selaqui',
  'Selaqui Industrial & Student Hub',
  'Prem Nagar & Chakrata Road',
  'Sudhowala Campus Belt',
  'Rajpur Road & Jakhan',
  'Clement Town & Graphic Era Zone',
  'Ballupur & Vasant Vihar',
];

export const ORDER_STEPS: { status: OrderStatus; label: string; shortLabel: string; description: string }[] = [
  {
    status: 'placed',
    label: 'Order Placed',
    shortLabel: 'Placed',
    description: 'Received and routed to local partner store',
  },
  {
    status: 'confirmed',
    label: 'Store Confirmed',
    shortLabel: 'Confirmed',
    description: 'Partner store accepted and started picking items',
  },
  {
    status: 'packed',
    label: 'Packed & Ready',
    shortLabel: 'Packed',
    description: 'Quality checked and sealed for doorstep dispatch',
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    shortLabel: 'On the Way',
    description: 'Delivery partner is heading to your location',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
    description: 'Handed over at doorstep with OTP verification',
  },
];

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
  amountForFreeDelivery: number;
  qualifiesForFreeDelivery: boolean;
  meetsMinOrder: boolean;
}

export function calculateCartTotals(
  cart: CartItem[],
  settings: Pick<PlatformSettings, 'deliveryFee' | 'freeDeliveryThreshold' | 'minOrderAmount'>
): CartTotals {
  const itemCount = cart.reduce((sum, entry) => sum + Math.max(0, entry.quantity), 0);
  const subtotal = roundMoney(
    cart.reduce((sum, entry) => sum + entry.product.price * Math.max(0, entry.quantity), 0)
  );
  const mrpTotal = roundMoney(
    cart.reduce((sum, entry) => sum + Math.max(entry.product.mrp, entry.product.price) * Math.max(0, entry.quantity), 0)
  );
  const savings = roundMoney(Math.max(0, mrpTotal - subtotal));
  const qualifiesForFreeDelivery = subtotal >= settings.freeDeliveryThreshold && subtotal > 0;
  const deliveryFee = subtotal === 0 ? 0 : qualifiesForFreeDelivery ? 0 : settings.deliveryFee;
  const total = roundMoney(subtotal + deliveryFee);
  const amountForFreeDelivery = roundMoney(Math.max(0, settings.freeDeliveryThreshold - subtotal));
  const meetsMinOrder = subtotal >= settings.minOrderAmount;

  return {
    itemCount,
    subtotal,
    mrpTotal,
    savings,
    deliveryFee,
    total,
    amountForFreeDelivery,
    qualifiesForFreeDelivery,
    meetsMinOrder,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatINR(amount: number): string {
  const rounded = roundMoney(amount);
  const hasDecimals = Math.abs(rounded - Math.round(rounded)) > 0.001;
  return `₹${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function getDiscountPercent(price: number, mrp: number): number {
  if (mrp <= price || mrp <= 0) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export type ProductSort = 'featured' | 'price_asc' | 'price_desc' | 'discount';

export function filterAndSortProducts(
  products: Product[],
  options: {
    query: string;
    category: ProductCategory | 'All';
    sort: ProductSort;
    inStockOnly?: boolean;
  }
): Product[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  const filtered = products.filter((product) => {
    if (options.category !== 'All' && product.category !== options.category) {
      return false;
    }
    if (options.inStockOnly && (!product.inStock || product.stock <= 0)) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery) ||
      product.storeName.toLowerCase().includes(normalizedQuery)
    );
  });

  const sorted = [...filtered];
  switch (options.sort) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'discount':
      sorted.sort((a, b) => getDiscountPercent(b.price, b.mrp) - getDiscountPercent(a.price, a.mrp));
      break;
    case 'featured':
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
      break;
  }
  return sorted;
}

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
  actor: 'customer' | 'vendor' | 'delivery' | 'admin'
): boolean {
  if (actor === 'admin') {
    return current !== next;
  }
  if (current === 'delivered' || current === 'cancelled') {
    return false;
  }
  if (actor === 'customer') {
    return current === 'placed' && next === 'cancelled';
  }
  if (actor === 'vendor') {
    return (
      (current === 'placed' && next === 'confirmed') ||
      (current === 'confirmed' && next === 'packed')
    );
  }
  if (actor === 'delivery') {
    return (
      (current === 'packed' && next === 'out_for_delivery') ||
      (current === 'out_for_delivery' && next === 'delivered')
    );
  }
  return false;
}

export interface CheckoutFormValues {
  customerName: string;
  customerPhone: string;
  deliveryZone: string;
  deliveryAddress: string;
  paymentMethod: 'cod' | 'upi';
  notes: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateCheckoutForm(values: CheckoutFormValues): ValidationResult {
  const errors: Record<string, string> = {};
  const name = values.customerName.trim();
  const digitsOnlyPhone = values.customerPhone.replace(/\D/g, '');
  const address = values.deliveryAddress.trim();

  if (name.length < 2 || name.length > 100) {
    errors.customerName = 'Enter your full name (at least 2 characters).';
  }
  if (digitsOnlyPhone.length < 10 || digitsOnlyPhone.length > 12) {
    errors.customerPhone = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (!values.deliveryZone.trim()) {
    errors.deliveryZone = 'Select a Dehradun delivery zone.';
  }
  if (address.length < 5 || address.length > 240) {
    errors.deliveryAddress = 'Enter hostel room, block, or street address (min 5 chars).';
  }
  if (values.notes.trim().length > 240) {
    errors.notes = 'Delivery instructions must be under 240 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface ProductDraftValues {
  name: string;
  brand: string;
  category: ProductCategory;
  unit: string;
  price: number;
  mrp: number;
  stock: number;
  description: string;
  imageUrl: string;
}

export function validateProductDraft(draft: ProductDraftValues): ValidationResult {
  const errors: Record<string, string> = {};
  if (draft.name.trim().length < 2 || draft.name.trim().length > 120) {
    errors.name = 'Product name must be between 2 and 120 characters.';
  }
  if (draft.brand.trim().length < 1 || draft.brand.trim().length > 80) {
    errors.brand = 'Brand name is required (max 80 characters).';
  }
  if (draft.unit.trim().length < 1 || draft.unit.trim().length > 40) {
    errors.unit = 'Pack size / unit is required (e.g. 500 g, 1 L).';
  }
  if (!Number.isFinite(draft.price) || draft.price <= 0 || draft.price > 50000) {
    errors.price = 'Selling price must be greater than ₹0.';
  }
  if (!Number.isFinite(draft.mrp) || draft.mrp < draft.price || draft.mrp > 50000) {
    errors.mrp = 'MRP must be greater than or equal to the selling price.';
  }
  if (!Number.isFinite(draft.stock) || draft.stock < 0 || draft.stock > 10000) {
    errors.stock = 'Stock quantity must be between 0 and 10,000.';
  }
  if (draft.description.trim().length > 400) {
    errors.description = 'Description must be 400 characters or fewer.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateOrderNumber(sequenceSeed = Date.now()): string {
  const suffix = String(1000 + (Math.abs(sequenceSeed) % 9000));
  return `QK-${suffix}`;
}

export function generateDeliveryOtp(seed = Date.now()): string {
  const code = 1000 + (Math.abs(seed * 37) % 9000);
  return String(code);
}

export interface PlatformMetrics {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  grossMerchandiseValue: number;
  deliveryRevenue: number;
  averageOrderValue: number;
}

export function computePlatformMetrics(orders: Order[]): PlatformMetrics {
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
  const delivered = orders.filter((o) => o.status === 'delivered');
  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const grossMerchandiseValue = roundMoney(
    nonCancelled.reduce((sum, order) => sum + order.total, 0)
  );
  const deliveryRevenue = roundMoney(
    nonCancelled.reduce((sum, order) => sum + order.deliveryFee, 0)
  );
  const averageOrderValue =
    nonCancelled.length > 0 ? roundMoney(grossMerchandiseValue / nonCancelled.length) : 0;

  return {
    totalOrders: orders.length,
    activeOrders: active.length,
    deliveredOrders: delivered.length,
    grossMerchandiseValue,
    deliveryRevenue,
    averageOrderValue,
  };
}

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Order Placed';
    case 'confirmed':
      return 'Store Confirmed';
    case 'packed':
      return 'Packed & Ready';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
  }
}

export function sanitizeId(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}
