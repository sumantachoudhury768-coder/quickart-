import { QuickKartProvider, useQuickKart } from './context/QuickKartContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { StorefrontView } from './components/StorefrontView';
import { OrdersView } from './components/OrdersView';
import { VendorDashboard } from './components/VendorDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';

function QuickKartShell() {
  const { activeView, toastMessage } = useQuickKart();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#181A18]">
      <Header />

      {activeView === 'shop' && <StorefrontView />}
      {activeView === 'orders' && <OrdersView />}
      {activeView === 'vendor' && <VendorDashboard />}
      {activeView === 'delivery' && <DeliveryDashboard />}
      {activeView === 'admin' && <AdminDashboard />}

      <CartDrawer />
      <CheckoutModal />
      <AuthModal />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 text-sm font-medium text-white bg-[#181A18] rounded-lg shadow-lg border border-white/10"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QuickKartProvider>
        <QuickKartShell />
      </QuickKartProvider>
    </ErrorBoundary>
  );
}
