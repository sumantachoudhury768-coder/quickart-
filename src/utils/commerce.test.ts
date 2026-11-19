import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  canTransitionOrderStatus,
  computePlatformMetrics,
  filterAndSortProducts,
  formatINR,
  getDiscountPercent,
  validateCheckoutForm,
  validateProductDraft,
} from './commerce';
import type { Order, Product } from '../types';

const sampleProductA: Product = {
  id: 'prod_maggi',
  name: 'Maggi 2-Minute Masala Noodles',
  brand: 'Nestle',
  category: 'Snacks & Instant',
  unit: '4 x 70 g',
  price: 56,
  mrp: 60,
  stock: 40,
  inStock: true,
  storeId: 'store_selaqui',
  storeName: 'Selaqui Super Mart',
  vendorId: 'vendor_demo_1',
  imageUrl: '/src/assets/images/cat_snacks_beverages_1795106710323.jpg',
  description: 'Quick hostel snack noodles.',
  featured: true,
  createdAt: '2026-09-30T10:00:00.000Z',
  updatedAt: '2026-09-30T10:00:00.000Z',
};

const sampleProductB: Product = {
  id: 'prod_milk',
  name: 'Amul Taaza Toned Milk',
  brand: 'Amul',
  category: 'Dairy & Bakery',
  unit: '1 L',
  price: 74,
  mrp: 78,
  stock: 25,
  inStock: true,
  storeId: 'store_selaqui',
  storeName: 'Selaqui Super Mart',
  vendorId: 'vendor_demo_1',
  imageUrl: '/src/assets/images/cat_dairy_bakery_1795106631928.jpg',
  description: 'Fresh UHT toned milk.',
  featured: false,
  createdAt: '2026-09-30T10:00:00.000Z',
  updatedAt: '2026-09-30T10:00:00.000Z',
};

test('calculateCartTotals applies delivery charge below threshold and waives it above threshold', () => {
  const settings = { deliveryFee: 19, freeDeliveryThreshold: 199, minOrderAmount: 49 };

  const smallCart = calculateCartTotals([{ product: sampleProductA, quantity: 2 }], settings);
  assert.equal(smallCart.subtotal, 112);
  assert.equal(smallCart.deliveryFee, 19);
  assert.equal(smallCart.total, 131);
  assert.equal(smallCart.qualifiesForFreeDelivery, false);
  assert.equal(smallCart.amountForFreeDelivery, 87);
  assert.equal(smallCart.meetsMinOrder, true);

  const freeCart = calculateCartTotals(
    [
      { product: sampleProductA, quantity: 2 },
      { product: sampleProductB, quantity: 2 },
    ],
    settings
  );
  assert.equal(freeCart.subtotal, 260);
  assert.equal(freeCart.deliveryFee, 0);
  assert.equal(freeCart.total, 260);
  assert.equal(freeCart.qualifiesForFreeDelivery, true);
  assert.equal(freeCart.savings, 16);
});

test('filterAndSortProducts filters by search query, category, and sorts accurately', () => {
  const items = [sampleProductA, sampleProductB];

  const byQuery = filterAndSortProducts(items, {
    query: 'maggi',
    category: 'All',
    sort: 'featured',
  });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'prod_maggi');

  const byPriceDesc = filterAndSortProducts(items, {
    query: '',
    category: 'All',
    sort: 'price_desc',
  });
  assert.equal(byPriceDesc[0].id, 'prod_milk');
});

test('canTransitionOrderStatus enforces strict role state machine and terminal lock', () => {
  assert.equal(canTransitionOrderStatus('placed', 'confirmed', 'vendor'), true);
  assert.equal(canTransitionOrderStatus('placed', 'delivered', 'vendor'), false);
  assert.equal(canTransitionOrderStatus('confirmed', 'packed', 'vendor'), true);
  assert.equal(canTransitionOrderStatus('packed', 'out_for_delivery', 'delivery'), true);
  assert.equal(canTransitionOrderStatus('out_for_delivery', 'delivered', 'delivery'), true);
  assert.equal(canTransitionOrderStatus('delivered', 'packed', 'delivery'), false);
  assert.equal(canTransitionOrderStatus('placed', 'cancelled', 'customer'), true);
  assert.equal(canTransitionOrderStatus('packed', 'cancelled', 'customer'), false);
  assert.equal(canTransitionOrderStatus('delivered', 'cancelled', 'admin'), true);
});

