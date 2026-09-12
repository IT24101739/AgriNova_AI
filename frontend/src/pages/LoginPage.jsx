import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf,
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  BadgeCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  Sun,
  CheckCircle2,
  UserPlus,
  LogIn
} from 'lucide-react';

const SRI_LANKA_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, signup, logout, demoAccounts } = useAuth();

  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState('signin');

  const initialRole = searchParams.get('role') === 'officer' ? 'officer' : 'farmer';
  const [selectedRole, setSelectedRole] = useState(initialRole);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up specific fields
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [district, setDistrict] = useState('Gampaha');
  const [phone, setPhone] = useState('');
  const [badge, setBadge] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Always show the login portal on root visit — reset previous session
  useEffect(() => {
    logout();
  }, []);

  // When switching role tab in signin, pre-fill demo credentials
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    setSuccessMsg('');
    if (authMode === 'signin') {
      if (role === 'farmer') {
        setEmail(demoAccounts?.FARMER?.email || 'farmer@gmail.com');
        setPassword(demoAccounts?.FARMER?.password || 'farmer123');
      } else if (role === 'officer') {
        setEmail(demoAccounts?.OFFICER?.email || 'officer@gmail.com');
        setPassword(demoAccounts?.OFFICER?.password || 'officer123');
      } else if (role === 'lab') {
        setEmail(demoAccounts?.LAB?.email || 'lab@gmail.com');
        setPassword(demoAccounts?.LAB?.password || 'lab123');
      } else if (role === 'admin') {
        setEmail(demoAccounts?.ADMIN?.email || 'admin@gmail.com');
        setPassword(demoAccounts?.ADMIN?.password || 'admin123');
      }
    }
  };

  const handleQuickFill = (role) => {
    setAuthMode('signin');
    setSelectedRole(role);
    setError('');
    setSuccessMsg('');
    if (role === 'farmer') {
      setEmail(demoAccounts?.FARMER?.email || 'farmer@gmail.com');
      setPassword(demoAccounts?.FARMER?.password || 'farmer123');
    } else if (role === 'officer') {
      setEmail(demoAccounts?.OFFICER?.email || 'officer@gmail.com');
      setPassword(demoAccounts?.OFFICER?.password || 'officer123');
    } else if (role === 'lab') {
      setEmail(demoAccounts?.LAB?.email || 'lab@gmail.com');
      setPassword(demoAccounts?.LAB?.password || 'lab123');
    } else if (role === 'admin') {
      setEmail(demoAccounts?.ADMIN?.email || 'admin@gmail.com');
      setPassword(demoAccounts?.ADMIN?.password || 'admin123');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      setIsLoading(false);

      if (result.success) {
        navigate(result.redirectTo, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Login failed.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const signupPayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: selectedRole,
        district,
        phone: phone.trim() || null,
        badge: selectedRole === 'officer' ? (badge.trim() || 'AO-REG-2026') : (selectedRole === 'lab' ? (badge.trim() || 'LAB-SL-01') : (selectedRole === 'admin' ? 'SYS-ADMIN' : null)),
        preferred_language: preferredLanguage,
      };

      const result = await signup(signupPayload);
      setIsLoading(false);

      if (result.success) {
        setSuccessMsg(result.message || 'Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate(result.redirectTo, { replace: true });
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#05130b] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      
      {/* Botanical ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-emerald-600/15 via-green-500/10 to-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full relative z-10">
        
        {/* Main Split Portal Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ── Left Column: Rich Agricultural Visual Showcase ── */}
          <div className="lg:col-span-6 space-y-5">
            
            {/* Visual Header Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide shadow-sm">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>National Crop Disease Early Warning Platform · Sri Lanka</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Protecting Sri Lanka's <br />
                <span className="shimmer-text">
                  Agricultural Harvest
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                AI-powered plant pathology meets on-ground agriculture officers — diagnosing crop infections, alerting farmers, and safeguarding food security across 25 districts.
              </p>
            </div>

            {/* ── Panoramic Hero Image with overlay ── */}
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/25 shadow-2xl group">
              <img
                src="/images/hero_login.jpg"
                alt="Sri Lankan paddy fields at dusk — the heart of agriculture"
                className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05130b]/90 via-[#05130b]/20 to-transparent" />
              
              {/* Crop variety pills floating over image */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {['🌾 Rice','🍅 Tomato','🌶️ Chilli','🍌 Banana','🥔 Potato'].map(crop => (
                  <span key={crop} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white/90">
                    {crop}
                  </span>
                ))}
              </div>

              {/* Overlay badges bottom */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  25 Districts · Sri Lanka
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/70 backdrop-blur-md border border-emerald-500/40 font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  AI-Powered · Live
                </span>
              </div>
            </div>

            {/* Quick-stat strip */}
            <div className="stat-strip" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              <div className="stat-strip-item">
                <div className="stat-strip-value">1.2M+</div>
                <div className="stat-strip-label">Farmers Covered</div>
              </div>
              <div className="stat-strip-item">
                <div className="stat-strip-value">95%</div>
                <div className="stat-strip-label">AI Accuracy</div>
              </div>
              <div className="stat-strip-item">
                <div className="stat-strip-value" style={{fontSize:'1.15rem'}}>3 Lang</div>
                <div className="stat-strip-label">සිංහල · தமிழ் · EN</div>
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

          {/* ── Right Column: Interactive Login & Sign Up Form ── */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* ── Mode Switcher: Sign In vs Sign Up ── */}
            <div className="flex rounded-2xl bg-black/50 p-1.5 border border-emerald-500/20 shadow-lg">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account (Sign Up)</span>
              </button>
            </div>

            {/* ── Demo Credentials Callout (Only in Sign In Mode) ── */}
            {authMode === 'signin' && (
              <div className="glass-elevated rounded-2xl p-4 border border-emerald-500/25 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quick Test Demo Accounts:
                  </span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono font-bold">1-Click Fill</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('farmer')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'farmer'
                        ? 'bg-emerald-500/20 border-emerald-500/50 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'bg-white/5 border-white/5 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-emerald-300">🌾 Farmer</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-200 font-bold">1-Click</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-200 truncate">farmer@gmail.com</p>
                    <p className="text-[9px] font-mono text-emerald-400 font-semibold">farmer123</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('officer')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'officer'
                        ? 'bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                        : 'bg-white/5 border-white/5 hover:border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-blue-300">🛡️ Officer</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-200 font-bold">1-Click</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-200 truncate">officer@gmail.com</p>
                    <p className="text-[9px] font-mono text-blue-400 font-semibold">officer123</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('lab')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'lab'
                        ? 'bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'bg-white/5 border-white/5 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-purple-300">🔬 Lab</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-200 font-bold">1-Click</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-200 truncate">lab@gmail.com</p>
                    <p className="text-[9px] font-mono text-purple-400 font-semibold">lab123</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRole === 'admin'
                        ? 'bg-amber-500/20 border-amber-500/50 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-white/5 border-white/5 hover:border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-bold text-amber-300">⚙️ Admin</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-200 font-bold">1-Click</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-200 truncate">admin@gmail.com</p>
                    <p className="text-[9px] font-mono text-amber-400 font-semibold">admin123</p>
                  </button>
                </div>
              </div>
            )}

            {/* ── Main Form Card ── */}
            <div className="glass-elevated rounded-2xl p-6 sm:p-7 border border-emerald-500/25 shadow-2xl space-y-5">
              
              {/* Role Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 p-1 rounded-xl bg-black/40 border border-emerald-500/20 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => handleRoleChange('farmer')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'farmer'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌾</span>
                  <span className="truncate">{authMode === 'signup' ? 'Farmer' : 'Farmer'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('officer')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'officer'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🛡️</span>
                  <span className="truncate">{authMode === 'signup' ? 'Officer' : 'Officer'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('lab')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'lab'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🔬</span>
                  <span className="truncate">{authMode === 'signup' ? 'Lab' : 'Research Lab'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚙️</span>
                  <span className="truncate">{authMode === 'signup' ? 'Admin' : 'Admin'}</span>
                </button>
              </div>

              {/* Feedback messages */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ── Sign In Form ── */}
              {authMode === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
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
              ) : (
                /* ── Sign Up Form ── */
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="E.g., Sunil Bandara"
                        className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* District & Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        District
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          {SRI_LANKA_DISTRICTS.map((d) => (
                            <option key={d} value={d} className="bg-[#05130b] text-white">
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="077xxxxxxx"
                          className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Officer Badge ID (if Officer) */}
                  {selectedRole === 'officer' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-300 mb-1">
                        Officer Designation / Badge ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <input
                          type="text"
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          placeholder="E.g., AO-WP-2026"
                          className="w-full bg-[#081b11] border border-blue-500/30 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Language */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Preferred Advisory Language
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { code: 'en', label: 'English' },
                        { code: 'si', label: 'සිංහල' },
                        { code: 'ta', label: 'தமிழ்' },
                      ].map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => setPreferredLanguage(l.code)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                            preferredLanguage === l.code
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Password (Min 6)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#081b11] border border-emerald-500/25 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-xs tracking-wide text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] ${
                      selectedRole === 'farmer'
                        ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 shadow-blue-500/25'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register as {selectedRole === 'farmer' ? 'Farmer' : 'Agriculture Officer'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Portal summary line */}
              <div className="pt-2 border-t border-white/5 text-center">
                <p className="text-[11px] text-slate-400">
                  {authMode === 'signup'
                    ? '✨ Real-time Supabase Auth sync. Instant verified access.'
                    : selectedRole === 'farmer'
                    ? '🌾 Farmer Portal: Upload photos, view AI disease scores & treatment advice.'
                    : '🛡️ Officer Console: Manage district tickets, review evidence & monitor outbreak map.'}
                </p>
              </div>
            </div>

            {/* Official Agricultural Notice */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Sri Lanka National Agricultural Disease Surveillance System · Supabase Connected</span>
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

