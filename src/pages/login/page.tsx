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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E2E4FA] via-[#EAEAFC] to-[#F1EAFF] flex flex-col justify-center p-6 lg:p-12 font-sans relative overflow-hidden">
      
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-left opacity-35 mix-blend-multiply" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EAEAFC]/70 to-[#F1EAFF] backdrop-blur-[2px] lg:backdrop-blur-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EAEAFC]/40 to-[#F1EAFF]/90 lg:backdrop-blur-md" />
      </div>

      {/* Main Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full my-auto">
        
        {/* Left Section: Logo & Description */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          
          {/* Top Logo Container: Fixed height box so elements below don't shift, with visually enlarged logo using transform scale */}
          <div className="relative h-10 flex items-center">
            <img 
              src="/assets/images/app_logo.png" 
              alt="ProManage Logo" 
              className="h-30 w-auto object-contain scale-125 lg:scale-150 transition-transform duration-200"
            />
          </div>

          {/* Headline & Description */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Plan. Manage.<br />
              Deliver. <span className="text-[#5B46E8]">Together.</span>
            </h1>
            <div className="w-16 h-1.5 bg-gradient-to-r from-[#5B46E8] to-[#8B5CF6] rounded-full" />
            <p className="text-slate-600 text-base sm:text-lg lg:text-xl font-medium leading-relaxed max-w-xl pt-1">
              ProManage helps teams streamline projects, track progress, and deliver results efficiently—all in one centralized workspace.
            </p>
          </div>

          {/* Feature List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">
            {featureItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/40 backdrop-blur-xs border border-white/60">
                  <div className="p-2.5 rounded-xl bg-[#5B46E8]/10 text-[#5B46E8] shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-normal mt-0.5">
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
          <div className="w-full max-w-[440px] rounded-[36px] bg-gradient-to-br from-[#FAFAFF] to-[#F5F3FF] backdrop-blur-xl p-6 sm:p-8 border border-white/80 shadow-[0_30px_80px_-20px_rgba(91,70,232,0.35)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_40px_100px_-25px_rgba(91,70,232,0.45)]">
            
           <div className="flex flex-col items-center justify-center mb-6">
  {/* Form Logo */}
  <div className="mb-4 flex items-center justify-center">
    <img 
      src="/assets/images/app_logo.png" 
      alt="ProManage Logo" 
      className="h-18 w-auto object-contain transition-transform duration-200 sm:h-24"
    />
  </div>

  {/* Form Title & Subtitle */}
  <div className="space-y-1 text-center">
    <h2 className="text-2xl font-bold text-slate-900">
      Welcome back!
    </h2>
    <p className="text-xs font-medium text-slate-400">
      Sign in to continue to ProManage
    </p>
  </div>
</div>

            {/* Login Form */}
            <form onSubmit={onFinish} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email / Username</label>
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 focus-within:bg-white focus-within:border-[#5B46E8] focus-within:ring-2 focus-within:ring-[#5B46E8]/20 transition-all">
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 focus-within:bg-white focus-within:border-[#5B46E8] focus-within:ring-2 focus-within:ring-[#5B46E8]/20 transition-all">
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
              <div className="flex items-center justify-between text-xs pt-1">
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
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#5B46E8] to-[#7C3AED] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              {/* Secure Login Note */}
              <div className="pt-4 text-center space-y-1">
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