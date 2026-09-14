import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import NotificationToast from './components/common/NotificationToast';
import AuthModal from './components/auth/AuthModal';

// Public Dining Website
import RestaurantWebsite from './pages/public/RestaurantWebsite';

// SaaS / Operations Platform
import SaasLayout from './pages/saas/SaasLayout';
import ManagerDashboard from './pages/saas/ManagerDashboard';
import MenuManagement from './pages/saas/MenuManagement';
import TableManagement from './pages/saas/TableManagement';
import KitchenKDS from './pages/saas/KitchenKDS';
import WaiterPOS from './pages/saas/WaiterPOS';
import CashierDesk from './pages/saas/CashierDesk';
import AdminSettings from './pages/saas/AdminSettings';
import StaffManagement from './pages/saas/StaffManagement';
import FeedbackMonitor from './pages/saas/FeedbackMonitor';

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
