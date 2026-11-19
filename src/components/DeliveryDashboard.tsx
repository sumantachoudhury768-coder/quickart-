import { useMemo, useState } from 'react';
import { MapPin, Phone, Truck, CheckCircle2, KeyRound } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import { formatINR } from '../utils/commerce';

const DEFAULT_RIDER = {
  id: 'delivery_demo_1',
  name: 'Rohan Negi',
};

export function DeliveryDashboard() {
  const { orders, firebaseUser, userProfile, updateOrderStatus } = useQuickKart();

  const [otpByOrder, setOtpByOrder] = useState<Record<string, string>>({});
  const [otpErrorByOrder, setOtpErrorByOrder] = useState<Record<string, string>>({});

  const riderId = firebaseUser?.uid || DEFAULT_RIDER.id;
  const riderName = userProfile?.displayName || DEFAULT_RIDER.name;

  const readyQueue = useMemo(
    () => orders.filter((o) => o.status === 'packed'),
    [orders]
  );

  const activeDeliveries = useMemo(
    () => orders.filter((o) => o.status === 'out_for_delivery'),
    [orders]
  );

  const completedDeliveries = useMemo(
    () => orders.filter((o) => o.status === 'delivered'),
    [orders]
  );

  const riderEarnings = completedDeliveries.length * 25;

  const handleClaim = async (orderId: string) => {
    await updateOrderStatus(orderId, 'out_for_delivery', 'delivery', {
      deliveryPartnerId: riderId,
      deliveryPartnerName: riderName,
    });
  };

  const handleComplete = async (orderId: string) => {
    const attempt = otpByOrder[orderId] || '';
    const res = await updateOrderStatus(orderId, 'delivered', 'delivery', {
      otpAttempt: attempt,
    });
    if (!res.ok && res.error) {
      setOtpErrorByOrder((prev) => ({ ...prev, [orderId]: res.error! }));
    } else {
      setOtpErrorByOrder((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E4DF]">
        <div>
          <p className="text-xs font-medium text-[#146C43] mb-1">Dehradun Campus &amp; City Dispatch</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#181A18] tracking-tight">
            Delivery Partner Dashboard
          </h1>
        </div>
        <p className="text-sm text-[#5C615C]">
          Active Rider: <strong className="text-[#181A18]">{riderName}</strong> · Selaqui &amp; Prem Nagar Zone
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-[#E5E4DF]">
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Ready for Pickup</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#C2590A] mt-1">
            {readyQueue.length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Out for Delivery</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#146C43] mt-1">
            {activeDeliveries.length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Completed Drops</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {completedDeliveries.length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E4DF] rounded-xl p-4">
          <p className="text-xs text-[#5C615C]">Estimated Shift Payout</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#181A18] mt-1">
            {formatINR(riderEarnings)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Column 1: Packed Orders Ready to Claim */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#181A18]">
              Packed &amp; Ready for Pickup ({readyQueue.length})
            </h2>
            <p className="text-xs text-[#5C615C] mt-0.5">
              Claim a sealed grocery bag from a local partner store to begin delivery.
            </p>
          </div>

          {readyQueue.length === 0 ? (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-8 text-center text-sm text-[#5C615C]">
              No packed orders waiting at partner stores right now.
            </div>
          ) : (
            readyQueue.map((order) => (
              <article
                key={order.id}
                className="bg-white border border-[#E5E4DF] rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono tabular-nums text-sm font-bold text-[#181A18]">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-[#5C615C]">
                      Pickup: <span className="font-medium text-[#181A18]">{order.storeName}</span>
                    </p>
                  </div>
                  <p className="font-mono tabular-nums text-sm font-bold text-[#181A18]">
                    {formatINR(order.total)} · {order.paymentMethod.toUpperCase()}
                  </p>
                </div>

                <div className="text-xs text-[#5C615C] space-y-1 pt-2 border-t border-[#F0EFEA]">
                  <p className="inline-flex items-center gap-1.5 text-[#181A18] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#146C43]" aria-hidden="true" />
                    {order.deliveryZone}
                  </p>
                  <p>{order.deliveryAddress}</p>
                  <p>{order.itemCount} grocery items sealed</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleClaim(order.id)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4" aria-hidden="true" />
                  Accept Pickup &amp; Start Delivery
                </button>
              </article>
            ))
          )}
        </section>

        {/* Column 2: Active Out-for-Delivery Drops */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#181A18]">
              Active Deliveries ({activeDeliveries.length})
            </h2>
            <p className="text-xs text-[#5C615C] mt-0.5">
              Verify the customer’s 4-digit OTP at the hostel gate or doorstep to complete drop-off.
            </p>
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="bg-white border border-[#E5E4DF] rounded-xl p-8 text-center text-sm text-[#5C615C]">
              No active deliveries on route. Claim a packed order from the left column.
            </div>
          ) : (
            activeDeliveries.map((order) => (
              <article
                key={order.id}
                className="bg-white border border-[#146C43]/40 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono tabular-nums text-sm font-bold text-[#181A18]">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm font-semibold text-[#181A18] mt-0.5">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono tabular-nums text-sm font-bold text-[#181A18]">
                      {formatINR(order.total)}
                    </p>
                    <p className="text-xs text-[#5C615C]">
                      {order.paymentMethod === 'cod' ? 'Collect Cash (COD)' : 'Prepaid via UPI'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#5C615C] space-y-1.5 bg-[#FAF9F6] p-3.5 rounded-lg border border-[#E5E4DF]">
                  <p className="inline-flex items-center gap-1.5 text-[#181A18] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#146C43]" aria-hidden="true" />
                    {order.deliveryZone}
                  </p>
                  <p>{order.deliveryAddress}</p>
                  <p className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[#181A18]">
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    +91 {order.customerPhone}
                  </p>
                  {order.notes && <p className="text-[#181A18]">Note: {order.notes}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor={`otp-${order.id}`}
                      className="font-semibold text-[#181A18] inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                      Customer Delivery OTP
                    </label>
                    <span className="text-[#5C615C] font-mono">
                      Demo OTP: {order.deliveryOtp}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id={`otp-${order.id}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpByOrder[order.id] || ''}
                      onChange={(e) =>
                        setOtpByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      placeholder="Enter 4-digit OTP"
                      className="flex-1 px-3 py-2 text-sm font-mono border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
                    />
                    <button
                      type="button"
                      onClick={() => handleComplete(order.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      Complete Drop
                    </button>
                  </div>
                  {otpErrorByOrder[order.id] && (
                    <p role="alert" className="text-xs text-red-700">
                      {otpErrorByOrder[order.id]}
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
