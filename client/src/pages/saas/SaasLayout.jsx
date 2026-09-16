import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { authAPI } from '../../services/api';
import RestozaLogo from '../../components/common/RestozaLogo';
import {
  LayoutDashboard, Utensils, Grid3X3, ChefHat, UserCheck, DollarSign,
  Settings, Users, MessageSquare, LogOut, Globe, Bell, ChevronDown,
  Menu, X, Sparkles, Crown, Shield, User, Lock, CheckCircle, AlertCircle
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

  // Profile & Password Change States
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdForm.currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (!pwdForm.newPassword) {
      setPwdError('Please enter a new password.');
      return;
    }
    if (pwdForm.newPassword.length < 4) {
      setPwdError('New password must be at least 4 characters.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdSuccess('Password updated successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setChangePasswordModalOpen(false);
        setPwdSuccess('');
      }, 1500);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  // Navigation Items according to role
  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      roles: ['MANAGER'],
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: Utensils,
      roles: ['MANAGER'],
    },
    {
      id: 'tables',
      label: 'Floor & Tables',
      icon: Grid3X3,
      roles: ['MANAGER', 'WAITER'],
    },
    {
      id: 'waiter',
      label: 'Waiter & Floor',
      icon: UserCheck,
      roles: ['MANAGER', 'WAITER'],
    },
    {
      id: 'kitchen',
      label: 'Kitchen Display',
      icon: ChefHat,
      roles: ['MANAGER', 'KITCHEN'],
    },
    {
      id: 'cashier',
      label: 'Cashier & Billing',
      icon: DollarSign,
      roles: ['MANAGER', 'CASHIER'],
    },
    {
      id: 'feedback',
      label: 'Guest Reviews',
      icon: MessageSquare,
      roles: ['MANAGER'],
    },
    {
      id: 'staff',
      label: 'Staff Management',
      icon: Users,
      roles: ['MANAGER'],
    },
    {
      id: 'settings',
      label: 'Taxes & Settings',
      icon: Settings,
      roles: ['MANAGER'],
    },
  ];

  const filteredNav = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'MANAGER':
        return { label: 'Restaurant Manager', bg: 'bg-amber-900/60 text-amber-300 border-amber-500/40' };
      case 'WAITER':
        return { label: 'Floor Waiter', bg: 'bg-blue-900/60 text-blue-300 border-blue-500/40' };
      case 'KITCHEN':
        return { label: 'Executive Chef', bg: 'bg-rose-900/60 text-rose-300 border-rose-500/40' };
      case 'CASHIER':
        return { label: 'Head Cashier', bg: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40' };
      default:
        return { label: role || 'Staff', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d0d12] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo Branding */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <RestozaLogo size="md" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card*/}
          <div className="p-4 border-b border-white/5 shrink-0">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff User'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
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
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          {/* Back to Website Button */}
          <button
            onClick={onBackToWebsite}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-white/10"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Public Dining Website</span>
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

            {/* Profile Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-xs font-semibold focus:outline-none"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-restoza-burgundy-700 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold leading-none text-white">{user?.name || 'Staff Member'}</p>
                  <span className="text-[10px] text-amber-400 font-normal">{badge.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Menu Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#14141c] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  {/* User Info Card */}
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email || 'user@restoza.com'}</p>
                    <div className="mt-1.5">
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Change Password Option */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setPwdError('');
                      setPwdSuccess('');
                      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setChangePasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Change Password</span>
                  </button>

                  {/* Sign Out Option */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Role Page Render */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#12121a] border border-white/15 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setChangePasswordModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change Password</h3>
                <p className="text-xs text-slate-400">Update security details for your account</p>
              </div>
            </div>

            {pwdError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min. 4 chars)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/60"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-restoza-burgundy-700 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                >
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
