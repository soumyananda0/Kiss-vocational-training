import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { downloadCertificatePdf, previewCertificatePdf } from '../utils/downloadHelper';
import {
  Award, CheckCircle2, XCircle, AlertTriangle, Download, QrCode,
  ShieldCheck, FileText, ChevronRight, Clock, Check, X, AlertCircle, Eye
} from 'lucide-react';

export default function CertificatesPage() {
  const { user, hasRole } = useAuth();
  const [batches, setBatches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(1);
  const [selectedTrainee, setSelectedTrainee] = useState(1);

  const [eligibility, setEligibility] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // CA Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeApproval, setActiveApproval] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('All 8 statutory completion criteria verified.');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedBatch && selectedTrainee) {
      checkTraineeEligibility();
    }
  }, [selectedBatch, selectedTrainee]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [resB, resT, resCert] = await Promise.all([
        api.get('/batches'),
        api.get('/trainees'),
        api.get('/certificates/list')
      ]);
      if (resB.success && resB.data.length > 0) {
        setBatches(resB.data);
        setSelectedBatch(resB.data[0].id);
      }
      if (resT.success && resT.data.length > 0) {
        setTrainees(resT.data);
        setSelectedTrainee(resT.data[0].id);
      }
      if (resCert.success) setIssuedCertificates(resCert.data);

      if (hasRole(['super_admin', 'coordinator', 'cert_authority'])) {
        const resAppr = await api.get('/certificates/pending-approvals');
        if (resAppr.success) setPendingApprovals(resAppr.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkTraineeEligibility = async () => {
    try {
      const res = await api.get(`/certificates/eligibility/${selectedTrainee}/${selectedBatch}`);
      if (res.success) {
        setEligibility(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestApproval = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/certificates/request-approval', {
        batch_id: selectedBatch,
        trainee_id: selectedTrainee
      });
      if (res.success) {
        setSuccessMsg('Approval request submitted to Certificate Authority.');
        checkTraineeEligibility();
        fetchInitial();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post('/certificates/review-approval', {
        approval_id: activeApproval.id,
        decision,
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
        approval_notes: approvalNotes
      });
      if (res.success) {
        setShowReviewModal(false);
        setSuccessMsg(res.message);
        fetchInitial();
        checkTraineeEligibility();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-gold-50 text-gold-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-gold-200 mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>Institutional Conformance & Governance</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Certificate Eligibility, Approvals & Dual PDF Generation
        </h2>
        <p className="text-xs text-slate-500">
          8-Point Completion Checklist &bull; Authority Review &bull; Landscape Official Certificate &bull; Trainee Journey Portfolio
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pending Approvals Table for Certificate Authority / Coordinator */}
      {hasRole(['super_admin', 'cert_authority']) && pendingApprovals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-800" />
                <span>Certificate Authority Approval Queue ({pendingApprovals.filter(p => p.status === 'pending').length} Pending)</span>
              </h3>
              <p className="text-xs text-slate-500">Review completed cohorts before digital seal and PDF generation</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Trainee Candidate</th>
                  <th className="py-2.5 px-3">Programme & Batch</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Requested By</th>
                  <th className="py-2.5 px-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.map((appr) => (
                  <tr key={appr.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{appr.trainee_name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{appr.registration_no}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">{appr.programme_title}</div>
                      <div className="text-[11px] text-slate-500">{appr.batch_name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        appr.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appr.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {appr.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {appr.requester_name}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {appr.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setActiveApproval(appr);
                            setShowReviewModal(true);
                          }}
                          className="text-xs font-semibold text-white bg-brand-800 hover:bg-brand-900 px-3 py-1.5 rounded shadow-xs"
                        >
                          Review & Authorise
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8-Point Eligibility Checklist Inspector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">8-Point Statutory Completion Eligibility Engine</h3>
            <p className="text-xs text-slate-500">Every requirement must be fulfilled before certificate issuance is authorised</p>
          </div>

          {/* Batch & Trainee Switchers */}
          <div className="flex items-center gap-2">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
              className="text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedTrainee}
              onChange={(e) => setSelectedTrainee(parseInt(e.target.value))}
              className="text-xs border border-slate-300 rounded-lg p-2 bg-white font-medium"
            >
              {trainees.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.registration_no})</option>
              ))}
            </select>
          </div>
        </div>

        {eligibility && (
          <div className="space-y-4">
            {/* Status Strip */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              eligibility.eligibleForIssuance
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : eligibility.readyForApproval
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                {eligibility.eligibleForIssuance ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    Candidate: {eligibility.traineeName} ({eligibility.registrationNo})
                  </h4>
                  <p className="text-xs mt-0.5">
                    {eligibility.eligibleForIssuance
                      ? 'Fully Qualified & Conferred. Both official documents generated and registered.'
                      : eligibility.readyForApproval
                      ? 'All academic & attendance requirements met. Ready for Certificate Authority review.'
                      : 'Pending Completion Criteria. Deficiencies highlighted below.'}
                  </p>
                </div>
              </div>

              {/* Action buttons based on eligibility state */}
              <div>
                {eligibility.readyForApproval && eligibility.approvalStatus === 'not_requested' && (
                  <button
                    onClick={handleRequestApproval}
                    disabled={actionLoading}
                    className="bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit to Authority Queue'}
                  </button>
                )}

                {eligibility.eligibleForIssuance && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadCertificatePdf(`KISS-VT-CERT-2026-${String(selectedTrainee).padStart(4, '0')}`, `KISS_Official_Certificate.pdf`)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Cert 1 (A4)</span>
                    </button>
                    <button
                      onClick={() => downloadCertificatePdf(`KISS-VT-CERT-2026-${String(selectedTrainee).padStart(4, '0')}-PORTFOLIO`, `KISS_Journey_Portfolio.pdf`)}
                      className="bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Cert 2 (Portfolio)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Checklist Grid (All 8 Gates) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {eligibility.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    item.passed
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-red-200 bg-red-50/40'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.passed ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Gate {item.id}: {item.title}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        item.passed ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {item.passed ? 'PASSED' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>
                    <div className="mt-1.5 font-semibold text-slate-800 text-[11px]">
                      Current: {item.current}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Issued Certificates Catalog */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Recently Issued Official Certificates & Portfolios</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Certificate Ref</th>
                <th className="py-2.5 px-3">Candidate Name</th>
                <th className="py-2.5 px-3">Document Type</th>
                <th className="py-2.5 px-3">Programme / Trade</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3 text-right">Download / Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issuedCertificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-mono font-semibold text-brand-800">
                    {c.certificate_number}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {c.trainee_name}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.certificate_type === 'completion_certificate'
                        ? 'bg-gold-100 text-gold-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {c.certificate_type === 'completion_certificate' ? 'Official Cert (Landscape A4)' : 'Journey Portfolio (Multi-Page)'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    {c.programme_title}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {c.issue_date}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => downloadCertificatePdf(c.certificate_number, `${c.certificate_number}.pdf`)}
                      className="inline-flex items-center gap-1 font-semibold text-brand-800 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => previewCertificatePdf(c.certificate_number)}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer"
                      title="Preview in new tab"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <Link
                      to={`/verify/${c.certificate_number.replace('-PORTFOLIO', '')}`}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Verify</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Authority Review Modal */}
      {showReviewModal && activeApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Authorise Certificate Issuance</h3>
                <p className="text-xs text-slate-500">Certificate Authority Executive Decision</p>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <div><strong>Candidate:</strong> {activeApproval.trainee_name} ({activeApproval.registration_no})</div>
                <div><strong>Programme:</strong> {activeApproval.programme_title}</div>
                <div><strong>Batch:</strong> {activeApproval.batch_name}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Authorisation Notes / Remarks</label>
                <input
                  type="text"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('rejected')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Reject Issuance
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('approved')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Generate Dual PDFs</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
