import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import NotificationToast from './components/common/NotificationToast';
import AuthModal from './components/auth/AuthModal';

// Public Dining Website (Lazy Loaded)
const RestaurantWebsite = lazy(() => import('./pages/public/RestaurantWebsite'));

// SaaS / Operations Platform (Lazy Loaded)
import SaasLayout from './pages/saas/SaasLayout';
const ManagerDashboard = lazy(() => import('./pages/saas/ManagerDashboard'));
const MenuManagement = lazy(() => import('./pages/saas/MenuManagement'));
const TableManagement = lazy(() => import('./pages/saas/TableManagement'));
const KitchenKDS = lazy(() => import('./pages/saas/KitchenKDS'));
const WaiterPOS = lazy(() => import('./pages/saas/WaiterPOS'));
const CashierDesk = lazy(() => import('./pages/saas/CashierDesk'));
const AdminSettings = lazy(() => import('./pages/saas/AdminSettings'));
const StaffManagement = lazy(() => import('./pages/saas/StaffManagement'));
const FeedbackMonitor = lazy(() => import('./pages/saas/FeedbackMonitor'));

function LoadingFallback() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 text-sm font-medium">Loading Restoza Module...</p>
    </div>
  );
}

function MainContent() {
  const { user, activePortal, setActivePortal, isStaff } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // When user logs in, ensure their default tab matches their role
  React.useEffect(() => {
    if (user?.role === 'KITCHEN') setActiveTab('kitchen');
    else if (user?.role === 'WAITER') setActiveTab('waiter');
    else if (user?.role === 'CASHIER') setActiveTab('cashier');
    else setActiveTab('dashboard');
  }, [user?.role]);

  const renderSaasTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ManagerDashboard onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'menu':
        return <MenuManagement />;
      case 'tables':
        return <TableManagement />;
      case 'waiter':
        return <WaiterPOS />;
      case 'kitchen':
        return <KitchenKDS />;
      case 'cashier':
        return <CashierDesk />;
      case 'settings':
        return <AdminSettings />;
      case 'staff':
        return <StaffManagement />;
      case 'feedback':
        return <FeedbackMonitor />;
      default:
        return <ManagerDashboard onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <>
      <NotificationToast />

      <Suspense fallback={<LoadingFallback />}>
        {activePortal === 'website' ? (
          <RestaurantWebsite
            onOpenAuth={() => setIsAuthOpen(true)}
            onEnterSaas={() => setActivePortal('saas')}
            isStaff={isStaff}
            userRole={user?.role}
          />
        ) : (
          <SaasLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onBackToWebsite={() => setActivePortal('website')}
          >
            {renderSaasTab()}
          </SaasLayout>
        )}
      </Suspense>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainContent />
      </SocketProvider>
    </AuthProvider>
  );
}

