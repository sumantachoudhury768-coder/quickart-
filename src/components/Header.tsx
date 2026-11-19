import { ShoppingBag, Store, Truck, ShieldCheck, Package, User } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import type { AppView } from '../types';
import { formatINR } from '../utils/commerce';

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'shop', label: 'Shop' },
  { id: 'orders', label: 'Orders' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'admin', label: 'Admin' },
];

export function Header() {
  const {
    activeView,
    setActiveView,
    cartTotals,
    setCartOpen,
    firebaseUser,
    userProfile,
    setAuthModalOpen,
  } = useQuickKart();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E5E4DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('shop')}
            className="text-xl font-extrabold tracking-tight text-[#181A18] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#146C43]"
          >
            QuickKart
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#181A18] border-[#146C43] font-semibold'
                      : 'text-[#5C615C] border-transparent hover:text-[#181A18] hover:border-[#D0CFC9]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="py-1 whitespace-nowrap shrink-0 border-b-2 border-transparent text-[#5C615C] hover:text-[#181A18] transition-colors cursor-pointer"
            >
              {firebaseUser ? (userProfile?.displayName?.split(' ')[0] || 'Account') : 'Sign In'}
            </button>
          </nav>

          {/* Zone 3: 1 primary CTA button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping cart with ${cartTotals.itemCount} items`}
              className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cart</span>
              <span className="font-mono tabular-nums text-xs opacity-90">
                {cartTotals.itemCount > 0
                  ? `${cartTotals.itemCount} · ${formatINR(cartTotals.total)}`
                  : '0'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab navigation (compact 56px <= 7% of 844px mobile viewport) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E4DF] h-14 px-2 grid grid-cols-6 items-center"
      >
        <button
          type="button"
          onClick={() => setActiveView('shop')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium h-full ${
            activeView === 'shop' ? 'text-[#146C43]' : 'text-[#5C615C]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          <span>Shop</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('orders')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium h-full ${
            activeView === 'orders' ? 'text-[#146C43]' : 'text-[#5C615C]'
          }`}
        >
          <Package className="w-4 h-4" aria-hidden="true" />
          <span>Orders</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('vendor')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium h-full ${
            activeView === 'vendor' ? 'text-[#146C43]' : 'text-[#5C615C]'
          }`}
        >
          <Store className="w-4 h-4" aria-hidden="true" />
          <span>Vendor</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('delivery')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium h-full ${
            activeView === 'delivery' ? 'text-[#146C43]' : 'text-[#5C615C]'
          }`}
        >
          <Truck className="w-4 h-4" aria-hidden="true" />
          <span>Rider</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('admin')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium h-full ${
            activeView === 'admin' ? 'text-[#146C43]' : 'text-[#5C615C]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Admin</span>
        </button>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium h-full text-[#5C615C]"
        >
          <User className="w-4 h-4" aria-hidden="true" />
          <span>{firebaseUser ? 'Me' : 'Sign In'}</span>
        </button>
      </nav>
    </>
  );
}
