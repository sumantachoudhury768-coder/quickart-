import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Upload, X, CheckCircle2, PackageCheck } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import { IMAGE_ASSETS } from '../data/seedData';
import { uploadProductImage } from '../firebase';
import type { Product, ProductCategory } from '../types';
import {
  formatINR,
  getStatusLabel,
  PRODUCT_CATEGORIES,
  validateProductDraft,
  type ProductDraftValues,
} from '../utils/commerce';

const CATEGORY_DEFAULT_IMAGES: Record<ProductCategory, string> = {
  'Fresh Produce': IMAGE_ASSETS.freshProduce,
  'Dairy & Bakery': IMAGE_ASSETS.dairyBakery,
  'Snacks & Instant': IMAGE_ASSETS.snacksBeverages,
  Beverages: IMAGE_ASSETS.snacksBeverages,
  'Staples & Grains': IMAGE_ASSETS.staplesGrains,
  'Household & Care': IMAGE_ASSETS.householdCare,
};

const EMPTY_DRAFT: ProductDraftValues = {
  name: '',
  brand: '',
  category: 'Snacks & Instant',
  unit: '',
  price: 0,
  mrp: 0,
  stock: 20,
  description: '',
  imageUrl: IMAGE_ASSETS.snacksBeverages,
};

export function VendorDashboard() {
  const {
    stores,
    products,
    orders,
    updateOrderStatus,
    saveProduct,
    toggleProductStock,
    deleteProduct,
    showToast,
  } = useQuickKart();

  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || 'all');
  const [tab, setTab] = useState<'orders' | 'inventory'>('orders');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraftValues>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const storeOrders = useMemo(() => {
    if (selectedStoreId === 'all') return orders;
    return orders.filter((o) => o.storeId === selectedStoreId);
  }, [orders, selectedStoreId]);

  const storeProducts = useMemo(() => {
    if (selectedStoreId === 'all') return products;
    return products.filter((p) => p.storeId === selectedStoreId);
  }, [products, selectedStoreId]);

  const pendingCount = storeOrders.filter((o) => o.status === 'placed' || o.status === 'confirmed').length;
  const packedCount = storeOrders.filter((o) => o.status === 'packed').length;
  const lowStockCount = storeProducts.filter((p) => p.stock <= 10).length;

  const openAddForm = () => {
    setEditingProduct(null);
    setDraft({ ...EMPTY_DRAFT });
    setErrors({});
    setFormOpen(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setDraft({
      name: product.name,
      brand: product.brand,
      category: product.category,
      unit: product.unit,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      description: product.description,
      imageUrl: product.imageUrl,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file, editingProduct?.id || `draft_${Date.now()}`);
      setDraft((prev) => ({ ...prev, imageUrl: url }));
      showToast('Uploaded product image to Firebase Storage');
    } catch {
      const localPreview = URL.createObjectURL(file);
      setDraft((prev) => ({ ...prev, imageUrl: localPreview }));
      showToast('Preview attached locally (sign in for Firebase Storage upload)');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProductDraft(draft);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    const targetStoreId = selectedStoreId === 'all' ? stores[0]?.id : selectedStoreId;
    await saveProduct(draft, editingProduct?.id, targetStoreId);
    setFormOpen(false);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      {/* Header & Store Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5E4DF]">
        <div>
          <p className="text-xs font-medium text-[#146C43] mb-1">Partner Store Operations</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#181A18] tracking-tight">
            Vendor Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="vendor-store-select" className="sr-only">
            Select store
          </label>
          <select
            id="vendor-store-select"
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-3.5 py-2 text-sm bg-white border border-[#D4D3CC] rounded-lg text-[#181A18] focus:outline-none focus:border-[#146C43]"
          >
            <option value="all">All Dehradun Partner Stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Product
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-[#E5E4DF]">
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Orders to Pick &amp; Pack</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Ready for Rider Pickup</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#146C43] mt-1">
            {packedCount}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Active Catalogue SKUs</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {storeProducts.length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Low Stock Alerts</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#C2590A] mt-1">
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Segmented Workspace Tabs */}
      <div className="flex items-center gap-2 my-6">
        <div className="inline-flex p-1 bg-[#F3F2EE] rounded-lg">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'orders' ? 'bg-white text-[#181A18] shadow-xs' : 'text-[#5C615C]'
            }`}
          >
            Incoming Orders ({storeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('inventory')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'inventory' ? 'bg-white text-[#181A18] shadow-xs' : 'text-[#5C615C]'
            }`}
          >
            Product Inventory ({storeProducts.length})
          </button>
        </div>
      </div>

      {tab === 'orders' ? (
        <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
          {storeOrders.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5C615C]">
              No orders assigned to this store yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#5C615C]">
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Customer &amp; Zone</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] text-sm">
                  {storeOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF9F6]/70">
                      <td className="py-3.5 px-4">
                        <p className="font-mono tabular-nums font-semibold text-[#181A18]">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-[#5C615C]">{order.storeName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#181A18]">{order.customerName}</p>
                        <p className="text-xs text-[#5C615C]">{order.deliveryZone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#5C615C] max-w-xs">
                        {order.items.map((it) => `${it.name} ×${it.quantity}`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#181A18]">
                        {formatINR(order.total)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#181A18]">
                        {getStatusLabel(order.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {order.status === 'placed' && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'confirmed', 'vendor')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Accept Order
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'packed', 'vendor')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#181A18] hover:bg-black rounded-lg cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            Mark Packed
                          </button>
                        )}
                        {order.status !== 'placed' && order.status !== 'confirmed' && (
                          <span className="text-xs text-[#5C615C]">Handed off</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4DF] bg-[#FAF9F6] text-xs font-semibold text-[#5C615C]">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price / MRP</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA] text-sm">
                {storeProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAF9F6]/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-[#F3F2EE] border border-[#E5E4DF] shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-[#181A18]">{product.name}</p>
                          <p className="text-xs text-[#5C615C]">
                            {product.brand} · {product.unit}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#5C615C]">{product.category}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <span className="font-semibold text-[#181A18]">{formatINR(product.price)}</span>
                      <span className="text-xs text-[#5C615C] ml-1.5 line-through">
                        {formatINR(product.mrp)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-[#181A18]">
                      {product.stock}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleProductStock(product.id)}
                        className={`text-xs font-semibold underline underline-offset-4 cursor-pointer ${
                          product.inStock ? 'text-[#146C43]' : 'text-[#C2590A]'
                        }`}
                      >
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          aria-label={`Edit ${product.name}`}
                          className="p-2 text-[#5C615C] hover:text-[#181A18] rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          aria-label={`Delete ${product.name}`}
                          className="p-2 text-[#5C615C] hover:text-red-700 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vendor-product-form-title"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-xl shadow-xl my-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between">
              <h2 id="vendor-product-form-title" className="text-lg font-bold text-[#181A18]">
                {editingProduct ? 'Edit Grocery Item' : 'Add New Grocery Item'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close product form"
                className="p-2 text-[#5C615C] hover:text-[#181A18] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-name" className="block text-xs font-semibold text-[#181A18] mb-1">
                    Product Name
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Amul Butter Pasteurised"
                    className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                  />
                  {errors.name && <p className="text-xs text-red-700 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="prod-brand" className="block text-xs font-semibold text-[#181A18] mb-1">
                    Brand
                  </label>
                  <input
                    id="prod-brand"
                    type="text"
                    value={draft.brand}
                    onChange={(e) => setDraft({ ...draft, brand: e.target.value })}
                    placeholder="e.g. Amul"
                    className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                  />
                  {errors.brand && <p className="text-xs text-red-700 mt-1">{errors.brand}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prod-category" className="block text-xs font-semibold text-[#181A18] mb-1">
                    Category
                  </label>
                  <select
                    id="prod-category"
                    value={draft.category}
                    onChange={(e) => {
                      const nextCat = e.target.value as ProductCategory;
                      setDraft({
                        ...draft,
                        category: nextCat,
                        imageUrl: editingProduct ? draft.imageUrl : CATEGORY_DEFAULT_IMAGES[nextCat],
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg bg-white focus:outline-none focus:border-[#146C43]"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="prod-unit" className="block text-xs font-semibold text-[#181A18] mb-1">
                    Unit / Pack Size
                  </label>
                  <input
                    id="prod-unit"
                    type="text"
                    value={draft.unit}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    placeholder="e.g. 500 g, 1 L, 6 pcs"
                    className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                  />
                  {errors.unit && <p className="text-xs text-red-700 mt-1">{errors.unit}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="prod-price" className="block text-xs font-semibold text-[#181A18] mb-1">
                    Price (₹)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min="1"
                    value={draft.price || ''}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                  />
                  {errors.price && <p className="text-xs text-red-700 mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label htmlFor="prod-mrp" className="block text-xs font-semibold text-[#181A18] mb-1">
                    MRP (₹)
                  </label>
                  <input
                    id="prod-mrp"
                    type="number"
                    min="1"
                    value={draft.mrp || ''}
                    onChange={(e) => setDraft({ ...draft, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                  />
                  {errors.mrp && <p className="text-xs text-red-700 mt-1">{errors.mrp}</p>}
                </div>

                <div>
                  <label htmlFor="prod-stock" className="block text-xs font-semibold text-[#181A18] mb-1">
                    Stock Qty
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                  />
                  {errors.stock && <p className="text-xs text-red-700 mt-1">{errors.stock}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="prod-desc" className="block text-xs font-semibold text-[#181A18] mb-1">
                  Product Description
                </label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Short description for students and hostel buyers"
                  className="w-full px-3 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 bg-[#FAF9F6] border border-[#E5E4DF] rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={draft.imageUrl}
                    alt="Product preview"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-[#E5E4DF] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#181A18]">Product Photo</p>
                    <p className="text-[11px] text-[#5C615C] truncate">
                      Upload via Firebase Storage or keep category photo
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#181A18] bg-white border border-[#D4D3CC] hover:bg-[#F3F2EE] rounded-lg cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  {uploadingImage ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#5C615C] hover:text-[#181A18] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
