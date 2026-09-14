import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import RestozaLogo from '../../components/common/RestozaLogo';
import {
  LayoutDashboard, Utensils, Grid3X3, ChefHat, UserCheck, DollarSign,
  Settings, Users, MessageSquare, LogOut, Globe, Bell, ChevronDown,
  Menu, X, Sparkles, Crown, Shield
} from 'lucide-react';

export default function SaasLayout({
  activeTab,
  setActiveTab,
  onBackToWebsite,
  children,
}) {
  const { user, logout, demoLogin, isSuperAdmin, isManager, isWaiter, isKitchen, isCashier } = useAuth();
  const { connected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Navigation Items according to role
  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: Utensils,
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'tables',
      label: 'Floor & Tables',
      icon: Grid3X3,
      roles: ['SUPER_ADMIN', 'MANAGER', 'WAITER'],
    },
    {
      id: 'waiter',
      label: 'Waiter POS & Floor',
      icon: UserCheck,
      roles: ['SUPER_ADMIN', 'MANAGER', 'WAITER'],
    },
    {
      id: 'kitchen',
      label: 'Kitchen Display (KDS)',
      icon: ChefHat,
      roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'],
    },
    {
      id: 'cashier',
      label: 'Cashier & Billing',
      icon: DollarSign,
      roles: ['SUPER_ADMIN', 'MANAGER', 'CASHIER'],
    },
    {
      id: 'feedback',
      label: 'Guest Reviews',
      icon: MessageSquare,
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: Users,
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      id: 'settings',
      label: 'Taxes & Settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const handleSwitchRole = async (newRole) => {
    await demoLogin(newRole);
    setRoleSwitcherOpen(false);
    // Set appropriate default tab for the new role
    if (newRole === 'KITCHEN') setActiveTab('kitchen');
    else if (newRole === 'WAITER') setActiveTab('waiter');
    else if (newRole === 'CASHIER') setActiveTab('cashier');
    else setActiveTab('dashboard');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-purple-900/60 text-purple-300 border-purple-500/40' };
      case 'MANAGER':
        return { label: 'Restaurant Manager', bg: 'bg-amber-900/60 text-amber-300 border-amber-500/40' };
      case 'WAITER':
        return { label: 'Floor Waiter', bg: 'bg-blue-900/60 text-blue-300 border-blue-500/40' };
      case 'KITCHEN':
        return { label: 'Executive Chef', bg: 'bg-rose-900/60 text-rose-300 border-rose-500/40' };
      case 'CASHIER':
        return { label: 'Head Cashier', bg: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40' };
      default:
        return { label: role, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#111117] border-b border-white/10 z-40 sticky top-0">
        <RestozaLogo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d12] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Branding */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <RestozaLogo size="md" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card with Role Switcher */}
          <div className="p-4 border-b border-white/5">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff User'}</p>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Quick Switch Role Dropdown */}
              <div className="relative mt-2.5">
                <button
                  onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Switch Role Demo</span>
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {roleSwitcherOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#14141c] border border-amber-500/40 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in">
                    <button
                      onClick={() => handleSwitchRole('SUPER_ADMIN')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-purple-950/80 text-purple-200 flex items-center gap-2"
                    >
                      <Crown className="w-3.5 h-3.5 text-purple-400" />
                      <span>Super Admin</span>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('MANAGER')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-amber-950/80 text-amber-200 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Manager</span>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('WAITER')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-blue-950/80 text-blue-200 flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Waiter (POS)</span>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('KITCHEN')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-rose-950/80 text-rose-200 flex items-center gap-2"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kitchen Chef (KDS)</span>
                    </button>
                    <button
                      onClick={() => handleSwitchRole('CASHIER')}
                      className="w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-emerald-950/80 text-emerald-200 flex items-center gap-2"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cashier (Billing)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-restoza-burgundy-800 to-restoza-burgundy-900 text-white shadow-glow-burgundy border border-restoza-burgundy-600'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Back to Website Button */}
          <button
            onClick={onBackToWebsite}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Public Dining Website</span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operations Header Bar */}
        <header className="h-16 px-6 bg-[#0f0f15] border-b border-white/10 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white capitalize">
              {filteredNav.find((n) => n.id === activeTab)?.label || 'Operations Center'}
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px]">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-slate-400">{connected ? 'Live Sync Active' : 'Offline'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToWebsite}
              className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>View Customer Website</span>
            </button>
          </div>
        </header>

        {/* Dynamic Role Page Render */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
