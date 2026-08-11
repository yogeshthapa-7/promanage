'use client';

import { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
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

    const identifier = (
      form.elements.namedItem('identifier') as HTMLInputElement
    ).value;

    const password = (
      form.elements.namedItem('password') as HTMLInputElement
    ).value;

    try {
      const result = await login(identifier, password);

      if (result.success) {
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 600);
      } else {
        alert(result.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9eef7] font-sans">
      {/* =========================================================
          BACKGROUND
          Soft gradient — intentionally no grid / patterns
      ========================================================== */}

      <div className="absolute inset-0 pointer-events-none">
        {/* Main background */}
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-br
            from-[#e8eef9]
            via-[#dce8f8]
            to-[#eef2f8]
          "
        />

        {/* Left blue-indigo atmosphere */}
        <div
          className="
            absolute
            -left-[220px]
            -top-[180px]
            w-[650px]
            h-[650px]
            rounded-full
            bg-blue-400/[0.14]
          "
        />

        {/* Bottom-right indigo atmosphere */}
        <div
          className="
            absolute
            -right-[180px]
            -bottom-[220px]
            w-[620px]
            h-[620px]
            rounded-full
            bg-indigo-400/[0.10]
          "
        />

        {/* Small cyan accent */}
        <div
          className="
            absolute
            right-[18%]
            top-[8%]
            w-[260px]
            h-[260px]
            rounded-full
            bg-cyan-300/[0.06]
          "
        />
      </div>

      {/* =========================================================
          MAIN APPLICATION GATEWAY
      ========================================================== */}

      <main
        className="
          relative
          z-10
          min-h-screen
          flex
          items-center
          justify-center
          px-5
          py-8
          sm:px-8
        "
      >
        <div
          className="
            w-full
            max-w-[1080px]
            min-h-[650px]
            grid
            grid-cols-1
            lg:grid-cols-[1fr_440px]
            overflow-hidden
            rounded-[30px]
            bg-white
            border
            border-white/80
            shadow-[0_30px_80px_rgba(30,55,95,.18)]
          "
        >
          {/* =====================================================
              LEFT PRODUCT PANEL
          ====================================================== */}

          <section
            className="
              relative
              hidden
              lg:flex
              flex-col
              justify-between
              overflow-hidden
              p-10
              xl:p-12
              bg-gradient-to-br
              from-[#173d73]
              via-[#285b9d]
              to-[#355e98]
            "
          >
            {/* Decorative circles */}
            <div
              className="
                absolute
                -right-28
                -top-28
                w-[340px]
                h-[340px]
                rounded-full
                border
                border-white/[0.08]
              "
            />

            <div
              className="
                absolute
                right-[-90px]
                top-[-90px]
                w-[260px]
                h-[260px]
                rounded-full
                border
                border-white/[0.06]
              "
            />

            <div
              className="
                absolute
                -left-32
                -bottom-36
                w-[430px]
                h-[430px]
                rounded-full
                bg-blue-300/[0.07]
              "
            />

            {/* ===============================================
                BRAND
            ================================================ */}

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div
                  className="
                    w-[62px]
                    h-[62px]
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                    overflow-hidden
                    rounded-[18px]
                    bg-white/[0.10]
                    border
                    border-white/[0.14]
                  "
                >
                  <img
                    src="/assets/images/logo.png"
                    alt="ProManage logo"
                    className="
                      w-[52px]
                      h-[52px]
                      object-contain
                      scale-[1.3]
                      origin-center
                    "
                  />
                </div>

                <div>
                  <div
                    className="
                      text-[27px]
                      leading-none
                      font-extrabold
                      tracking-[-0.045em]
                    "
                  >
                    <span className="text-white">Pro</span>
                    <span className="text-blue-200">Manage</span>
                  </div>

                  <div
                    className="
                      mt-2
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.18em]
                      text-blue-100/70
                    "
                  >
                    Project Management System
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================
                MAIN MESSAGE
            ================================================ */}

            <div className="relative z-10 max-w-[500px]">
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  mb-5
                  px-3
                  py-1.5
                  rounded-full
                  bg-white/[0.08]
                  border
                  border-white/[0.10]
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-blue-100
                "
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                Your workspace
              </div>

              <h1
                className="
                  text-[44px]
                  xl:text-[50px]
                  leading-[1.08]
                  font-extrabold
                  tracking-[-0.045em]
                  text-white
                "
              >
                Everything your
                <br />
                team needs to
                <br />
                <span className="text-blue-200">
                  move forward.
                </span>
              </h1>

              <p
                className="
                  mt-6
                  max-w-[470px]
                  text-[14px]
                  xl:text-[15px]
                  leading-7
                  text-blue-50/70
                "
              >
                ProManage gives your organization a clear and connected
                workspace for projects, tasks, teams and performance.
              </p>

              {/* =============================================
                  PRODUCT BENEFITS
              ============================================== */}

              <div className="mt-8 space-y-3.5">
                <ProductPoint text="Centralized project and task management" />
                <ProductPoint text="Real-time team visibility and collaboration" />
                <ProductPoint text="Clear performance and project insights" />
              </div>
            </div>

            {/* ===============================================
                FOOTER
            ================================================ */}

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/45">
                  Professional workspace
                </p>

                <p className="mt-1 text-[11px] text-blue-100/60">
                  Built for focused teams and growing organizations.
                </p>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-9
                  h-9
                  rounded-xl
                  bg-white/[0.07]
                  border
                  border-white/[0.09]
                  text-blue-100/70
                "
              >
                <CheckCircle2 size={16} />
              </div>
            </div>
          </section>

          {/* =====================================================
              LOGIN SECTION
          ====================================================== */}

          <section
            className="
              flex
              flex-col
              justify-center
              bg-[#fbfcfe]
              px-7
              py-9
              sm:px-10
              lg:px-11
              xl:px-12
            "
          >
            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-3 mb-9">
              <div
                className="
                  w-11
                  h-11
                  flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#173d73]
                  overflow-hidden
                "
              >
                <img
                  src="/assets/images/logo.png"
                  alt="ProManage"
                  className="
                    w-9
                    h-9
                    object-contain
                    scale-[1.3]
                  "
                />
              </div>

              <div>
                <div className="text-[19px] font-extrabold tracking-[-0.035em]">
                  <span className="text-slate-900">Pro</span>
                  <span className="text-blue-600">Manage</span>
                </div>

                <div
                  className="
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.13em]
                    text-slate-400
                  "
                >
                  Project Management System
                </div>
              </div>
            </div>

            {/* ===============================================
                LOGIN HEADER
            ================================================ */}

            <div className="mb-8">
              <div
                className="
                  flex
                  items-center
                  gap-2
                  mb-4
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-blue-600
                "
              >
                <span className="w-5 h-px bg-blue-500" />
                Secure access
              </div>

              <h2
                className="
                  text-[31px]
                  leading-tight
                  font-extrabold
                  tracking-[-0.04em]
                  text-slate-900
                "
              >
                Welcome back
              </h2>

              <p
                className="
                  mt-2.5
                  text-[13px]
                  leading-5
                  text-slate-500
                "
              >
                Sign in to continue to your ProManage workspace.
              </p>
            </div>

            {/* ===============================================
                LOGIN FORM
            ================================================ */}

            <form onSubmit={onFinish} className="space-y-5">
              {/* Username / Email */}
              <div>
                <label
                  htmlFor="identifier"
                  className="
                    block
                    mb-2
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-slate-600
                  "
                >
                  Email or Username
                </label>

                <div
                  className="
                    group
                    h-[50px]
                    flex
                    items-center
                    gap-3
                    px-3.5
                    rounded-xl
                    bg-white
                    border
                    border-slate-200
                    shadow-[0_2px_5px_rgba(15,23,42,.02)]
                    transition-all
                    duration-150
                    focus-within:border-blue-500
                    focus-within:ring-4
                    focus-within:ring-blue-500/[0.08]
                  "
                >
                  <Mail
                    size={17}
                    className="
                      flex-shrink-0
                      text-slate-400
                      group-focus-within:text-blue-500
                    "
                  />

                  <input
                    id="identifier"
                    type="text"
                    name="identifier"
                    placeholder="Enter your email or username"
                    required
                    autoComplete="username"
                    className="
                      w-full
                      min-w-0
                      bg-transparent
                      outline-none
                      text-[13px]
                      font-medium
                      text-slate-800
                      placeholder:text-slate-400
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-slate-600
                    "
                  >
                    Password
                  </label>
                </div>

                <div
                  className="
                    group
                    h-[50px]
                    flex
                    items-center
                    gap-3
                    px-3.5
                    rounded-xl
                    bg-white
                    border
                    border-slate-200
                    shadow-[0_2px_5px_rgba(15,23,42,.02)]
                    transition-all
                    duration-150
                    focus-within:border-blue-500
                    focus-within:ring-4
                    focus-within:ring-blue-500/[0.08]
                  "
                >
                  <Lock
                    size={17}
                    className="
                      flex-shrink-0
                      text-slate-400
                      group-focus-within:text-blue-500
                    "
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="
                      w-full
                      min-w-0
                      bg-transparent
                      outline-none
                      text-[13px]
                      font-medium
                      text-slate-800
                      placeholder:text-slate-400
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    className="
                      flex
                      items-center
                      justify-center
                      w-7
                      h-7
                      flex-shrink-0
                      rounded-lg
                      text-slate-400
                      hover:text-slate-700
                      hover:bg-slate-100
                      transition-colors
                      cursor-pointer
                    "
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setRemember((value) => !value)}
                  className="
                    flex
                    items-center
                    gap-2.5
                    text-[12px]
                    font-medium
                    text-slate-500
                    hover:text-slate-700
                    cursor-pointer
                  "
                >
                  <span
                    className={`
                      flex
                      items-center
                      justify-center
                      w-[17px]
                      h-[17px]
                      rounded-[5px]
                      border
                      ${
                        remember
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-slate-300'
                      }
                    `}
                  >
                    {remember && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>

                  Remember me
                </button>
              </div>

              {/* =============================================
                  LOGIN BUTTON
              ============================================== */}

              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  relative
                  w-full
                  h-[50px]
                  flex
                  items-center
                  justify-center
                  gap-2.5
                  rounded-xl
                  bg-gradient-to-r
                  from-[#1769d3]
                  to-[#2855c7]
                  hover:from-[#155fc0]
                  hover:to-[#244bb5]
                  text-white
                  text-[13px]
                  font-bold
                  shadow-[0_9px_22px_rgba(37,85,199,.20)]
                  transition-all
                  duration-150
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  cursor-pointer
                "
              >
                {loading ? (
                  <>
                    <span
                      className="
                        w-4
                        h-4
                        rounded-full
                        border-2
                        border-white/30
                        border-t-white
                        animate-spin
                      "
                    />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to workspace

                    <ArrowRight
                      size={16}
                      className="
                        transition-transform
                        duration-150
                        group-hover:translate-x-0.5
                      "
                    />
                  </>
                )}
              </button>
            </form>

            {/* ===============================================
                SECURITY INFORMATION
            ================================================ */}

            <div
              className="
                mt-8
                pt-6
                border-t
                border-slate-200
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    w-9
                    h-9
                    rounded-xl
                    bg-emerald-50
                    border
                    border-emerald-100
                    text-emerald-600
                  "
                >
                  <ShieldCheck size={17} />
                </div>

                <div>
                  <div className="text-[11px] font-bold text-slate-700">
                    Secure workspace access
                  </div>

                  <div className="mt-0.5 text-[9px] text-slate-400">
                    Your account and project data are protected.
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-7 text-center">
              <span className="text-[9px] font-medium text-slate-400">
                © {new Date().getFullYear()} ProManage
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* =============================================================
   SMALL PRODUCT BENEFIT COMPONENT
============================================================= */

function ProductPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          flex
          items-center
          justify-center
          w-6
          h-6
          rounded-full
          bg-white/[0.10]
          border
          border-white/[0.10]
          text-blue-100
          flex-shrink-0
        "
      >
        <CheckCircle2 size={13} />
      </div>

      <span className="text-[12px] font-medium text-blue-50/75">
        {text}
      </span>
    </div>
  );
}