test('validateCheckoutForm rejects empty fields and accepts valid Dehradun hostel delivery details', () => {
  const bad = validateCheckoutForm({
    customerName: 'A',
    customerPhone: '1234',
    deliveryZone: '',
    deliveryAddress: 'Rm 2',
    paymentMethod: 'cod',
    notes: '',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.customerName);
  assert.ok(bad.errors.customerPhone);
  assert.ok(bad.errors.deliveryZone);
  assert.ok(bad.errors.deliveryAddress);

  const good = validateCheckoutForm({
    customerName: 'Sumanta Choudhury',
    customerPhone: '9876543210',
    deliveryZone: 'DBS Global University Hostel, Selaqui',
    deliveryAddress: 'Boys Hostel Block B, Room 214, Selaqui',
    paymentMethod: 'upi',
    notes: 'Call on arrival at main gate',
  });
  assert.equal(good.valid, true);
});

test('validateProductDraft enforces price <= mrp and positive bounds', () => {
  const invalid = validateProductDraft({
    name: 'Test Item',
    brand: 'QuickKart',
    category: 'Snacks & Instant',
    unit: '100 g',
    price: 120,
    mrp: 90,
    stock: -5,
    description: '',
    imageUrl: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.mrp);
  assert.ok(invalid.errors.stock);
});

test('computePlatformMetrics aggregates GMV, delivery revenue, and excludes cancelled orders', () => {
  const orders: Order[] = [
    {
      id: 'ord_1',
      orderNumber: 'QK-1001',
      customerId: 'u1',
      customerName: 'Aarav',
      customerPhone: '9876543210',
      deliveryZone: 'DBS Global University Hostel, Selaqui',
      deliveryAddress: 'Block A, Room 102',
      storeId: 'store_selaqui',
      storeName: 'Selaqui Super Mart',
      vendorId: 'v1',
      deliveryPartnerId: 'd1',
      deliveryPartnerName: 'Rohan Negi',
      status: 'delivered',
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      itemCount: 3,
      items: [],
      subtotal: 180,
      deliveryFee: 19,
      total: 199,
      deliveryOtp: '4821',
      notes: '',
      createdAt: '2026-09-30T10:00:00.000Z',
      updatedAt: '2026-09-30T10:25:00.000Z',
    },
    {
      id: 'ord_2',
      orderNumber: 'QK-1002',
      customerId: 'u2',
      customerName: 'Priya',
      customerPhone: '9876543211',
      deliveryZone: 'Prem Nagar & Chakrata Road',
      deliveryAddress: 'Lane 4, House 18',
      storeId: 'store_selaqui',
      storeName: 'Selaqui Super Mart',
      vendorId: 'v1',
      deliveryPartnerId: '',
      deliveryPartnerName: '',
      status: 'cancelled',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      itemCount: 1,
      items: [],
      subtotal: 100,
      deliveryFee: 19,
      total: 119,
      deliveryOtp: '1234',
      notes: '',
      createdAt: '2026-09-30T11:00:00.000Z',
      updatedAt: '2026-09-30T11:05:00.000Z',
    },
  ];
  const metrics = computePlatformMetrics(orders);
  assert.equal(metrics.totalOrders, 2);
  assert.equal(metrics.deliveredOrders, 1);
  assert.equal(metrics.activeOrders, 0);
  assert.equal(metrics.grossMerchandiseValue, 199);
  assert.equal(metrics.deliveryRevenue, 19);
  assert.equal(metrics.averageOrderValue, 199);
  assert.equal(formatINR(199), '₹199');
  assert.equal(getDiscountPercent(56, 60), 7);
});
