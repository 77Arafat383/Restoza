import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import RestozaLogo from '../common/RestozaLogo';
import {
  Lock, Mail, User, Phone, Shield, ArrowRight, X, Sparkles, ChefHat,
  UserCheck, DollarSign, Crown, KeyRound, CheckCircle2, ArrowLeft
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('WAITER');

  // Forgot / Reset Password State
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCodeDemo, setGeneratedCodeDemo] = useState('');

  if (!isOpen) return null;

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await authAPI.register({ name, email, password, phone, role });
        if (res.data?.pending) {
          setSuccessMsg(res.data.message || 'Registration submitted! Please wait until a Manager or Super Admin approves your request.');
          setMode('login');
          setPassword('');
        } else {
          onClose();
        }
      } else if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'forgot') {
        const res = await authAPI.forgotPassword(email);
        setSuccessMsg(res.data.message || '6-digit verification code sent to your email.');
        if (res.data.resetCode) {
          setGeneratedCodeDemo(res.data.resetCode);
          setResetCode(res.data.resetCode);
        }
        setMode('reset');
      } else if (mode === 'reset') {
        const res = await authAPI.resetPassword({ email, code: resetCode, newPassword });
        setSuccessMsg(res.data.message || 'Password reset successful! You can now log in.');
        setMode('login');
        setPassword('');
        setResetCode('');
        setNewPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication action failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole) => {
    setError('');
    setSuccessMsg('');
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
        </div>

        {/* Quick Demo Switcher Card (Shown on Login / Register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              Quick Demo Login (1-Click Instant Access):
            </div>
            <div className="grid grid-cols-2 gap-2">

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
                <span>Waiter</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('KITCHEN')}
                className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-200 hover:bg-rose-900/60 hover:border-rose-400 transition-all text-left"
              >
                <ChefHat className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>Chef</span>
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
        )}

        {/* Mode Navigation Tabs */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-white/10 mb-5">
            <button
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                mode === 'login'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => handleModeSwitch('register')}
              className={`flex-1 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                mode === 'register'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Header for Forgot / Reset Password Modes */}
        {(mode === 'forgot' || mode === 'reset') && (
          <div className="mb-5 flex items-center justify-between pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
            <span className="text-xs font-semibold text-amber-400">
              {mode === 'forgot' ? 'Step 1: Request Code' : 'Step 2: Reset Password'}
            </span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* REGISTER MODE EXTRA FIELDS */}
          {mode === 'register' && (
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
                    placeholder="e.g. Monkey D Luffy"
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
                  <option value="WAITER" className="bg-slate-900 text-white">Waiter</option>
                  <option value="KITCHEN" className="bg-slate-900 text-white">Chef</option>
                  <option value="CASHIER" className="bg-slate-900 text-white">Cashier</option>
                  <option value="MANAGER" className="bg-slate-900 text-white">Manager</option>
                </select>
              </div>
            </>
          )}

          {/* EMAIL FIELD (LOGIN, REGISTER, FORGOT) */}
          {mode !== 'reset' && (
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
          )}

          {/* PASSWORD FIELD (LOGIN & REGISTER) */}
          {(mode === 'login' || mode === 'register') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
          )}

          {/* RESET PASSWORD MODE (CODE & NEW PASSWORD) */}
          {mode === 'reset' && (
            <>
              {generatedCodeDemo && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-between">
                  <span>Demo 6-digit code for <strong>{email}</strong>:</span>
                  <span className="font-mono font-bold text-amber-400 tracking-widest text-sm bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
                    {generatedCodeDemo}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/15 rounded-xl text-base font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Check your inbox for the 6-digit verification code.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/15 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-restoza-burgundy-700 to-restoza-burgundy-900 hover:from-restoza-burgundy-600 hover:to-restoza-burgundy-800 text-white font-semibold rounded-xl text-sm shadow-glow-burgundy flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In to Workspace'}
                  {mode === 'register' && 'Complete Staff Registration'}
                  {mode === 'forgot' && 'Send 6-Digit Code'}
                  {mode === 'reset' && 'Confirm New Password'}
                </span>
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
