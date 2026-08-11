'use client';

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChartLine,
  Building,
  Building2,
  User,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  section?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    href: '/dashboard',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderKanban size={18} />,
    href: '/projects',
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <CheckSquare size={18} />,
    href: '/tasks',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <ChartLine size={18} />,
    href: '/analytics',
  },

  // TEAM
  {
    id: 'team-members',
    label: 'Team Members',
    icon: <Users size={18} />,
    href: '/team',
    section: 'TEAM',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users size={18} />,
    href: '/users',
    section: 'TEAM',
  },
  {
    id: 'employee',
    label: 'Employee',
    icon: <User size={18} />,
    href: '/employee',
    section: 'TEAM',
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: <Building size={18} />,
    href: '/departments',
    section: 'TEAM',
  },
  {
    id: 'organizations',
    label: 'Organization',
    icon: <Building2 size={18} />,
    href: '/Organizations',
    section: 'TEAM',
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

function getActiveNavId(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/projects': 'projects',
    '/tasks': 'tasks',
    '/analytics': 'analytics',
    '/team': 'team-members',
    '/users': 'users',
    '/employee': 'employee',
    '/departments': 'departments',
    '/Organizations': 'organizations',
  };

  return map[pathname] ?? 'dashboard';
}

export default function Sidebar({
  collapsed = false,
  onToggle,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = getActiveNavId(location.pathname);

  const mainNav = navItems.filter((item) => !item.section);
  const teamNav = navItems.filter((item) => item.section === 'TEAM');

  return (
    <aside
      className="
        flex
        flex-col
        h-screen
        flex-shrink-0
        relative
        z-20
        overflow-hidden
        border-r
        transition-all
        duration-300
        ease-[cubic-bezier(0.4,0,0.2,1)]
      "
      style={{
        width: collapsed ? '78px' : '280px',
        background:
          'linear-gradient(180deg, #07152f 0%, #0a1b3d 45%, #08152e 100%)',
        borderColor: 'rgba(148, 163, 184, 0.12)',
        boxShadow:
          '8px 0 35px rgba(2, 8, 23, 0.25), inset -1px 0 rgba(255,255,255,0.025)',
      }}
    >
      {/* =========================================================
          BRAND HEADER
      ========================================================== */}
      <div
        className={`
          relative
          flex
          items-center
          flex-shrink-0
          h-[92px]
          border-b
          border-white/[0.07]
          ${collapsed ? 'justify-center px-3' : 'px-5'}
        `}
      >
        {/* Top blue accent */}
        <div
          className="absolute left-0 top-0 w-full h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(59,130,246,.8), transparent)',
          }}
        />

        {/* =====================================================
            LOGO
            Fixed container + overflow hidden + centered scaling
        ====================================================== */}
        <div
          className="
            relative
            flex
            items-center
            justify-center
            flex-shrink-0
            w-[62px]
            h-[62px]
            overflow-hidden
            rounded-[18px]
            bg-white/[0.035]
            border
            border-white/[0.09]
            shadow-lg
            shadow-blue-950/30
          "
        >
          {/* Soft inner glow */}
          <div
            className="
              absolute
              inset-0
              rounded-[18px]
              pointer-events-none
            "
            style={{
              background:
                'radial-gradient(circle at center, rgba(59,130,246,.12), transparent 70%)',
            }}
          />

          {/* Logo image */}
        <img
    src="/assets/images/logo.png"
    alt="ProManage logo"
    className="
      w-full
      h-full
      object-contain
      p-2.5 
      select-none
    "
  />
        </div>

        {/* =====================================================
            BRAND TEXT
        ====================================================== */}
        {!collapsed && (
          <div
            className="
              ml-4
              min-w-0
              flex-1
              flex
              flex-col
              justify-center
            "
          >
            {/* ProManage */}
            <div
              className="
                text-[21px]
                leading-none
                font-extrabold
                tracking-[-0.04em]
                whitespace-nowrap
              "
            >
              <span className="text-white">Pro</span>
              <span
                className="
                  text-transparent
                  bg-clip-text
                  bg-gradient-to-r
                  from-blue-300
                  via-blue-400
                  to-cyan-400
                "
              >
                Manage
              </span>
            </div>

            {/* Subtitle */}
            <div
              className="
                mt-[7px]
                text-[9px]
                leading-none
                font-semibold
                uppercase
                tracking-[0.13em]
                text-white
                whitespace-nowrap
              "
            >
              Project Management System
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          NAVIGATION
      ========================================================== */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5">
        {/* WORKSPACE */}
        <div className="space-y-1.5">
          {!collapsed && (
            <div className="px-3 mb-3">
              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-slate-500
                "
              >
                Workspace
              </span>
            </div>
          )}

          {mainNav.map((item) => {
            const isActive = activeId === item.id;

            return (
              <Link
                key={item.id}
                to={item.href}
                title={item.label}
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  transition-all
                  duration-200
                  ease-out
                  ${
                    collapsed
                      ? 'justify-center px-2 py-3'
                      : 'px-3.5 py-3'
                  }
                  ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-100'
                  }
                `}
              >
                {/* Active background */}
                {isActive && (
                  <>
                    <span
                      className="
                        absolute
                        inset-0
                        rounded-xl
                        bg-gradient-to-r
                        from-blue-600/25
                        via-blue-500/15
                        to-transparent
                        border
                        border-blue-400/10
                      "
                    />

                    {/* Active blue indicator */}
                    <span
                      className="
                        absolute
                        left-0
                        top-2
                        bottom-2
                        w-[3px]
                        rounded-r-full
                        bg-gradient-to-b
                        from-blue-300
                        to-blue-600
                        shadow-[0_0_12px_rgba(59,130,246,.8)]
                      "
                    />
                  </>
                )}

                {/* Hover background */}
                {!isActive && (
                  <span
                    className="
                      absolute
                      inset-0
                      rounded-xl
                      bg-white/[0.035]
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                      duration-200
                    "
                  />
                )}

                {/* Icon */}
                <span
                  className={`
                    relative
                    z-10
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                    transition-all
                    duration-200
                    ${
                      isActive
                        ? 'text-blue-300'
                        : 'text-slate-500 group-hover:text-blue-300'
                    }
                    group-hover:scale-105
                  `}
                >
                  {item.icon}
                </span>

                {/* Text */}
                {!collapsed && (
                  <span
                    className="
                      relative
                      z-10
                      flex-1
                      truncate
                      text-[13px]
                      font-semibold
                      tracking-[-0.01em]
                    "
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* =====================================================
            TEAM
        ====================================================== */}
        <div className="mt-7">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-3 mb-3">
              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-slate-500
                "
              >
                Team
              </span>

              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
          ) : (
            <div className="mx-2 my-4 h-px bg-white/[0.08]" />
          )}

          <div className="space-y-1.5">
            {teamNav.map((item) => {
              const isActive = activeId === item.id;

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  title={item.label}
                  className={`
                    group
                    relative
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    transition-all
                    duration-200
                    ease-out
                    ${
                      collapsed
                        ? 'justify-center px-2 py-3'
                        : 'px-3.5 py-3'
                    }
                    ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }
                  `}
                >
                  {/* Active background */}
                  {isActive && (
                    <>
                      <span
                        className="
                          absolute
                          inset-0
                          rounded-xl
                          bg-gradient-to-r
                          from-blue-600/25
                          via-blue-500/15
                          to-transparent
                          border
                          border-blue-400/10
                        "
                      />

                      <span
                        className="
                          absolute
                          left-0
                          top-2
                          bottom-2
                          w-[3px]
                          rounded-r-full
                          bg-gradient-to-b
                          from-blue-300
                          to-blue-600
                          shadow-[0_0_12px_rgba(59,130,246,.8)]
                        "
                      />
                    </>
                  )}

                  {/* Hover */}
                  {!isActive && (
                    <span
                      className="
                        absolute
                        inset-0
                        rounded-xl
                        bg-white/[0.035]
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-200
                      "
                    />
                  )}

                  {/* Icon */}
                  <span
                    className={`
                      relative
                      z-10
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                      transition-all
                      duration-200
                      ${
                        isActive
                          ? 'text-blue-300'
                          : 'text-slate-500 group-hover:text-blue-300'
                      }
                      group-hover:scale-105
                    `}
                  >
                    {item.icon}
                  </span>

                  {/* Text */}
                  {!collapsed && (
                    <span
                      className="
                        relative
                        z-10
                        flex-1
                        truncate
                        text-[13px]
                        font-semibold
                        tracking-[-0.01em]
                      "
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* =========================================================
          SIGN OUT
      ========================================================== */}
      <div className="flex-shrink-0 px-3 pb-3">
        <button
          onClick={() => navigate('/login')}
          className={`
            group
            relative
            w-full
            flex
            items-center
            rounded-xl
            border
            border-white/[0.07]
            bg-white/[0.025]
            text-slate-400
            hover:text-red-300
            hover:bg-red-500/[0.07]
            hover:border-red-400/20
            transition-all
            duration-200
            ${
              collapsed
                ? 'justify-center py-3'
                : 'gap-3 px-3.5 py-3'
            }
          `}
        >
          <LogOut
            size={17}
            className="
              transition-transform
              duration-200
              group-hover:-translate-x-0.5
            "
          />

          {!collapsed && (
            <span className="text-[13px] font-semibold">
              Sign Out
            </span>
          )}
        </button>
      </div>

      {/* =========================================================
          COLLAPSE BUTTON
      ========================================================== */}
      <div className="flex-shrink-0 px-3 pb-4">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            group
            w-full
            flex
            items-center
            justify-center
            rounded-xl
            border
            border-white/[0.07]
            bg-white/[0.025]
            text-slate-500
            hover:text-blue-300
            hover:bg-blue-500/[0.06]
            hover:border-blue-400/20
            transition-all
            duration-200
            ${
              collapsed
                ? 'py-3'
                : 'py-2.5'
            }
          `}
        >
          {collapsed ? (
            <ChevronRight
              size={17}
              className="
                transition-transform
                duration-200
                group-hover:translate-x-0.5
              "
            />
          ) : (
            <ChevronLeft
              size={17}
              className="
                transition-transform
                duration-200
                group-hover:-translate-x-0.5
              "
            />
          )}
        </button>
      </div>

      {/* =========================================================
          AMBIENT GLOW
      ========================================================== */}
      <div
        className="
          absolute
          -bottom-32
          -left-20
          w-64
          h-64
          rounded-full
          pointer-events-none
        "
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,.12) 0%, transparent 70%)',
        }}
      />
    </aside>
  );
}