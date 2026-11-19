import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  createUserWithEmailAndPassword,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  testFirestoreConnection,
  updateProfile,
} from '../firebase';
import {
  DEFAULT_PLATFORM_SETTINGS,
  IMAGE_ASSETS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_STORES,
  SEED_USERS,
} from '../data/seedData';
import type {
  AppView,
  CartItem,
  Order,
  OrderStatus,
  PlatformSettings,
  Product,
  Store,
  UserProfile,
  UserRole,
} from '../types';
import {
  calculateCartTotals,
  canTransitionOrderStatus,
  DEHRADUN_ZONES,
  generateDeliveryOtp,
  generateOrderNumber,
  sanitizeId,
  type CartTotals,
  type CheckoutFormValues,
  type ProductDraftValues,
} from '../utils/commerce';

const STORAGE_KEYS = {
  cart: 'quickkart_cart_v1',
  orders: 'quickkart_orders_v1',
  products: 'quickkart_products_v1',
  stores: 'quickkart_stores_v1',
  settings: 'quickkart_settings_v1',
  users: 'quickkart_users_v1',
};

const BOOTSTRAPPED_ADMIN_EMAIL = 'sumantachoudhury768@gmail.com';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues in private browsing
  }
}

interface QuickKartContextValue {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  cloudConnected: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  products: Product[];
  stores: Store[];
  orders: Order[];
  users: UserProfile[];
  settings: PlatformSettings;
  cart: CartItem[];
  cartTotals: CartTotals;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  addToCart: (product: Product, qty?: number) => void;
  updateCartQuantity: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (form: CheckoutFormValues) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    actor: UserRole,
    extra?: { deliveryPartnerId?: string; deliveryPartnerName?: string; otpAttempt?: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  saveProduct: (draft: ProductDraftValues, existingId?: string, storeId?: string) => Promise<Product>;
  toggleProductStock: (productId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updatePlatformSettings: (next: Omit<PlatformSettings, 'updatedAt'>) => Promise<void>;
  addPartnerStore: (store: { name: string; zone: string; address: string; etaMinutes: number }) => Promise<void>;
  toggleStoreStatus: (storeId: string) => Promise<void>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  seedCloudCatalog: () => Promise<{ ok: boolean; message: string }>;
}

const QuickKartContext = createContext<QuickKartContextValue | null>(null);

export function QuickKartProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<AppView>('shop');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(() =>
    readLocalStorage<Product[]>(STORAGE_KEYS.products, SEED_PRODUCTS)
  );
  const [stores, setStores] = useState<Store[]>(() =>
    readLocalStorage<Store[]>(STORAGE_KEYS.stores, SEED_STORES)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    readLocalStorage<Order[]>(STORAGE_KEYS.orders, SEED_ORDERS)
  );
  const [users, setUsers] = useState<UserProfile[]>(() =>
    readLocalStorage<UserProfile[]>(STORAGE_KEYS.users, SEED_USERS)
  );
  const [settings, setSettings] = useState<PlatformSettings>(() =>
    readLocalStorage<PlatformSettings>(STORAGE_KEYS.settings, DEFAULT_PLATFORM_SETTINGS)
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    readLocalStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.cart, cart);
  }, [cart]);
  useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.products, products);
  }, [products]);
  useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.stores, stores);
  }, [stores]);
  useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.orders, orders);
  }, [orders]);
  useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.users, users);
  }, [users]);
  useEffect(() => {
    writeLocalStorage(STORAGE_KEYS.settings, settings);
  }, [settings]);

  // Mandatory startup connection test
  useEffect(() => {
    let active = true;
    testFirestoreConnection().then((ok) => {
      if (active) setCloudConnected(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  // Listen to Firebase Auth state and load/provision UserProfile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setAuthReady(true);
        return;
      }

      const isAdminEmail =
        user.emailVerified && user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
      const fallbackRole: UserRole = isAdminEmail ? 'admin' : 'customer';

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setUserProfile({
            uid: user.uid,
            displayName: String(data.displayName || user.displayName || 'QuickKart User'),
            email: String(data.email || user.email || ''),
            phone: String(data.phone || ''),
            role: isAdminEmail ? 'admin' : (data.role as UserRole) || 'customer',
            deliveryZone: String(data.deliveryZone || DEHRADUN_ZONES[0]),
            defaultAddress: String(data.defaultAddress || ''),
            createdAt: toIsoString(data.createdAt),
            updatedAt: toIsoString(data.updatedAt),
          });
        } else if (user.emailVerified) {
          const profilePayload = {
            uid: user.uid,
            displayName: (user.displayName || user.email?.split('@')[0] || 'QuickKart User').slice(0, 100),
            email: (user.email || '').slice(0, 160),
            phone: '',
            role: fallbackRole,
            deliveryZone: DEHRADUN_ZONES[0],
            defaultAddress: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, profilePayload);
          const nowIso = new Date().toISOString();
          setUserProfile({
            uid: user.uid,
            displayName: profilePayload.displayName,
            email: profilePayload.email,
            phone: '',
            role: fallbackRole,
            deliveryZone: profilePayload.deliveryZone,
            defaultAddress: '',
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        } else {
          const nowIso = new Date().toISOString();
          setUserProfile({
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'QuickKart User',
            email: user.email || '',
            phone: '',
            role: fallbackRole,
            deliveryZone: DEHRADUN_ZONES[0],
            defaultAddress: '',
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      } catch (err) {
        console.warn('User profile sync fallback:', err);
        const nowIso = new Date().toISOString();
        setUserProfile({
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'QuickKart User',
          email: user.email || '',
          phone: '',
          role: fallbackRole,
          deliveryZone: DEHRADUN_ZONES[0],
          defaultAddress: '',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore real-time listeners only after auth is ready and user is authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    const unsubscribers: (() => void)[] = [];

    // 1. Platform Settings
    const settingsUnsub = onSnapshot(
      doc(db, 'settings', 'platform'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSettings({
            deliveryFee: Number(d.deliveryFee ?? DEFAULT_PLATFORM_SETTINGS.deliveryFee),
            freeDeliveryThreshold: Number(
              d.freeDeliveryThreshold ?? DEFAULT_PLATFORM_SETTINGS.freeDeliveryThreshold
            ),
            minOrderAmount: Number(d.minOrderAmount ?? DEFAULT_PLATFORM_SETTINGS.minOrderAmount),
            serviceCity: String(d.serviceCity || DEFAULT_PLATFORM_SETTINGS.serviceCity),
            supportPhone: String(d.supportPhone || DEFAULT_PLATFORM_SETTINGS.supportPhone),
            updatedAt: toIsoString(d.updatedAt),
          });
        }
      },
      (error) => {
        console.warn('Settings listener notice:', error.message);
      }
    );
    unsubscribers.push(settingsUnsub);

    // 2. Partner Stores
    const storesUnsub = onSnapshot(
      collection(db, 'stores'),
      (snap) => {
        if (!snap.empty) {
          const remoteStores: Store[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              name: String(d.name),
              zone: String(d.zone),
              address: String(d.address),
              ownerId: String(d.ownerId),
              etaMinutes: Number(d.etaMinutes || 20),
              rating: Number(d.rating || 4.8),
              isActive: Boolean(d.isActive),
              createdAt: toIsoString(d.createdAt),
              updatedAt: toIsoString(d.updatedAt),
            };
          });
          setStores(remoteStores);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'stores');
      }
    );
    unsubscribers.push(storesUnsub);

    // 3. Products Catalogue
    const productsUnsub = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (!snap.empty) {
          const remoteProducts: Product[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              name: String(d.name),
              brand: String(d.brand),
              category: d.category,
              unit: String(d.unit),
              price: Number(d.price),
              mrp: Number(d.mrp),
              stock: Number(d.stock),
              inStock: Boolean(d.inStock),
              storeId: String(d.storeId),
              storeName: String(d.storeName),
              vendorId: String(d.vendorId),
              imageUrl: String(d.imageUrl || IMAGE_ASSETS.staplesGrains),
              description: String(d.description || ''),
              featured: Boolean(d.featured),
              createdAt: toIsoString(d.createdAt),
              updatedAt: toIsoString(d.updatedAt),
            };
          });
          setProducts(remoteProducts);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );
    unsubscribers.push(productsUnsub);

    // 4. Scoped Orders listener (respects Firestore rules strictly)
    const isAdminEmail =
      firebaseUser.emailVerified &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
    const ordersQuery = isAdminEmail
      ? collection(db, 'orders')
      : query(collection(db, 'orders'), where('customerId', '==', firebaseUser.uid));

    const ordersUnsub = onSnapshot(
      ordersQuery,
      (snap) => {
        if (!snap.empty) {
          const remoteOrders: Order[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              orderNumber: String(d.orderNumber),
              customerId: String(d.customerId),
              customerName: String(d.customerName),
              customerPhone: String(d.customerPhone),
              deliveryZone: String(d.deliveryZone),
              deliveryAddress: String(d.deliveryAddress),
              storeId: String(d.storeId),
              storeName: String(d.storeName),
              vendorId: String(d.vendorId),
              deliveryPartnerId: String(d.deliveryPartnerId || ''),
              deliveryPartnerName: String(d.deliveryPartnerName || ''),
              status: d.status as OrderStatus,
              paymentMethod: d.paymentMethod,
              paymentStatus: d.paymentStatus,
              itemCount: Number(d.itemCount || 1),
              items: Array.isArray(d.items) ? d.items : [],
              subtotal: Number(d.subtotal || 0),
              deliveryFee: Number(d.deliveryFee || 0),
              total: Number(d.total || 0),
              deliveryOtp: String(d.deliveryOtp || '1234'),
              notes: String(d.notes || ''),
              createdAt: toIsoString(d.createdAt),
              updatedAt: toIsoString(d.updatedAt),
            };
          });
          setOrders((prev) => {
            const remoteIds = new Set(remoteOrders.map((o) => o.id));
            const localDemo = prev.filter((o) => o.id.startsWith('ord_demo_') && !remoteIds.has(o.id));
            return [...remoteOrders, ...localDemo].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            );
          });
        }
      },
      (error) => {
        console.warn('Orders snapshot notice:', error.message);
      }
    );
    unsubscribers.push(ordersUnsub);

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [authReady, firebaseUser]);

  const cartTotals = useMemo(() => calculateCartTotals(cart, settings), [cart, settings]);

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      if (!product.inStock || product.stock <= 0) {
        showToast(`${product.name} is currently out of stock.`);
        return;
      }
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          const nextQty = Math.min(product.stock, existing.quantity + qty);
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, product, quantity: nextQty } : item
          );
        }
        return [...prev, { product, quantity: Math.min(product.stock, qty) }];
      });
      showToast(`Added ${product.name} to cart`);
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((productId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(Math.max(1, item.product.stock), qty) }
          : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const placeOrder = useCallback(
    async (form: CheckoutFormValues): Promise<Order> => {
      const primaryProduct = cart[0]?.product;
      const storeId = primaryProduct?.storeId || stores[0]?.id || 'store_selaqui_mart';
      const storeName = primaryProduct?.storeName || stores[0]?.name || 'Doon Campus Fresh Mart';
      const vendorId = primaryProduct?.vendorId || stores[0]?.ownerId || 'vendor_demo_selaqui';
      const nowIso = new Date().toISOString();
      const orderId = sanitizeId(`ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
      const orderNumber = generateOrderNumber(Date.now());
      const deliveryOtp = generateDeliveryOtp(Date.now());
      const cleanPhone = form.customerPhone.replace(/\D/g, '').slice(0, 15);

      const orderItems = cart.slice(0, 30).map((entry) => ({
        productId: entry.product.id,
        name: entry.product.name.slice(0, 120),
        unit: entry.product.unit.slice(0, 40),
        price: entry.product.price,
        quantity: entry.quantity,
        lineTotal: Math.round(entry.product.price * entry.quantity * 100) / 100,
        imageUrl: entry.product.imageUrl,
      }));

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customerId: firebaseUser?.uid || 'guest_student_session',
        customerName: form.customerName.trim().slice(0, 100),
        customerPhone: cleanPhone,
        deliveryZone: form.deliveryZone.trim().slice(0, 80),
        deliveryAddress: form.deliveryAddress.trim().slice(0, 240),
        storeId,
        storeName,
        vendorId,
        deliveryPartnerId: '',
        deliveryPartnerName: '',
        status: 'placed',
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentMethod === 'upi' ? 'paid' : 'pending',
        itemCount: cartTotals.itemCount,
        items: orderItems,
        subtotal: cartTotals.subtotal,
        deliveryFee: cartTotals.deliveryFee,
        total: cartTotals.total,
        deliveryOtp,
        notes: form.notes.trim().slice(0, 240),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Persist to Firestore if authenticated & email verified and store exists in cloud
      if (firebaseUser?.emailVerified) {
        try {
          const storeSnap = await getDoc(doc(db, 'stores', storeId));
          if (storeSnap.exists()) {
            await setDoc(doc(db, 'orders', orderId), {
              orderNumber: newOrder.orderNumber,
              customerId: firebaseUser.uid,
              customerName: newOrder.customerName,
              customerPhone: newOrder.customerPhone,
              deliveryZone: newOrder.deliveryZone,
              deliveryAddress: newOrder.deliveryAddress,
              storeId: newOrder.storeId,
              storeName: newOrder.storeName,
              vendorId: newOrder.vendorId,
              deliveryPartnerId: '',
              deliveryPartnerName: '',
              status: 'placed',
              paymentMethod: newOrder.paymentMethod,
              paymentStatus: newOrder.paymentStatus,
              itemCount: newOrder.itemCount,
              items: newOrder.items,
              subtotal: newOrder.subtotal,
              deliveryFee: newOrder.deliveryFee,
              total: newOrder.total,
              deliveryOtp: newOrder.deliveryOtp,
              notes: newOrder.notes,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Order Firestore sync fallback:', err);
        }
      }

      // Update local state immediately so UI reflects order + decrements stock
      setOrders((prev) => [newOrder, ...prev]);
      setProducts((prev) =>
        prev.map((prod) => {
          const ordered = cart.find((c) => c.product.id === prod.id);
          if (!ordered) return prod;
          const nextStock = Math.max(0, prod.stock - ordered.quantity);
          return { ...prod, stock: nextStock, inStock: nextStock > 0 };
        })
      );
      setCart([]);
      setSelectedOrderId(newOrder.id);
      setCheckoutOpen(false);
      setCartOpen(false);
      setActiveView('orders');
      showToast(`Order ${newOrder.orderNumber} confirmed!`);
      return newOrder;
    },
    [cart, cartTotals, firebaseUser, showToast, stores]
  );

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      nextStatus: OrderStatus,
      actor: UserRole,
      extra?: { deliveryPartnerId?: string; deliveryPartnerName?: string; otpAttempt?: string }
    ): Promise<{ ok: boolean; error?: string }> => {
      const target = orders.find((o) => o.id === orderId);
      if (!target) return { ok: false, error: 'Order not found.' };

      if (!canTransitionOrderStatus(target.status, nextStatus, actor)) {
        return {
          ok: false,
          error: `Cannot transition order from ${target.status} to ${nextStatus} as ${actor}.`,
        };
      }

      if (actor === 'delivery' && nextStatus === 'delivered' && extra?.otpAttempt !== undefined) {
        if (extra.otpAttempt.trim() !== target.deliveryOtp) {
          return { ok: false, error: 'Incorrect 4-digit delivery OTP. Ask customer to confirm.' };
        }
      }

      const nowIso = new Date().toISOString();
      const nextPartnerId = extra?.deliveryPartnerId ?? target.deliveryPartnerId;
      const nextPartnerName = extra?.deliveryPartnerName ?? target.deliveryPartnerName;
      const nextPaymentStatus = nextStatus === 'delivered' ? 'paid' : target.paymentStatus;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: nextStatus,
                deliveryPartnerId: nextPartnerId,
                deliveryPartnerName: nextPartnerName,
                paymentStatus: nextPaymentStatus,
                updatedAt: nowIso,
              }
            : o
        )
      );

      if (firebaseUser?.emailVerified && !orderId.startsWith('ord_demo_')) {
        try {
          const updatePayload: Record<string, unknown> = {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          };
          if (extra?.deliveryPartnerId !== undefined) {
            updatePayload.deliveryPartnerId = nextPartnerId;
            updatePayload.deliveryPartnerName = nextPartnerName;
          }
          if (nextStatus === 'delivered') {
            updatePayload.paymentStatus = 'paid';
          }
          await updateDoc(doc(db, 'orders', orderId), updatePayload);
        } catch (err) {
          console.warn('Firestore order status update notice:', err);
        }
      }

      showToast(`Order ${target.orderNumber} updated to ${nextStatus.replace(/_/g, ' ')}`);
      return { ok: true };
    },
    [firebaseUser, orders, showToast]
  );

  const saveProduct = useCallback(
    async (draft: ProductDraftValues, existingId?: string, storeId?: string): Promise<Product> => {
      const targetStore =
        stores.find((s) => s.id === storeId) || stores[0] || SEED_STORES[0];
      const nowIso = new Date().toISOString();
      const productId = existingId || sanitizeId(`prod_${Date.now()}`);
      const existingProd = existingId ? products.find((p) => p.id === existingId) : undefined;

      const productRecord: Product = {
        id: productId,
        name: draft.name.trim().slice(0, 120),
        brand: draft.brand.trim().slice(0, 80),
        category: draft.category,
        unit: draft.unit.trim().slice(0, 40),
        price: Number(draft.price),
        mrp: Number(draft.mrp),
        stock: Number(draft.stock),
        inStock: Number(draft.stock) > 0,
        storeId: existingProd?.storeId || targetStore.id,
        storeName: existingProd?.storeName || targetStore.name,
        vendorId: existingProd?.vendorId || firebaseUser?.uid || targetStore.ownerId,
        imageUrl: draft.imageUrl.trim() || IMAGE_ASSETS.staplesGrains,
        description: draft.description.trim().slice(0, 400),
        featured: existingProd?.featured ?? false,
        createdAt: existingProd?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      setProducts((prev) => {
        if (existingId) {
          return prev.map((p) => (p.id === existingId ? productRecord : p));
        }
        return [productRecord, ...prev];
      });

      if (firebaseUser?.emailVerified) {
        try {
          if (existingId) {
            await updateDoc(doc(db, 'products', productId), {
              name: productRecord.name,
              brand: productRecord.brand,
              category: productRecord.category,
              unit: productRecord.unit,
              price: productRecord.price,
              mrp: productRecord.mrp,
              stock: productRecord.stock,
              inStock: productRecord.inStock,
              imageUrl: productRecord.imageUrl,
              description: productRecord.description,
              featured: productRecord.featured,
              updatedAt: serverTimestamp(),
            });
          } else {
            const storeExists = (await getDoc(doc(db, 'stores', productRecord.storeId))).exists();
            if (storeExists) {
              await setDoc(doc(db, 'products', productId), {
                name: productRecord.name,
                brand: productRecord.brand,
                category: productRecord.category,
                unit: productRecord.unit,
                price: productRecord.price,
                mrp: productRecord.mrp,
                stock: productRecord.stock,
                inStock: productRecord.inStock,
                storeId: productRecord.storeId,
                storeName: productRecord.storeName,
                vendorId: productRecord.vendorId,
                imageUrl: productRecord.imageUrl,
                description: productRecord.description,
                featured: productRecord.featured,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch (err) {
          console.warn('Firestore product write notice:', err);
        }
      }

      showToast(existingId ? `Updated ${productRecord.name}` : `Added ${productRecord.name} to catalogue`);
      return productRecord;
    },
    [firebaseUser, products, showToast, stores]
  );

  const toggleProductStock = useCallback(
    async (productId: string) => {
      const target = products.find((p) => p.id === productId);
      if (!target) return;
      const nextInStock = !target.inStock;
      const nextStock = nextInStock ? Math.max(10, target.stock) : 0;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, inStock: nextInStock, stock: nextStock, updatedAt: new Date().toISOString() }
            : p
        )
      );

      if (firebaseUser?.emailVerified) {
        try {
          await updateDoc(doc(db, 'products', productId), {
            inStock: nextInStock,
            stock: nextStock,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Stock toggle sync notice:', err);
        }
      }
      showToast(`${target.name} marked ${nextInStock ? 'In Stock' : 'Out of Stock'}`);
    },
    [firebaseUser, products, showToast]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      const target = products.find((p) => p.id === productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setCart((prev) => prev.filter((c) => c.product.id !== productId));

      if (firebaseUser?.emailVerified) {
        try {
          await deleteDoc(doc(db, 'products', productId));
        } catch (err) {
          console.warn('Product delete sync notice:', err);
        }
      }
      if (target) showToast(`Removed ${target.name}`);
    },
    [firebaseUser, products, showToast]
  );

  const updatePlatformSettings = useCallback(
    async (next: Omit<PlatformSettings, 'updatedAt'>) => {
      const updated: PlatformSettings = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      setSettings(updated);

      if (firebaseUser?.emailVerified && userProfile?.role === 'admin') {
        try {
          await setDoc(
            doc(db, 'settings', 'platform'),
            {
              deliveryFee: updated.deliveryFee,
              freeDeliveryThreshold: updated.freeDeliveryThreshold,
              minOrderAmount: updated.minOrderAmount,
              serviceCity: updated.serviceCity,
              supportPhone: updated.supportPhone,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('Settings sync notice:', err);
        }
      }
      showToast('Platform pricing & delivery settings saved');
    },
    [firebaseUser, showToast, userProfile?.role]
  );

  const addPartnerStore = useCallback(
    async (input: { name: string; zone: string; address: string; etaMinutes: number }) => {
      const nowIso = new Date().toISOString();
      const storeId = sanitizeId(`store_${Date.now()}`);
      const newStore: Store = {
        id: storeId,
        name: input.name.trim().slice(0, 100),
        zone: input.zone.trim().slice(0, 80),
        address: input.address.trim().slice(0, 200),
        ownerId: firebaseUser?.uid || 'vendor_demo_selaqui',
        etaMinutes: Math.max(10, Math.min(120, Number(input.etaMinutes) || 20)),
        rating: 4.8,
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setStores((prev) => [newStore, ...prev]);

      if (firebaseUser?.emailVerified && userProfile?.role === 'admin') {
        try {
          await setDoc(doc(db, 'stores', storeId), {
            name: newStore.name,
            zone: newStore.zone,
            address: newStore.address,
            ownerId: newStore.ownerId,
            etaMinutes: newStore.etaMinutes,
            rating: newStore.rating,
            isActive: newStore.isActive,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Store create sync notice:', err);
        }
      }
      showToast(`Added partner store: ${newStore.name}`);
    },
    [firebaseUser, showToast, userProfile?.role]
  );

  const toggleStoreStatus = useCallback(
    async (storeId: string) => {
      const target = stores.find((s) => s.id === storeId);
      if (!target) return;
      const nextActive = !target.isActive;
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, isActive: nextActive } : s))
      );

      if (firebaseUser?.emailVerified && userProfile?.role === 'admin') {
        try {
          await updateDoc(doc(db, 'stores', storeId), {
            isActive: nextActive,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Store status sync notice:', err);
        }
      }
      showToast(`${target.name} is now ${nextActive ? 'Active' : 'Paused'}`);
    },
    [firebaseUser, showToast, stores, userProfile?.role]
  );

  const updateUserRole = useCallback(
    async (uid: string, role: UserRole) => {
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role, updatedAt: new Date().toISOString() } : u))
      );
      if (firebaseUser?.emailVerified && userProfile?.role === 'admin') {
        try {
          await updateDoc(doc(db, 'users', uid), {
            role,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn('Role sync notice:', err);
        }
      }
      showToast(`Updated account role to ${role}`);
    },
    [firebaseUser, showToast, userProfile?.role]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
      showToast('Signed in with Google');
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      return { ok: false, error: msg };
    }
  }, [showToast]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setAuthModalOpen(false);
        showToast('Signed in successfully');
        return { ok: true };
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Sign-in failed.';
        if (raw.includes('operation-not-allowed')) {
          return {
            ok: false,
            error:
              'Email/Password sign-in is not yet enabled in Firebase Console → Authentication → Sign-in method. Enable it there, or use Google Sign-In above.',
          };
        }
        return { ok: false, error: raw };
      }
    },
    [showToast]
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        setAuthModalOpen(false);
        showToast(`Welcome to QuickKart, ${name.trim()}!`);
        return { ok: true };
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Account creation failed.';
        if (raw.includes('operation-not-allowed')) {
          return {
            ok: false,
            error:
              'Email/Password sign-up is not yet enabled in Firebase Console → Authentication → Sign-in method. Enable it there, or use Google Sign-In above.',
          };
        }
        return { ok: false, error: raw };
      }
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('Signed out of QuickKart');
  }, [showToast]);

  const seedCloudCatalog = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    if (!firebaseUser?.emailVerified) {
      return {
        ok: false,
        message: 'Sign in with your verified admin Google account first to seed Cloud Firestore.',
      };
    }
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        deliveryFee: settings.deliveryFee,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        minOrderAmount: settings.minOrderAmount,
        serviceCity: settings.serviceCity,
        supportPhone: settings.supportPhone,
        updatedAt: serverTimestamp(),
      });

      for (const store of stores) {
        await setDoc(doc(db, 'stores', store.id), {
          name: store.name,
          zone: store.zone,
          address: store.address,
          ownerId: store.ownerId,
          etaMinutes: store.etaMinutes,
          rating: store.rating,
          isActive: store.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const product of products) {
        await setDoc(doc(db, 'products', product.id), {
          name: product.name,
          brand: product.brand,
          category: product.category,
          unit: product.unit,
          price: product.price,
          mrp: product.mrp,
          stock: product.stock,
          inStock: product.inStock,
          storeId: product.storeId,
          storeName: product.storeName,
          vendorId: product.vendorId,
          imageUrl: product.imageUrl,
          description: product.description,
          featured: product.featured,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      showToast('Synced stores, products & settings to Cloud Firestore');
      return { ok: true, message: 'Cloud Firestore seeded with all Dehradun stores and products.' };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'stores/products/settings');
    }
  }, [firebaseUser, products, settings, showToast, stores]);

  const value: QuickKartContextValue = {
    activeView,
    setActiveView,
    firebaseUser,
    userProfile,
    authReady,
    cloudConnected,
    isAuthModalOpen,
    setAuthModalOpen,
    isCartOpen,
    setCartOpen,
    isCheckoutOpen,
    setCheckoutOpen,
    selectedOrderId,
    setSelectedOrderId,
    products,
    stores,
    orders,
    users,
    settings,
    cart,
    cartTotals,
    toastMessage,
    showToast,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    updateOrderStatus,
    saveProduct,
    toggleProductStock,
    deleteProduct,
    updatePlatformSettings,
    addPartnerStore,
    toggleStoreStatus,
    updateUserRole,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    logout,
    seedCloudCatalog,
  };

  return <QuickKartContext.Provider value={value}>{children}</QuickKartContext.Provider>;
}

export function useQuickKart() {
  const ctx = useContext(QuickKartContext);
  if (!ctx) throw new Error('useQuickKart must be used within QuickKartProvider');
  return ctx;
}
