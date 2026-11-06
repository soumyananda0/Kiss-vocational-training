import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Layers, CalendarCheck, BookCheck,
  FileCheck2, Award, QrCode, FileText, UserCog, History, LogOut, Menu, X, ShieldAlert, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee', 'cert_authority'] },
    { label: 'Trainees Directory', path: '/trainees', icon: Users, roles: ['super_admin', 'coordinator', 'trainer', 'mentor'] },
    { label: 'Vocational Trades', path: '/trades', icon: Layers, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee', 'cert_authority'] },
    { label: 'Training Programmes', path: '/programmes', icon: BookOpen, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee', 'cert_authority'] },
    { label: 'Batches & Cohorts', path: '/batches', icon: Layers, roles: ['super_admin', 'coordinator', 'trainer'] },
    { label: 'Faculty Allocation', path: '/allocations', icon: UserCog, roles: ['super_admin', 'coordinator'] },
    { label: 'Attendance Registry', path: '/attendance', icon: CalendarCheck, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee'] },
    { label: 'Daily Training Diary', path: '/diary', icon: BookCheck, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee'] },
    { label: 'Assessments & Marks', path: '/assessments', icon: FileCheck2, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee'] },
    { label: 'Mentor Feedback', path: '/mentor-feedback', icon: FileText, roles: ['super_admin', 'coordinator', 'mentor', 'trainer', 'trainee'] },
    { label: 'Certificate Approvals', path: '/certificates', icon: Award, roles: ['super_admin', 'coordinator', 'cert_authority', 'trainee'] },
    { label: 'Verify Certificate', path: '/verify', icon: QrCode, roles: ['super_admin', 'coordinator', 'trainer', 'mentor', 'trainee', 'cert_authority'] },
    { label: 'Reports & Analytics', path: '/reports', icon: FileText, roles: ['super_admin', 'coordinator'] },
    { label: 'User Administration', path: '/users', icon: UserCog, roles: ['super_admin'] },
    { label: 'System Audit Logs', path: '/audit-logs', icon: History, roles: ['super_admin'] }
  ];

  const allowedNav = navigationItems.filter(item => hasRole(item.roles));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'coordinator': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trainer': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'mentor': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'trainee': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'cert_authority': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Demo Banner */}
      <div className="bg-amber-500 text-slate-900 px-4 py-1 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-sm">
        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Demonstration System</span>
        <span>KISS Vocational Training Management System (KISS-VTMS) &bull; Sample Institutional Dataset</span>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex-shrink-0">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-800 border border-gold-500/40 flex items-center justify-center font-bold text-white text-lg tracking-wider shadow">
              KISS
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-tight leading-none">KISS-VTMS</div>
              <div className="text-[11px] text-slate-400 mt-1">Vocational Directorate</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-800 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.fullName}</div>
                <div className="text-xs text-slate-400 truncate">{user?.roleName}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header and Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 transform transition-transform lg:hidden flex flex-col ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-brand-800 flex items-center justify-center font-bold text-white text-sm">KISS</div>
              <span className="font-bold text-white text-sm">KISS-VTMS</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-800 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="bg-white border-b border-slate-200 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Kalinga Institute of Social Sciences (KISS)
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Deemed to be University, Bhubaneswar &bull; Directorate of Vocational Education
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user?.roleKey)}`}>
                {user?.roleName || user?.roleKey}
              </div>

              {/* Trainee profile link shortcut */}
              {user?.roleKey === 'trainee' && user?.profile?.id && (
                <Link
                  to={`/trainees/${user.profile.id}`}
                  className="hidden md:flex items-center gap-1.5 text-xs text-brand-800 bg-brand-50 border border-brand-200 hover:bg-brand-100 px-3 py-1.5 rounded-md font-medium transition-colors"
                >
                  <span>My Journey Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Verification quick link */}
              <Link
                to="/verify"
                className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md font-medium transition-colors border border-slate-200"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Verify Credential</span>
              </Link>
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          {/* Global Institutional Footer */}
          <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
            <p>
              &copy; 2026 Kalinga Institute of Social Sciences (KISS), Bhubaneswar, Odisha. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Vocational Training Management System (KISS-VTMS) &bull; Designed for indigenous tribal student empowerment.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
