import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import { formatINR } from '../utils/commerce';

export function CartDrawer() {
  const {
    isCartOpen,
    setCartOpen,
    setCheckoutOpen,
    cart,
    cartTotals,
    settings,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useQuickKart();

  if (!isCartOpen) return null;

  const progressPercent = Math.min(
    100,
    settings.freeDeliveryThreshold > 0
      ? Math.round((cartTotals.subtotal / settings.freeDeliveryThreshold) * 100)
      : 100
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/45"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col border-l border-[#E5E4DF] shadow-xl">
        <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between">
          <div>
            <h2 id="cart-drawer-title" className="text-lg font-bold text-[#181A18]">
              Your Shopping Cart
            </h2>
            <p className="text-xs text-[#5C615C] font-mono tabular-nums">
              {cartTotals.itemCount} {cartTotals.itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-medium text-[#5C615C] hover:text-red-700 px-2 py-1 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close shopping cart"
              className="p-2 text-[#5C615C] hover:text-[#181A18] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="w-10 h-10 text-[#5C615C] mb-3" aria-hidden="true" />
            <p className="text-base font-semibold text-[#181A18] mb-1">Your cart is empty</p>
            <p className="text-sm text-[#5C615C] mb-6 max-w-xs">
              Add groceries, snacks, or hostel essentials to get 20-minute delivery across Dehradun.
            </p>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free delivery threshold indicator */}
            <div className="px-6 py-3 bg-[#FAF9F6] border-b border-[#E5E4DF]">
              <p className="text-xs text-[#181A18] mb-1.5">
                {cartTotals.qualifiesForFreeDelivery ? (
                  <span className="font-semibold text-[#146C43]">
                    Unlocked free doorstep delivery on this order.
                  </span>
                ) : (
                  <>
                    Add{' '}
                    <span className="font-mono tabular-nums font-semibold">
                      {formatINR(cartTotals.amountForFreeDelivery)}
                    </span>{' '}
                    more for free delivery
                  </>
                )}
              </p>
              <div className="h-1.5 w-full bg-[#E5E4DF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#146C43] transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Itemized list */}
            <ul className="flex-1 overflow-y-auto divide-y divide-[#F0EFEA] px-6">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="py-4 flex items-center gap-3.5">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover bg-[#F3F2EE] border border-[#E5E4DF] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#181A18] truncate">{product.name}</p>
                    <p className="text-xs text-[#5C615C]">
                      {product.unit} ·{' '}
                      <span className="font-mono tabular-nums">{formatINR(product.price)}</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#D4D3CC] rounded-md">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, quantity - 1)}
                          aria-label={`Remove one ${product.name}`}
                          className="p-1 text-[#181A18] hover:bg-[#F3F2EE] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono tabular-nums font-semibold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, quantity + 1)}
                          aria-label={`Add one more ${product.name}`}
                          className="p-1 text-[#181A18] hover:bg-[#F3F2EE] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-sm font-semibold text-[#181A18]">
                          {formatINR(product.price * quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          aria-label={`Remove ${product.name} from cart`}
                          className="p-1 text-[#5C615C] hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Bill Breakdown & Checkout CTA */}
            <div className="p-6 border-t border-[#E5E4DF] bg-[#FAF9F6] space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-[#5C615C]">
                  <span>Items subtotal</span>
                  <span className="font-mono tabular-nums text-[#181A18]">
                    {formatINR(cartTotals.subtotal)}
                  </span>
                </div>
                {cartTotals.savings > 0 && (
                  <div className="flex justify-between text-[#146C43]">
                    <span>MRP savings</span>
                    <span className="font-mono tabular-nums">-{formatINR(cartTotals.savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5C615C]">
                  <span>Delivery charge</span>
                  <span className="font-mono tabular-nums text-[#181A18]">
                    {cartTotals.deliveryFee === 0 ? 'Free' : formatINR(cartTotals.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#181A18] pt-2 border-t border-[#E5E4DF]">
                  <span>Grand Total</span>
                  <span className="font-mono tabular-nums">{formatINR(cartTotals.total)}</span>
                </div>
              </div>

              {!cartTotals.meetsMinOrder && (
                <p className="text-xs text-[#C2590A]">
                  Minimum order value is {formatINR(settings.minOrderAmount)}.
                </p>
              )}

              <button
                type="button"
                disabled={!cartTotals.meetsMinOrder}
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
