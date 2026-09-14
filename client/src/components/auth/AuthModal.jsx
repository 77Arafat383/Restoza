import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RestozaLogo from '../common/RestozaLogo';
import { Lock, Mail, User, Phone, Shield, ArrowRight, X, Sparkles, ChefHat, UserCheck, DollarSign, Crown } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('WAITER');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, phone, role });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(targetRole);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-restoza-dark-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-restoza-burgundy-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <RestozaLogo size="lg" subtitle={false} />
          <h2 className="text-xl font-bold text-white mt-3 flex items-center gap-2">
            Staff Portal & SaaS Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your role-based restaurant operations dashboard
          </p>
        </div>

        {/* Quick Demo Switcher Card */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            Quick Demo Login (1-Click Instant Access):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('SUPER_ADMIN')}
              className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 hover:bg-purple-900/60 hover:border-purple-400 transition-all text-left"
            >
              <Crown className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span>Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('MANAGER')}
              className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 hover:bg-amber-900/60 hover:border-amber-400 transition-all text-left"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Manager</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('WAITER')}
              className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-200 hover:bg-blue-900/60 hover:border-blue-400 transition-all text-left"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Waiter (POS)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('KITCHEN')}
              className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 hover:bg-rose-900/60 hover:border-rose-400 transition-all text-left"
            >
              <ChefHat className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <span>Kitchen (KDS)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('CASHIER')}
              className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-400 transition-all text-left col-span-2 sm:col-span-1"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Cashier Desk</span>
            </button>
          </div>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex border-b border-white/10 mb-5">
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              !isRegister
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff Login
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              isRegister
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register New Staff
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="WAITER" className="bg-slate-900 text-white">Waiter / Floor Staff</option>
                  <option value="KITCHEN" className="bg-slate-900 text-white">Kitchen Chef</option>
                  <option value="CASHIER" className="bg-slate-900 text-white">Cashier</option>
                  <option value="MANAGER" className="bg-slate-900 text-white">Restaurant Manager</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restoza.com"
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-restoza-burgundy-700 to-restoza-burgundy-900 hover:from-restoza-burgundy-600 hover:to-restoza-burgundy-800 text-white font-semibold rounded-xl text-sm shadow-glow-burgundy flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? 'Complete Staff Registration' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Guests & diners can order directly without login on the main website.
        </p>
      </div>
    </div>
  );
}
