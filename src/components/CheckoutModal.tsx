import React, { useEffect, useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useQuickKart } from '../context/QuickKartContext';
import {
  DEHRADUN_ZONES,
  formatINR,
  validateCheckoutForm,
  type CheckoutFormValues,
} from '../utils/commerce';

export function CheckoutModal() {
  const {
    isCheckoutOpen,
    setCheckoutOpen,
    cart,
    cartTotals,
    userProfile,
    firebaseUser,
    placeOrder,
  } = useQuickKart();

  const [form, setForm] = useState<CheckoutFormValues>({
    customerName: '',
    customerPhone: '',
    deliveryZone: DEHRADUN_ZONES[0],
    deliveryAddress: '',
    paymentMethod: 'cod',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isCheckoutOpen) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || userProfile?.displayName || firebaseUser?.displayName || '',
        customerPhone: prev.customerPhone || userProfile?.phone || '',
        deliveryZone: userProfile?.deliveryZone || prev.deliveryZone || DEHRADUN_ZONES[0],
        deliveryAddress: prev.deliveryAddress || userProfile?.defaultAddress || '',
      }));
      setErrors({});
    }
  }, [isCheckoutOpen, userProfile, firebaseUser]);

  if (!isCheckoutOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateCheckoutForm(form);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await placeOrder(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-[#E5E4DF] rounded-xl w-full max-w-2xl overflow-hidden shadow-xl my-6">
        <div className="px-6 py-4 border-b border-[#E5E4DF] flex items-center justify-between">
          <div>
            <h2 id="checkout-modal-title" className="text-lg font-bold text-[#181A18]">
              Checkout · Dehradun Doorstep Delivery
            </h2>
            <p className="text-xs text-[#5C615C]">
              {cartTotals.itemCount} items · Total {formatINR(cartTotals.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutOpen(false)}
            aria-label="Close checkout"
            className="p-2 text-[#5C615C] hover:text-[#181A18] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkout-name" className="block text-xs font-semibold text-[#181A18] mb-1">
                Recipient Full Name
              </label>
              <input
                id="checkout-name"
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="e.g. Sumanta Choudhury"
                className="w-full px-3.5 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
              {errors.customerName && (
                <p role="alert" className="text-xs text-red-700 mt-1">
                  {errors.customerName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="checkout-phone" className="block text-xs font-semibold text-[#181A18] mb-1">
                Mobile Number (for OTP &amp; Rider Call)
              </label>
              <input
                id="checkout-phone"
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43] font-mono"
              />
              {errors.customerPhone && (
                <p role="alert" className="text-xs text-red-700 mt-1">
                  {errors.customerPhone}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="checkout-zone" className="block text-xs font-semibold text-[#181A18] mb-1">
              Dehradun Delivery Zone / Campus
            </label>
            <select
              id="checkout-zone"
              value={form.deliveryZone}
              onChange={(e) => setForm({ ...form, deliveryZone: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-[#D4D3CC] rounded-lg bg-white focus:outline-none focus:border-[#146C43]"
            >
              {DEHRADUN_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {errors.deliveryZone && (
              <p role="alert" className="text-xs text-red-700 mt-1">
                {errors.deliveryZone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="checkout-address" className="block text-xs font-semibold text-[#181A18] mb-1">
              Hostel Block, Room No. or Street Address
            </label>
            <input
              id="checkout-address"
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              placeholder="e.g. MBA Hostel Block B, Room 214, Selaqui"
              className="w-full px-3.5 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
            />
            {errors.deliveryAddress && (
              <p role="alert" className="text-xs text-red-700 mt-1">
                {errors.deliveryAddress}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset>
              <legend className="text-xs font-semibold text-[#181A18] mb-2">Payment Method</legend>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold border rounded-lg cursor-pointer ${
                    form.paymentMethod === 'cod'
                      ? 'border-[#146C43] bg-[#146C43]/10 text-[#146C43]'
                      : 'border-[#D4D3CC] text-[#5C615C]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={form.paymentMethod === 'cod'}
                    onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                    className="sr-only"
                  />
                  Cash on Delivery
                </label>
                <label
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold border rounded-lg cursor-pointer ${
                    form.paymentMethod === 'upi'
                      ? 'border-[#146C43] bg-[#146C43]/10 text-[#146C43]'
                      : 'border-[#D4D3CC] text-[#5C615C]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={form.paymentMethod === 'upi'}
                    onChange={() => setForm({ ...form, paymentMethod: 'upi' })}
                    className="sr-only"
                  />
                  UPI Instant Pay
                </label>
              </div>
            </fieldset>

            <div>
              <label htmlFor="checkout-notes" className="block text-xs font-semibold text-[#181A18] mb-1">
                Delivery Instructions (optional)
              </label>
              <input
                id="checkout-notes"
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Call at Hostel Gate 2"
                className="w-full px-3.5 py-2 text-sm border border-[#D4D3CC] rounded-lg focus:outline-none focus:border-[#146C43]"
              />
            </div>
          </div>

          {/* Summary Strip */}
          <div className="p-4 bg-[#FAF9F6] border border-[#E5E4DF] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#5C615C] space-y-0.5">
              <p>
                {cart.length} line items · Subtotal{' '}
                <span className="font-mono tabular-nums text-[#181A18]">
                  {formatINR(cartTotals.subtotal)}
                </span>{' '}
                + Delivery{' '}
                <span className="font-mono tabular-nums text-[#181A18]">
                  {cartTotals.deliveryFee === 0 ? 'Free' : formatINR(cartTotals.deliveryFee)}
                </span>
              </p>
              <p className="inline-flex items-center gap-1.5 text-[#146C43] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                4-digit OTP verification included on doorstep handover
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#5C615C]">Payable Amount</p>
              <p className="font-mono tabular-nums text-xl font-bold text-[#181A18]">
                {formatINR(cartTotals.total)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCheckoutOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-[#5C615C] hover:text-[#181A18] cursor-pointer"
            >
              Back to Cart
            </button>
            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#146C43] hover:bg-[#0F5333] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Placing Order...' : `Confirm Order · ${formatINR(cartTotals.total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
