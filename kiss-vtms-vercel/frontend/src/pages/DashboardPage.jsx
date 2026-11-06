import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { downloadCertificatePdf } from '../utils/downloadHelper';
import {
  Users, BookOpen, Layers, Award, CalendarCheck, CheckCircle2,
  AlertTriangle, ArrowRight, Download, Clock, Star, TrendingUp, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-800"></div>
        <span className="ml-3 text-sm font-medium">Loading institutional metrics...</span>
      </div>
    );
  }

  const summary = stats?.summary || {};
  const tradeData = stats?.tradeDistribution || [];
  const recentTrainees = stats?.recentTrainees || [];
  const roleSpecific = stats?.roleSpecific || {};

  const COLORS = ['#1E3A8A', '#D97706', '#059669', '#7C3AED', '#DB2777', '#0284C7'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-gold-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KISS Vocational Skilling & Livelihood Framework</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Welcome back, {user?.fullName}!
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
            Logged in as <span className="text-gold-400 font-semibold">{user?.roleName}</span>. Tracking experiential vocational journeys and dual official credentials for KISS students.
          </p>
        </div>

        {/* Role action quick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {user?.roleKey === 'trainer' && (
            <>
              <Link
                to="/attendance"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                to="/diary"
                className="bg-brand-700 hover:bg-brand-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Clock className="w-4 h-4" />
                <span>Add Daily Diary</span>
              </Link>
            </>
          )}

          {user?.roleKey === 'cert_authority' && (
            <Link
              to="/certificates"
              className="bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>Review Approvals ({summary.pendingApprovals})</span>
            </Link>
          )}

          {user?.roleKey === 'trainee' && roleSpecific.enrolment && (
            <Link
              to={`/trainees/${roleSpecific.traineeId}`}
              className="bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>View My Journey Portfolio</span>
            </Link>
          )}
        </div>
      </div>

      {/* Trainee Highlight Card if logged in as Student */}
      {user?.roleKey === 'trainee' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <div className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
                Enrolled Vocational Programme
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {roleSpecific.enrolment?.programme_title || 'Apparel Manufacturing & Fashion Technology'}
              </h3>
              <p className="text-xs text-slate-500">
                Trade: {roleSpecific.enrolment?.trade_name || 'Tailoring & Apparel'} &bull; Batch: {roleSpecific.enrolment?.batch_name || 'Cohort 2026-A'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500">Overall Attendance</div>
                <div className="text-lg font-bold text-emerald-600">{roleSpecific.attendancePct}%</div>
              </div>
              <div className="text-right border-l pl-3 border-slate-200">
                <div className="text-xs text-slate-500">Logged Journey Days</div>
                <div className="text-lg font-bold text-brand-800">{roleSpecific.diaryDaysLogged} Days</div>
              </div>
            </div>
          </div>

          {/* Download Certificates Strip */}
          {roleSpecific.certificates && roleSpecific.certificates.length > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Official Credentials Conferred & Available!</h4>
                  <p className="text-xs text-emerald-700">Both your Official Certificate and Learning Journey Portfolio have been verified and issued.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCertificatePdf('KISS-VT-CERT-2026-0001', 'KISS_Official_Certificate.pdf')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Cert 1 (Official)</span>
                </button>
                <button
                  onClick={() => downloadCertificatePdf('KISS-VT-CERT-2026-0001-PORTFOLIO', 'KISS_Trainee_Portfolio.pdf')}
                  className="bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Cert 2 (Portfolio)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Training completion in progress. Certificate issuance will unlock upon fulfilling attendance and assessment gates.</span>
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Trainees</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{summary.totalTrainees}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">Active Cohorts</span>
            <span>across KISS trades</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vocational Trades</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{tradeData.length || 6}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-brand-800 font-semibold">{summary.totalProgrammes} Programmes</span>
            <span>active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{summary.overallAttendanceRate}%</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Above 75% institutional gate
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{summary.pendingApprovals}</div>
          <div className="text-xs text-slate-500 mt-1">
            Awaiting Certificate Authority sign-off
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Distribution Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vocational Trade Enrolment Distribution</h3>
              <p className="text-xs text-slate-500">Number of trainees registered across practical trades</p>
            </div>
            <Link to="/trades" className="text-xs font-semibold text-brand-800 hover:text-brand-900 flex items-center gap-1">
              <span>View Trades</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="value" name="Trainees" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Certificate Status Breakdown Pie Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Certification Pipeline</h3>
            <p className="text-xs text-slate-500">Status of cohort graduation approvals</p>

            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Certified', value: summary.issuedCertificates || 1 },
                      { name: 'In Training', value: Math.max((summary.totalTrainees || 2) - (summary.issuedCertificates || 1), 1) },
                      { name: 'Pending CA', value: summary.pendingApprovals || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#059669" />
                    <Cell fill="#1E3A8A" />
                    <Cell fill="#D97706" />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Dual Document System:</span>
            <span className="font-semibold text-brand-800">Landscape Cert + 20-Sec Portfolio</span>
          </div>
        </div>
      </div>

      {/* Recent Trainees and Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Enrolled Trainees</h3>
              <p className="text-xs text-slate-500">Students actively undergoing vocational instruction</p>
            </div>
            <Link to="/trainees" className="text-xs font-semibold text-brand-800 hover:text-brand-900 flex items-center gap-1">
              <span>All Trainees</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Trainee Name</th>
                  <th className="py-2.5 px-3">Registration ID</th>
                  <th className="py-2.5 px-3">Trade Domain</th>
                  <th className="py-2.5 px-3">Class / Grade</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTrainees.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{t.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{t.registration_no}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.trade_name || 'Apparel & Tailoring'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.class_grade}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/trainees/${t.id}`}
                        className="text-xs font-semibold text-brand-800 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded transition-colors"
                      >
                        Profile & Journey
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Institutional Action Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Central Modules</h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/diary"
                className="block p-3 rounded-lg border border-slate-200 hover:border-brand-800 hover:bg-slate-50 transition-all"
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Daily Training Diary</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-500 mt-0.5">Chronological Day 1 to Day N activities, practical tasks & tools.</p>
              </Link>

              <Link
                to="/attendance"
                className="block p-3 rounded-lg border border-slate-200 hover:border-brand-800 hover:bg-slate-50 transition-all"
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Session Attendance</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-500 mt-0.5">Mark daily sessions and track 75% completion compliance.</p>
              </Link>

              <Link
                to="/certificates"
                className="block p-3 rounded-lg border border-slate-200 hover:border-brand-800 hover:bg-slate-50 transition-all"
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Certificate Eligibility & Approvals</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-500 mt-0.5">8-point eligibility gate and dual PDF generation.</p>
              </Link>

              <Link
                to="/verify"
                className="block p-3 rounded-lg border border-slate-200 hover:border-brand-800 hover:bg-slate-50 transition-all"
              >
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>QR Code Public Verification</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-slate-500 mt-0.5">Instant tamper-proof validation without exposing student PII.</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
