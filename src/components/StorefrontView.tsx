import { useMemo, useState } from 'react';
import { Search, Plus, Minus, ArrowRight, X, PackageCheck } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import { IMAGE_ASSETS } from '../data/seedData';
import type { Product, ProductCategory } from '../types';
import {
  filterAndSortProducts,
  formatINR,
  getDiscountPercent,
  PRODUCT_CATEGORIES,
  type ProductSort,
} from '../utils/commerce';

export function StorefrontView() {
  const { products, stores, cart, settings, addToCart, updateCartQuantity } = useQuickKart();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>('All');
  const [sort, setSort] = useState<ProductSort>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visibleProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        query,
        category: selectedCategory,
        sort,
      }),
    [products, query, selectedCategory, sort]
  );

  const getCartQty = (productId: string) =>
    cart.find((item) => item.product.id === productId)?.quantity || 0;

  return (
    <main className="pb-20 md:pb-12">
      {/* Section 1: Editorial Split Hero */}
      <section className="border-b border-[#E5E4DF] bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-[#146C43] tracking-wide mb-3">
                Dehradun, Uttarakhand · DBS Global University &amp; Nearby Hostels
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#181A18] leading-[1.12] tracking-tight mb-4">
                Your Daily Needs, Delivered Fast.
              </h1>
              <p className="text-base text-[#5C615C] leading-relaxed max-w-xl mb-7">
                Affordable groceries, hostel essentials, fresh produce, and snacks from trusted
                local Dehradun stores—delivered straight to your campus gate or doorstep in 20
                minutes.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <a
                  href="#catalogue"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors whitespace-nowrap"
                >
                  Browse Catalogue
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <span className="text-sm text-[#5C615C]">
                  Free delivery above{' '}
                  <strong className="font-mono tabular-nums text-[#181A18]">
                    {formatINR(settings.freeDeliveryThreshold)}
                  </strong>
                  {' · '}Standard fee{' '}
                  <strong className="font-mono tabular-nums text-[#181A18]">
                    {formatINR(settings.deliveryFee)}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-[#E5E4DF]">
                <div>
                  <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#181A18] whitespace-nowrap">
                    18–25 min
                  </p>
                  <p className="text-xs text-[#5C615C] mt-0.5">Hostel &amp; society ETA</p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#181A18] whitespace-nowrap">
                    {stores.filter((s) => s.isActive).length} Marts
                  </p>
                  <p className="text-xs text-[#5C615C] mt-0.5">Selaqui to Rajpur Rd</p>
                </div>
                <div>
                  <p className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#181A18] whitespace-nowrap">
                    UPI &amp; COD
                  </p>
                  <p className="text-xs text-[#5C615C] mt-0.5">OTP verified drop-off</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="w-full h-full min-h-[260px] lg:min-h-[380px] rounded-xl overflow-hidden bg-[#F3F2EE] border border-[#E5E4DF]">
                <img
                  src={IMAGE_ASSETS.hero}
                  alt="Fresh daily groceries in a woven market tote on a sunlit counter"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Search, Category Filters & Product Catalogue */}
      <section id="catalogue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#181A18] tracking-tight">Daily Essentials</h2>
            <p className="text-sm text-[#5C615C] mt-1">
              {visibleProducts.length} items ready from Dehradun partner stores
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search
                className="w-4 h-4 text-[#5C615C] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <label htmlFor="catalogue-search" className="sr-only">
                Search groceries
              </label>
              <input
                id="catalogue-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search milk, maggi, rice, bread..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>

            <label htmlFor="catalogue-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="catalogue-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSort)}
              className="px-3.5 py-2 text-sm bg-white border border-[#D4D3CC] rounded-lg text-[#181A18] focus:outline-none focus:border-[#146C43]"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Highest Savings</option>
            </select>
          </div>
        </div>

        {/* Interactive Category Segmented Filter Bar */}
        <div
          role="tablist"
          aria-label="Product categories"
          className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 border-b border-[#E5E4DF]"
        >
          {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#181A18] text-white'
                    : 'text-[#5C615C] hover:text-[#181A18] hover:bg-[#F3F2EE]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Uniform Product Grid */}
        {visibleProducts.length === 0 ? (
          <div className="bg-white border border-[#E5E4DF] rounded-xl p-12 text-center">
            <p className="text-base font-semibold text-[#181A18] mb-2">
              No matching groceries found
            </p>
            <p className="text-sm text-[#5C615C] mb-5">
              Try searching for another item or clear your category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product) => {
              const qty = getCartQty(product.id);
              const discount = getDiscountPercent(product.price, product.mrp);
              const imgBroken = failedImages[product.id];

              return (
                <article
                  key={product.id}
                  className="bg-white border border-[#E5E4DF] rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="block w-full aspect-[4/3] bg-[#F3F2EE] overflow-hidden text-left cursor-pointer"
                    aria-label={`View details for ${product.name}`}
                  >
                    {!imgBroken && product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#F3F2EE] to-[#E9E7E0]">
                        <PackageCheck className="w-8 h-8 text-[#5C615C] mb-2" aria-hidden="true" />
                        <span className="text-xs font-medium text-[#5C615C]">{product.category}</span>
                      </div>
                    )}
                  </button>

                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-[#5C615C] truncate mb-1">
                      <span>{product.brand}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{product.unit}</span>
                      {discount > 0 && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="text-[#146C43] font-medium">{discount}% off</span>
                        </>
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="text-left text-[15px] font-semibold text-[#181A18] leading-snug hover:text-[#146C43] transition-colors line-clamp-2 mb-1 cursor-pointer"
                    >
                      {product.name}
                    </button>

                    <p className="text-xs text-[#5C615C] truncate mb-4">
                      {product.storeName}
                      {!product.inStock || product.stock <= 0 ? (
                        <span className="text-[#C2590A] font-medium"> · Out of stock</span>
                      ) : product.stock <= 10 ? (
                        <span className="text-[#C2590A]"> · Only {product.stock} left</span>
                      ) : null}
                    </p>

                    <div className="mt-auto pt-3 border-t border-[#F0EFEA] flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono tabular-nums text-base font-bold text-[#181A18]">
                          {formatINR(product.price)}
                        </span>
                        {product.mrp > product.price && (
                          <span className="font-mono tabular-nums text-xs text-[#5C615C] line-through">
                            {formatINR(product.mrp)}
                          </span>
                        )}
                      </div>

                      {!product.inStock || product.stock <= 0 ? (
                        <span className="text-xs font-medium text-[#5C615C]">Unavailable</span>
                      ) : qty > 0 ? (
                        <div className="inline-flex items-center border border-[#146C43] rounded-lg overflow-hidden bg-[#146C43] text-white">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(product.id, qty - 1)}
                            aria-label={`Decrease quantity of ${product.name}`}
                            className="px-2.5 py-1.5 hover:bg-[#0F5333] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-mono tabular-nums font-semibold">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(product.id, qty + 1)}
                            aria-label={`Increase quantity of ${product.name}`}
                            className="px-2.5 py-1.5 hover:bg-[#0F5333] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product, 1)}
                          aria-label={`Add ${product.name} to cart`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-[#146C43] bg-[#146C43]/10 hover:bg-[#146C43] hover:text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Local Partner Stores in Dehradun */}
      <section className="border-t border-[#E5E4DF] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl font-bold text-[#181A18] tracking-tight">
              Dehradun Local Partner Stores
            </h2>
            <p className="text-sm text-[#5C615C] mt-1.5 leading-relaxed">
              QuickKart connects DBS Global University hostels, student flats, and residential
              societies directly with neighbourhood kirana stores and fresh produce marts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div
                key={store.id}
                className="p-6 bg-[#FAF9F6] border border-[#E5E4DF] rounded-xl flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs text-[#5C615C] mb-1.5">
                    <span>{store.zone}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono tabular-nums">{store.etaMinutes} min ETA</span>
                  </p>
                  <h3 className="text-base font-bold text-[#181A18] mb-2">{store.name}</h3>
                  <p className="text-sm text-[#5C615C] leading-relaxed">{store.address}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#E5E4DF] flex items-center justify-between text-xs text-[#5C615C]">
                  <span className="font-mono tabular-nums font-medium text-[#181A18]">
                    Rating {store.rating.toFixed(1)} / 5.0
                  </span>
                  <span className={store.isActive ? 'text-[#146C43] font-medium' : 'text-[#C2590A]'}>
                    {store.isActive ? 'Accepting orders' : 'Temporarily closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Footer */}
      <footer className="border-t border-[#E5E4DF] bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5C615C]">
          <div>
            <p className="font-semibold text-[#181A18] text-sm">QuickKart</p>
            <p className="mt-1">
              MBA Entrepreneurship &amp; Innovation Venture · DBS Global University, Dehradun
            </p>
          </div>
          <p className="font-mono tabular-nums">
            Support: {settings.supportPhone} · {settings.serviceCity}
          </p>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdp-title"
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5E4DF] rounded-xl max-w-2xl w-full overflow-hidden shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto bg-[#F3F2EE]">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-xs text-[#5C615C]">
                      {selectedProduct.category} · {selectedProduct.brand}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      aria-label="Close product details"
                      className="p-1 text-[#5C615C] hover:text-[#181A18] cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <h3 id="pdp-title" className="text-xl font-bold text-[#181A18] mb-1">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-[#5C615C] mb-4">
                    Pack size: {selectedProduct.unit} · Fulfilled by {selectedProduct.storeName}
                  </p>
                  <p className="text-sm text-[#5C615C] leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E4DF] space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-mono tabular-nums text-2xl font-bold text-[#181A18]">
                        {formatINR(selectedProduct.price)}
                      </span>
                      {selectedProduct.mrp > selectedProduct.price && (
                        <span className="font-mono tabular-nums text-sm text-[#5C615C] line-through">
                          {formatINR(selectedProduct.mrp)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#146C43]">
                      {selectedProduct.inStock && selectedProduct.stock > 0
                        ? `${selectedProduct.stock} in stock`
                        : 'Out of stock'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!selectedProduct.inStock || selectedProduct.stock <= 0}
                    onClick={() => {
                      addToCart(selectedProduct, 1);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add to Cart · {formatINR(selectedProduct.price)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
