import { useMemo } from 'react';
import { Check, MapPin, Phone, Clock, Package, XCircle } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import { formatINR, getStatusLabel, ORDER_STEPS } from '../utils/commerce';

export function OrdersView() {
  const {
    orders,
    selectedOrderId,
    setSelectedOrderId,
    setActiveView,
    updateOrderStatus,
  } = useQuickKart();

  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return orders[0] || null;
  }, [orders, selectedOrderId]);

  const currentStepIdx = activeOrder
    ? ORDER_STEPS.findIndex((s) => s.status === activeOrder.status)
    : -1;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#181A18] tracking-tight">
            Orders &amp; Live Delivery Tracking
          </h1>
          <p className="text-sm text-[#5C615C] mt-1">
            Track real-time packing, Dehradun rider dispatch, and OTP doorstep handover.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('shop')}
          className="px-4 py-2 text-sm font-semibold text-[#146C43] border border-[#146C43] hover:bg-[#146C43] hover:text-white rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
        >
          Order More Groceries
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-[#5C615C] mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-[#181A18] mb-1">No orders placed yet</p>
          <p className="text-sm text-[#5C615C] mb-5">
            Once you check out, your live order status and delivery OTP will appear here.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('shop')}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg cursor-pointer"
          >
            Browse Storefront
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Order History List */}
          <aside className="lg:col-span-4 space-y-2.5" aria-label="Order history">
            <h2 className="text-xs font-semibold text-[#5C615C] tracking-wide mb-2">
              Recent Orders ({orders.length})
            </h2>
            {orders.map((order) => {
              const selected = activeOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-white border-[#146C43] ring-1 ring-[#146C43]'
                      : 'bg-white border-[#E5E4DF] hover:border-[#C5C4BE]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono tabular-nums text-sm font-bold text-[#181A18]">
                      {order.orderNumber}
                    </span>
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#181A18]">
                      {formatINR(order.total)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C615C] truncate">
                    {order.storeName} · {order.itemCount} items
                  </p>
                  <p
                    className={`text-xs font-medium mt-2 ${
                      order.status === 'cancelled'
                        ? 'text-red-700'
                        : order.status === 'delivered'
                        ? 'text-[#146C43]'
                        : 'text-[#C2590A]'
                    }`}
                  >
                    {getStatusLabel(order.status)}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Right: Active Order Live Tracker & Receipt */}
          {activeOrder && (
            <section className="lg:col-span-8 bg-white border border-[#E5E4DF] rounded-xl overflow-hidden">
              <div className="p-6 border-b border-[#E5E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#5C615C] mb-1">
                    Order{' '}
                    <span className="font-mono tabular-nums font-semibold text-[#181A18]">
                      {activeOrder.orderNumber}
                    </span>
                    {' · '}
                    <span>{new Date(activeOrder.createdAt).toLocaleString('en-IN')}</span>
                  </p>
                  <h2 className="text-xl font-bold text-[#181A18]">
                    {getStatusLabel(activeOrder.status)}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' && (
                    <div className="px-3.5 py-2 bg-[#FAF9F6] border border-[#E5E4DF] rounded-lg text-right">
                      <p className="text-[11px] text-[#5C615C]">Delivery OTP</p>
                      <p className="font-mono tabular-nums text-base font-bold text-[#181A18] tracking-widest">
                        {activeOrder.deliveryOtp}
                      </p>
                    </div>
                  )}
                  {activeOrder.status === 'placed' && (
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(activeOrder.id, 'cancelled', 'customer')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>

              {/* 5-Stage Progress Tracker */}
              <div className="p-6 border-b border-[#E5E4DF] bg-[#FAF9F6]">
                {activeOrder.status === 'cancelled' ? (
                  <p className="text-sm font-medium text-red-700">
                    This order was cancelled before packing. No charges apply.
                  </p>
                ) : (
                  <ol className="relative grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div
                      aria-hidden="true"
                      className="hidden sm:block absolute top-3.5 left-3.5 right-3.5 h-px bg-[#DFDDD6]"
                    />
                    {ORDER_STEPS.map((step, idx) => {
                      const completed = idx <= currentStepIdx;
                      const current = idx === currentStepIdx;
                      return (
                        <li
                          key={step.status}
                          className="relative z-10 flex sm:flex-col items-start gap-3 sm:gap-2"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                              completed
                                ? 'bg-[#146C43] text-white'
                                : 'bg-white border border-[#D4D3CC] text-[#5C615C]'
                            }`}
                          >
                            {completed ? <Check className="w-4 h-4" aria-hidden="true" /> : idx + 1}
                          </div>
                          <div>
                            <p
                              className={`text-xs font-semibold ${
                                current
                                  ? 'text-[#146C43]'
                                  : completed
                                  ? 'text-[#181A18]'
                                  : 'text-[#5C615C]'
                              }`}
                            >
                              {step.shortLabel}
                            </p>
                            <p className="text-[11px] text-[#5C615C] mt-0.5 leading-snug">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Delivery Details */}
              <div className="p-6 border-b border-[#E5E4DF] grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#5C615C] inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    Delivery Destination
                  </p>
                  <p className="font-semibold text-[#181A18]">{activeOrder.customerName}</p>
                  <p className="text-xs text-[#5C615C]">{activeOrder.deliveryAddress}</p>
                  <p className="text-xs text-[#5C615C]">{activeOrder.deliveryZone}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#5C615C] inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    Fulfillment Partner
                  </p>
                  <p className="font-semibold text-[#181A18]">{activeOrder.storeName}</p>
                  <p className="text-xs text-[#5C615C]">
                    Rider:{' '}
                    {activeOrder.deliveryPartnerName || 'Assigning nearest Dehradun rider'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#5C615C] inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    Contact &amp; Payment
                  </p>
                  <p className="font-mono tabular-nums font-semibold text-[#181A18]">
                    +91 {activeOrder.customerPhone}
                  </p>
                  <p className="text-xs text-[#5C615C]">
                    {activeOrder.paymentMethod === 'upi' ? 'UPI Instant Pay' : 'Cash on Delivery'}
                    {' · '}
                    <span className="capitalize font-medium text-[#181A18]">
                      {activeOrder.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Itemized Receipt */}
              <div className="p-6">
                <h3 className="text-xs font-semibold text-[#5C615C] mb-3">Itemized Receipt</h3>
                <div className="divide-y divide-[#F0EFEA] border-t border-b border-[#F0EFEA]">
                  {activeOrder.items.map((item) => (
                    <div
                      key={`${activeOrder.id}_${item.productId}`}
                      className="py-2.5 flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium text-[#181A18]">{item.name}</span>
                        <span className="text-xs text-[#5C615C] ml-2">
                          {item.unit} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-medium text-[#181A18]">
                        {formatINR(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 text-sm max-w-xs ml-auto">
                  <div className="flex justify-between text-[#5C615C]">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums text-[#181A18]">
                      {formatINR(activeOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#5C615C]">
                    <span>Delivery Fee</span>
                    <span className="font-mono tabular-nums text-[#181A18]">
                      {activeOrder.deliveryFee === 0 ? 'Free' : formatINR(activeOrder.deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[#181A18] pt-2 border-t border-[#E5E4DF]">
                    <span>Total Paid / Payable</span>
                    <span className="font-mono tabular-nums">{formatINR(activeOrder.total)}</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
