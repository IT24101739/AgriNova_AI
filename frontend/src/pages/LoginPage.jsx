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
  Sparkles,
  AlertCircle,
  Sun,
  CloudRain,
  CheckCircle2
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

  // Always show the login portal on root visit — reset previous session
  useEffect(() => {
    logout();
  }, []);

  // When switching role tab, pre-fill credentials
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#05130b] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      
      {/* Botanical ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-emerald-600/15 via-green-500/10 to-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full relative z-10">
        
        {/* Main Split Portal Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ── Left Column: Rich Agricultural Visual Showcase ── */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Visual Header Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide shadow-sm">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>National Crop Disease Early Warning Platform</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Protecting Sri Lanka’s <br />
                <span className="bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-300 bg-clip-text text-transparent">
                  Agricultural Harvest
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                Connect farmers with plant pathology AI and regional agriculture officers to diagnose crop infections early and safeguard food security.
              </p>
            </div>

            {/* Panoramic Agriculture Landscape Image Card */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/25 shadow-2xl group">
              <img
                src="/images/agri_hero.jpg"
                alt="Sri Lankan terraced fields and tea plantations at sunrise"
                className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05130b] via-[#05130b]/40 to-transparent" />
              
              {/* Overlay badges */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Western & Central Belts
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/70 backdrop-blur-md border border-emerald-500/40 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Surveillance Active
                </span>
              </div>
            </div>

            {/* Agriculture Key Pillars */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-emerald-500/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🌾</span>
                </div>
                <div>
                  <p className="font-bold text-white">Farmer Diagnostic Suite</p>
                  <p className="text-[10px] text-slate-400">Leaf scan & treatment advice</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-blue-500/20 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🛡️</span>
                </div>
                <div>
                  <p className="font-bold text-white">Officer Surveillance</p>
                  <p className="text-[10px] text-slate-400">Outbreak map & field triage</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Interactive Login Form & Demo Cards ── */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* ── Demo Credentials Callout (Pinned for Quick Testing) ── */}
            <div className="glass-elevated rounded-2xl p-4 border border-emerald-500/25 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Select Demo Account to Test:
                </span>
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono font-bold">1-Click Auto Fill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Farmer Demo Pill */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('farmer')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'farmer'
                      ? 'bg-emerald-500/20 border-emerald-500/50 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      🌾 Farmer
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-200 font-bold">
                      Auto Fill
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-200 truncate">farmer@gmail.com</p>
                  <p className="text-[10px] font-mono text-emerald-400 font-semibold">farmer123</p>
                </button>

                {/* Officer Demo Pill */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('officer')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'officer'
                      ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-white/5 border-white/5 hover:border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                      🛡️ Officer
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-blue-500/25 text-blue-200 font-bold">
                      Auto Fill
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-200 truncate">officer@gmail.com</p>
                  <p className="text-[10px] font-mono text-blue-400 font-semibold">officer123</p>
                </button>
              </div>
            </div>

            {/* ── Main Form Card ── */}
            <div className="glass-elevated rounded-2xl p-6 sm:p-7 border border-emerald-500/25 shadow-2xl space-y-5">
              
              {/* Portal Selector Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-emerald-500/20 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleRoleChange('farmer')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    selectedRole === 'farmer'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌾</span>
                  <span>Farmer Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('officer')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    selectedRole === 'officer'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🛡️</span>
                  <span>Officer Portal</span>
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
                      <Mail className="w-4 h-4 text-emerald-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'farmer' ? 'farmer@gmail.com' : 'officer@gmail.com'}
                      className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
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
                      <Lock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wide text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] ${
                    selectedRole === 'farmer'
                      ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/25'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-blue-500/25'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Enter {selectedRole === 'farmer' ? 'Farmer Portal' : 'Officer Command Center'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Portal summary line */}
              <div className="pt-2 border-t border-white/5 text-center">
                <p className="text-[11px] text-slate-400">
                  {selectedRole === 'farmer'
                    ? '🌾 Farmer Portal: Upload photos, view AI disease scores & treatment advice.'
                    : '🛡️ Officer Console: Manage district tickets, review evidence & monitor outbreak map.'}
                </p>
              </div>
            </div>

            {/* Official Agricultural Notice */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Sri Lanka National Agricultural Disease Surveillance System</span>
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
