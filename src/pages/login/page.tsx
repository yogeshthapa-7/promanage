'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LockKeyhole, CheckSquare, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { login } = useAuth();

  const onFinish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const result = await login(identifier, password);
      if (result.success) {
        setTimeout(() => navigate('/dashboard', { replace: true }), 600);
      } else {
        alert(result.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const featureItems = [
    {
      icon: CheckSquare,
      title: 'Organize Projects',
      description: 'Create, organize and manage all your projects in one place.',
    },
    {
      icon: Users,
      title: 'Collaborate Teams',
      description: 'Work together with your team seamlessly in real time.',
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor progress, deadlines and performance with advanced reports.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security to keep your data safe and protected.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#2D3356] via-[#484F7B] to-[#393153] flex flex-col justify-center py-6 px-4 sm:px-6 lg:py-8 lg:px-12 font-sans relative overflow-hidden">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-left opacity-35 mix-blend-overlay" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')` }}
        />
        {/* Semi-dark overlay for contrast and depth */}
        <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2D3356]/60 to-[#2D3356]/90 lg:backdrop-blur-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2D3356]/40 to-[#393153]/95 lg:backdrop-blur-sm" />
      </div>

      {/* Main Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:items-end max-w-7xl mx-auto w-full">
        
        {/* Left Section: Logo & Description */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4 lg:space-y-5">
          
          {/* Top Logo & Brand Container */}
          <div className="flex items-center gap-3">
            <img 
              src="/assets/images/logo.png" 
              alt="ProManage Logo" 
              className="h-50 w-50 object-contain object-left"
            />
            <div className="space-y-0.5 text-left -ml-28">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#818CF8] to-[#C084FC] bg-clip-text text-transparent tracking-tight">ProManage</h2>
              <p className="text-[11px] font-bold text-slate-300 tracking-widest uppercase">Project Tracking System</p>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Plan. Manage.<br />
              Deliver. <span className="text-[#818CF8]">Together.</span>
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-[#818CF8] to-[#C084FC] rounded-full" />
            <p className="text-slate-200 text-base sm:text-lg lg:text-xl font-semibold leading-relaxed max-w-xl">
              ProManage helps teams streamline projects, track progress, and deliver results efficiently—all in one centralized workspace.
            </p>
          </div>

          {/* Feature List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl pt-1">
            {featureItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <div className="p-2 rounded-lg bg-[#818CF8]/20 text-[#818CF8] shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-200 leading-normal mt-0.5 font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Floating Form Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[420px] rounded-[28px] bg-white/90 backdrop-blur-xl p-5 sm:p-6 border border-white/80 shadow-[0_30px_80px_-20px_rgba(91,70,232,0.25)] transition-all duration-300 hover:scale-[1.01]">
            
            <div className="flex flex-col items-center justify-center mb-4">
              {/* Form Logo */}
              <div className="mb-2 flex items-center justify-center w-full">
                <img 
                  src="/assets/images/logo.png" 
                  alt="ProManage Logo" 
                  className="h-24 w-24 object-contain ml-8"
                />
              </div>

              {/* Brand Title & Subtitle */}
              <div className="space-y-0.5 text-center mb-2">
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-[#4F46E5] to-[#3730A3] bg-clip-text text-transparent tracking-tight">ProManage</h2>
                <p className="text-[11px] font-extrabold text-slate-700 tracking-widest uppercase">Project Tracking System</p>
              </div>

              {/* Form Title & Subtitle */}
              <div className="space-y-1 text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Welcome back!
                </h2>
                <p className="text-xs font-medium text-slate-500">
                  Sign in to continue to ProManage
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={onFinish} className="space-y-3">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email / Username</label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 focus-within:bg-white focus-within:border-[#5B46E8] focus-within:ring-2 focus-within:ring-[#5B46E8]/20 transition-all">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    name="identifier"
                    placeholder="Enter email or username"
                    required
                    className="bg-transparent outline-none w-full text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 focus-within:bg-white focus-within:border-[#5B46E8] focus-within:ring-2 focus-within:ring-[#5B46E8]/20 transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    required
                    className="bg-transparent outline-none w-full text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <div
                    className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${
                      remember ? 'bg-[#5B46E8] border-[#5B46E8]' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {remember && (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">Remember me</span>
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5B46E8] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Secure Login Note */}
              <div className="pt-2 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <LockKeyhole className="w-3.5 h-3.5 text-[#5B46E8]" />
                  Secure login
                </div>
                <p className="text-[10px] text-slate-400">
                  Your information is encrypted and secure
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}