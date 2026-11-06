import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { downloadCertificatePdf, previewCertificatePdf } from '../utils/downloadHelper';
import {
  ShieldCheck, QrCode, Search, CheckCircle2, XCircle, Award,
  Calendar, Building2, User, ArrowLeft, Lock, Download, Eye
} from 'lucide-react';

export default function VerificationPage() {
  const { certId } = useParams();
  const [query, setQuery] = useState(certId || 'KISS-VT-CERT-2026-0001');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (certId) {
      setQuery(certId);
      performVerify(certId);
    }
  }, [certId]);

  const performVerify = async (identifier) => {
    if (!identifier) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await api.get(`/verify/${encodeURIComponent(identifier.trim())}`);
      if (res.success && res.valid) {
        setResult(res.data);
      } else {
        setResult(null);
        setError('Certificate record not found or revoked.');
      }
    } catch (err) {
      setResult(null);
      setError(err.message || 'Certificate record not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performVerify(query);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 hover:text-brand-900">
            <ArrowLeft className="w-4 h-4" />
            <span>KISS-VTMS Login Portal</span>
          </Link>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Public Verification Engine
          </span>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 p-8 text-white text-center relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-800 border-2 border-gold-500 text-white font-bold text-xl mb-3 shadow">
              KISS
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Official Credential Verification Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto">
              Kalinga Institute of Social Sciences (KISS) Deemed to be University, Bhubaneswar, Odisha
            </p>
            <p className="text-[11px] text-gold-400 font-semibold mt-1">
              Directorate of Vocational Education & Skill Development
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Search Input Box */}
            <form onSubmit={handleSearch} className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter Certificate Number or Verification Hash
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. KISS-VT-CERT-2026-0001"
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-brand-800 focus:border-brand-800 text-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Verify Authenticity'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Tip: Scannable via camera QR or enter reference ID directly.
              </p>
            </form>

            {/* Results Section */}
            {searched && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                {result ? (
                  <div className="space-y-6">
                    {/* Authenticity Badge */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Verified & Authentic Credential
                        </div>
                        <h3 className="text-sm font-bold text-emerald-950">
                          Officially Issued by KISS Directorate of Vocational Education
                        </h3>
                      </div>
                    </div>

                    {/* Verified Details Sheet */}
                    <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Candidate Full Name:</span>
                          <span className="text-slate-900 font-bold text-sm">{result.traineeName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Certificate Identifier:</span>
                          <span className="text-brand-800 font-mono font-bold">{result.certificateNumber}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Vocational Programme:</span>
                          <span className="text-slate-900 font-semibold">{result.programmeTitle}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Trade Domain:</span>
                          <span className="text-slate-900 font-semibold">{result.tradeName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Training Period:</span>
                          <span className="text-slate-800">{result.trainingPeriod}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Date of Conferment:</span>
                          <span className="text-slate-800">{result.issueDate}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">Conferring Institution:</span>
                        <span className="text-slate-900 font-medium">{result.institution}</span>
                      </div>
                    </div>

                    {/* Official Document Downloads */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Verified Official PDF Documents</div>
                        <div className="text-[11px] text-slate-500">Download conferred vector certificates directly</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => downloadCertificatePdf(result.certificateNumber, `KISS_Official_Certificate_${result.certificateNumber}.pdf`)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Cert 1 (Official A4)</span>
                        </button>
                        <button
                          onClick={() => downloadCertificatePdf(`${result.certificateNumber}-PORTFOLIO`, `KISS_Journey_Portfolio_${result.certificateNumber}.pdf`)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Cert 2 (Portfolio)</span>
                        </button>
                        <button
                          onClick={() => previewCertificatePdf(result.certificateNumber)}
                          className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-2 rounded-lg transition-colors cursor-pointer"
                          title="Preview in browser"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>

                    {/* Zero-PII Compliance Notice */}
                    <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 text-slate-500 p-3 rounded-lg text-[11px]">
                      <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Student Data Privacy Guarantee:</strong> In strict compliance with institutional data governance policies, sensitive personal identifiers (contact numbers, home addresses, dates of birth, and tribal classifications) are strictly omitted from public verification.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center text-xs space-y-2">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-red-900 text-sm">Certificate Record Not Found</h3>
                    <p className="text-red-700 max-w-sm mx-auto">
                      {error || 'The entered certificate reference number or cryptographic hash does not match any official record in the KISS-VTMS registry.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 mt-8">
        &copy; 2026 Kalinga Institute of Social Sciences (KISS) &bull; Bhubaneswar, Odisha
      </div>
    </div>
  );
}
