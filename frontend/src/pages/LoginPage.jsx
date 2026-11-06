import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Award, QrCode, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'Password123!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Super Administrator', email: 'admin@kiss.ac.in', color: 'border-purple-200 hover:border-purple-400 bg-purple-50/50' },
    { label: 'Training Coordinator', email: 'coordinator@kiss.ac.in', color: 'border-blue-200 hover:border-blue-400 bg-blue-50/50' },
    { label: 'Trainer / Teacher', email: 'trainer.sahoo@kiss.ac.in', color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50' },
    { label: 'Faculty Mentor', email: 'mentor.das@kiss.ac.in', color: 'border-amber-200 hover:border-amber-400 bg-amber-50/50' },
    { label: 'Trainee (Sita Majhi)', email: 'trainee.sita@kiss.ac.in', color: 'border-cyan-200 hover:border-cyan-400 bg-cyan-50/50' },
    { label: 'Certificate Authority', email: 'authority@kiss.ac.in', color: 'border-rose-200 hover:border-rose-400 bg-rose-50/50' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Demo Tag */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold border border-amber-200">
          <span>Demonstration Institutional Environment &bull; KISS Bhubaneswar</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-800 border-2 border-gold-500 shadow-md mb-3 text-white font-black text-2xl tracking-wider">
            KISS
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            KISS-VTMS Portal
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Vocational Training Management System
          </p>
          <p className="text-xs text-slate-500">
            Kalinga Institute of Social Sciences Deemed to be University
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Institutional Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@kiss.ac.in"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-800 focus:border-brand-800 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-800 focus:border-brand-800 text-slate-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-800 hover:bg-brand-900 focus:outline-none transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Login Grid */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                One-Click Role Demonstration
              </span>
              <span className="text-[11px] text-slate-400">Password: Password123!</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoLogin(acc.email)}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-slate-800 transition-all ${acc.color} text-left flex flex-col justify-between`}
                >
                  <span className="font-semibold text-slate-900">{acc.label}</span>
                  <span className="text-[10px] text-slate-500 truncate mt-0.5">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Public Verification Shortcut */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>External Verifier?</span>
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-800 hover:text-brand-900"
            >
              <QrCode className="w-4 h-4" />
              <span>Public QR Certificate Verification</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
