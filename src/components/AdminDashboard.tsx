import React, { useMemo, useState } from 'react';
import { Save, Plus, Database } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import type { OrderStatus, UserRole } from '../types';
import {
  computePlatformMetrics,
  DEHRADUN_ZONES,
  formatINR,
  getStatusLabel,
} from '../utils/commerce';

export function AdminDashboard() {
  const {
    orders,
    stores,
    users,
    settings,
    cloudConnected,
    updatePlatformSettings,
    addPartnerStore,
    toggleStoreStatus,
    updateUserRole,
    updateOrderStatus,
    seedCloudCatalog,
    showToast,
  } = useQuickKart();

  const [tab, setTab] = useState<'overview' | 'pricing' | 'stores' | 'users'>('overview');
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Configurable business pricing form
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeDeliveryThreshold);
  const [minOrder, setMinOrder] = useState(settings.minOrderAmount);
  const [serviceCity, setServiceCity] = useState(settings.serviceCity);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Add Store form
  const [storeName, setStoreName] = useState('');
  const [storeZone, setStoreZone] = useState(DEHRADUN_ZONES[0]);
  const [storeAddress, setStoreAddress] = useState('');
  const [storeEta, setStoreEta] = useState(20);
  const [storeError, setStoreError] = useState<string | null>(null);

  const metrics = useMemo(() => computePlatformMetrics(orders), [orders]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryFee < 0 || deliveryFee > 500) {
      setSettingsError('Delivery fee must be between ₹0 and ₹500.');
      return;
    }
    if (freeThreshold < 0 || freeThreshold > 10000) {
      setSettingsError('Free delivery threshold must be between ₹0 and ₹10,000.');
      return;
    }
    if (minOrder < 0 || minOrder > 5000) {
      setSettingsError('Minimum order value must be between ₹0 and ₹5,000.');
      return;
    }
    setSettingsError(null);
    await updatePlatformSettings({
      deliveryFee: Number(deliveryFee),
      freeDeliveryThreshold: Number(freeThreshold),
      minOrderAmount: Number(minOrder),
      serviceCity: serviceCity.trim() || 'Dehradun, Uttarakhand',
      supportPhone: supportPhone.trim() || '+91 135 269 4410',
    });
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName.trim().length < 2 || storeAddress.trim().length < 5) {
      setStoreError('Enter a valid store name and Dehradun street address.');
      return;
    }
    setStoreError(null);
    await addPartnerStore({
      name: storeName,
      zone: storeZone,
      address: storeAddress,
      etaMinutes: storeEta,
    });
    setStoreName('');
    setStoreAddress('');
    setStoreEta(20);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E4DF]">
        <div>
          <p className="text-xs font-medium text-[#146C43] mb-1">
            QuickKart Platform Administration · {settings.serviceCity}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#181A18] tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-[#5C615C]">
            Backend:{' '}
            <span className="font-semibold text-[#181A18]">
              {cloudConnected ? 'Firebase Firestore Connected' : 'Local Session Cache'}
            </span>
          </p>
          <button
            type="button"
            disabled={syncingCloud}
            onClick={async () => {
              setSyncingCloud(true);
              try {
                const res = await seedCloudCatalog();
                if (!res.ok) showToast(res.message);
              } finally {
                setSyncingCloud(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#181A18] bg-white border border-[#D4D3CC] hover:bg-[#F3F2EE] rounded-lg cursor-pointer disabled:opacity-60"
          >
            <Database className="w-3.5 h-3.5" aria-hidden="true" />
            {syncingCloud ? 'Syncing...' : 'Sync Catalogue to Cloud'}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 py-6 border-b border-[#E5E4DF]">
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Gross Order Value</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {formatINR(metrics.grossMerchandiseValue)}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Delivery Fee Revenue</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#146C43] mt-1">
            {formatINR(metrics.deliveryRevenue)}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Total Orders</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {metrics.totalOrders}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Active In-Flight</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#C2590A] mt-1">
            {metrics.activeOrders}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Avg Order Value</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {formatINR(metrics.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="my-6 overflow-x-auto">
        <div className="inline-flex p-1 bg-[#F3F2EE] rounded-lg">
          {(
            [
              ['overview', 'Orders Ledger'],
              ['pricing', 'Delivery & Pricing Rules'],
              ['stores', `Partner Stores (${stores.length})`],
              ['users', `Accounts & Roles (${users.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                tab === id ? 'bg-white text-[#181A18] shadow-xs' : 'text-[#5C615C]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#5C615C]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Delivery</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Status Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF9F6]/70">
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#181A18]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#181A18]">{order.customerName}</p>
                      <p className="text-xs text-[#5C615C]">{order.deliveryZone}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#5C615C]">{order.storeName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#181A18]">
                      {formatINR(order.subtotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-[#5C615C]">
                      {formatINR(order.deliveryFee)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#181A18]">
                      {formatINR(order.total)}
                    </td>
                    <td className="py-3 px-4">
                      <label htmlFor={`admin-status-${order.id}`} className="sr-only">
                        Order status for {order.orderNumber}
                      </label>
                      <select
                        id={`admin-status-${order.id}`}
                        value={order.status}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value as OrderStatus, 'admin')
                        }
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-[#D4D3CC] rounded-md text-[#181A18]"
                      >
                        {(
                          [
                            'placed',
                            'confirmed',
                            'packed',
                            'out_for_delivery',
                            'delivered',
                            'cancelled',
                          ] as OrderStatus[]
                        ).map((st) => (
                          <option key={st} value={st}>
                            {getStatusLabel(st)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'pricing' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-[#E5E4DF] rounded-xl p-6 max-w-2xl space-y-5"
        >
          <div>
            <h2 className="text-lg font-bold text-[#181A18]">
              Configurable Delivery Charges &amp; Order Thresholds
            </h2>
            <p className="text-xs text-[#5C615C] mt-1">
              Changes take effect immediately in the customer storefront and checkout bill
              calculator.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cfg-delivery-fee" className="block text-xs font-semibold text-[#181A18] mb-1">
                Standard Delivery Fee (₹)
              </label>
              <input
                id="cfg-delivery-fee"
                type="number"
                min="0"
                max="500"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>

            <div>
              <label htmlFor="cfg-free-threshold" className="block text-xs font-semibold text-[#181A18] mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                id="cfg-free-threshold"
                type="number"
                min="0"
                max="10000"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>

            <div>
              <label htmlFor="cfg-min-order" className="block text-xs font-semibold text-[#181A18] mb-1">
                Minimum Order Value (₹)
              </label>
              <input
                id="cfg-min-order"
                type="number"
                min="0"
                max="5000"
                value={minOrder}
                onChange={(e) => setMinOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-city" className="block text-xs font-semibold text-[#181A18] mb-1">
                Primary Operating City
              </label>
              <input
                id="cfg-city"
                type="text"
                value={serviceCity}
                onChange={(e) => setServiceCity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>

            <div>
              <label htmlFor="cfg-support" className="block text-xs font-semibold text-[#181A18] mb-1">
                Customer Support Number
              </label>
              <input
                id="cfg-support"
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>
          </div>

          {settingsError && (
            <p role="alert" className="text-xs text-red-700">
              {settingsError}
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Save Delivery Configuration
          </button>
        </form>
      )}

      {tab === 'stores' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#5C615C]">
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4 text-right">ETA</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] text-sm">
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#181A18]">{store.name}</p>
                      <p className="text-xs text-[#5C615C]">{store.address}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#5C615C]">{store.zone}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                      {store.etaMinutes} min
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleStoreStatus(store.id)}
                        className={`text-xs font-semibold underline underline-offset-4 cursor-pointer ${
                          store.isActive ? 'text-[#146C43]' : 'text-[#C2590A]'
                        }`}
                      >
                        {store.isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleAddStore}
            className="lg:col-span-5 bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-[#181A18]">Onboard Dehradun Partner Store</h2>
            <div>
              <label htmlFor="new-store-name" className="block text-xs font-semibold text-[#181A18] mb-1">
                Store Name
              </label>
              <input
                id="new-store-name"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Sudhowala Express Kirana"
                className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>
            <div>
              <label htmlFor="new-store-zone" className="block text-xs font-semibold text-[#181A18] mb-1">
                Service Zone
              </label>
              <select
                id="new-store-zone"
                value={storeZone}
                onChange={(e) => setStoreZone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg bg-white focus:outline-none focus:border-[#146C43]"
              >
                {DEHRADUN_ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-store-address" className="block text-xs font-semibold text-[#181A18] mb-1">
                Store Address
              </label>
              <input
                id="new-store-address"
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Shop number, landmark, Dehradun"
                className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>
            <div>
              <label htmlFor="new-store-eta" className="block text-xs font-semibold text-[#181A18] mb-1">
                Avg Delivery ETA (minutes)
              </label>
              <input
                id="new-store-eta"
                type="number"
                min="10"
                max="90"
                value={storeEta}
                onChange={(e) => setStoreEta(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>
            {storeError && (
              <p role="alert" className="text-xs text-red-700">
                {storeError}
              </p>
            )}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Partner Store
            </button>
          </form>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#5C615C]">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Dehradun Zone</th>
                  <th className="py-3 px-4 text-right">Assigned Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] text-sm">
                {users.map((u) => (
                  <tr key={u.uid}>
                    <td className="py-3 px-4 font-semibold text-[#181A18]">{u.displayName}</td>
                    <td className="py-3 px-4 text-xs text-[#5C615C]">{u.email}</td>
                    <td className="py-3 px-4 text-xs text-[#5C615C]">{u.deliveryZone}</td>
                    <td className="py-3 px-4 text-right">
                      <label htmlFor={`role-${u.uid}`} className="sr-only">
                        Role for {u.displayName}
                      </label>
                      <select
                        id={`role-${u.uid}`}
                        value={u.role}
                        onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                        className="px-2.5 py-1.5 text-xs font-medium bg-white border border-[#D4D3CC] rounded-md text-[#181A18]"
                      >
                        <option value="customer">Customer</option>
                        <option value="vendor">Vendor</option>
                        <option value="delivery">Delivery Partner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
