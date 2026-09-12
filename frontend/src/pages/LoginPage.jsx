import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, logout, demoAccounts } = useAuth();

  const initialRole = searchParams.get('role') === 'officer' ? 'officer' : 'farmer';
  const [selectedRole, setSelectedRole] = useState(initialRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Always show the login portal on root visit — reset any previous session
  useEffect(() => {
    logout();
  }, []);

  // When switching role tab, pre-fill or clear
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'farmer') {
      setEmail(demoAccounts.FARMER.email);
      setPassword(demoAccounts.FARMER.password);
    } else {
      setEmail(demoAccounts.OFFICER.email);
      setPassword(demoAccounts.OFFICER.password);
    }
  };

  const handleQuickFill = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'farmer') {
      setEmail(demoAccounts.FARMER.email);
      setPassword(demoAccounts.FARMER.password);
    } else {
      setEmail(demoAccounts.OFFICER.email);
      setPassword(demoAccounts.OFFICER.password);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);

      if (result.success) {
        navigate(result.redirectTo, { replace: true });
      } else {
        setError(result.error);
      }
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080d1a] flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-blue-500/15 to-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 p-[1px] shadow-xl shadow-emerald-500/20 mb-2">
            <div className="w-full h-full bg-[#0b1329] rounded-[15px] flex items-center justify-center">
              <Leaf className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Sign In to <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">AgriNova</span>
          </h1>
          <p className="text-xs text-slate-400">
            Select your account type to access the appropriate portal
          </p>
        </div>

        {/* ── Demo Credentials Box (Pinned for User Convenience) ── */}
        <div className="glass-elevated rounded-2xl p-4 border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Demo Credentials Available
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">One-Click Fill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Farmer Demo Pill */}
            <button
              type="button"
              onClick={() => handleQuickFill('farmer')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRole === 'farmer'
                  ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-md'
                  : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  🌾 Farmer
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  Auto Fill
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 truncate">farmer@gmail.com</p>
              <p className="text-[10px] font-mono text-slate-500">farmer123</p>
            </button>

            {/* Officer Demo Pill */}
            <button
              type="button"
              onClick={() => handleQuickFill('officer')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRole === 'officer'
                  ? 'bg-blue-500/15 border-blue-500/40 ring-1 ring-blue-500/30 shadow-md'
                  : 'bg-white/5 border-white/5 hover:border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                  🛡️ Officer
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  Auto Fill
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 truncate">officer@gmail.com</p>
              <p className="text-[10px] font-mono text-slate-500">officer123</p>
            </button>
          </div>
        </div>

        {/* ── Main Login Form Card ── */}
        <div className="glass-elevated rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleChange('farmer')}
              className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'farmer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌾</span>
              <span>Farmer Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('officer')}
              className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'officer'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛡️</span>
              <span>Officer Login</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'farmer' ? 'farmer@gmail.com' : 'officer@gmail.com'}
                  className="w-full bg-[#0b1329] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b1329] border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-bold text-xs tracking-wide text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] ${
                selectedRole === 'farmer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-blue-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'farmer' ? 'Farmer' : 'Agriculture Officer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick info note */}
          <div className="pt-2 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-500">
              {selectedRole === 'farmer'
                ? '🌾 Farmer Portal: Upload photos, view AI disease scores & treatment advice.'
                : '🛡️ Officer Console: Manage district tickets, review evidence & monitor outbreak map.'}
            </p>
          </div>
        </div>

        {/* Secure portal notice */}
        <div className="text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Sri Lanka National Agricultural Disease Surveillance System</span>
          </p>
        </div>

      </div>
    </div>
  );
}
