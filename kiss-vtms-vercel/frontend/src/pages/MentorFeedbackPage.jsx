import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileText, Plus, CheckCircle2, AlertCircle, X, User } from 'lucide-react';

export default function MentorFeedbackPage() {
  const { hasRole } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: 1,
    trainee_id: 1,
    session_date: new Date().toISOString().split('T')[0],
    areas_discussed: '',
    strengths: '',
    improvement_areas: '',
    recommendations: '',
    overall_observations: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [resF, resB, resT] = await Promise.all([
        api.get('/mentor-feedback'),
        api.get('/batches'),
        api.get('/trainees')
      ]);
      if (resF.success) setFeedbackList(resF.data);
      if (resB.success) setBatches(resB.data);
      if (resT.success) setTrainees(resT.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post('/mentor-feedback', formData);
      if (res.success) {
        setShowModal(false);
        setSuccessMsg('Mentoring session logged successfully.');
        fetchInitial();
        setFormData({
          batch_id: 1,
          trainee_id: 1,
          session_date: new Date().toISOString().split('T')[0],
          areas_discussed: '',
          strengths: '',
          improvement_areas: '',
          recommendations: '',
          overall_observations: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to save feedback');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mentor Feedback & Pastoral Tracking</h2>
          <p className="text-xs text-slate-500">
            Qualitative mentoring sessions, behavioural milestones, and career guidance for trainees
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator', 'mentor']) && (
          <button
            onClick={() => {
              setError('');
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Mentoring Session</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading mentor logs...</div>
      ) : feedbackList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
          No mentoring sessions recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((f) => (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    {f.trainee_name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{f.trainee_name} ({f.registration_no})</h4>
                    <span className="text-[11px] text-slate-500">Programme: {f.programme_title}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-brand-800 block">Session Date: {f.session_date}</span>
                  <span className="text-[11px] text-slate-500">Mentor: {f.mentor_name} ({f.designation})</span>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <strong className="text-slate-800">Areas Discussed & Reviewed:</strong>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{f.areas_discussed}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                    <strong className="text-emerald-900 block mb-0.5">Observed Strengths:</strong>
                    <p className="text-slate-700 leading-relaxed">{f.strengths}</p>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
                    <strong className="text-amber-900 block mb-0.5">Growth & Career Guidance:</strong>
                    <p className="text-slate-700 leading-relaxed">{f.recommendations}</p>
                  </div>
                </div>

                {f.overall_observations && (
                  <div className="pt-2 text-[11px] text-slate-500 italic">
                    Overall Summary: "{f.overall_observations}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Mentoring Session Feedback</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Training Batch *</label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trainee Candidate *</label>
                  <select
                    value={formData.trainee_id}
                    onChange={(e) => setFormData({ ...formData, trainee_id: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {trainees.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name} ({t.registration_no})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Date *</label>
                <input
                  type="date"
                  required
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Areas Discussed & Evaluated *</label>
                <textarea
                  required
                  rows="2"
                  value={formData.areas_discussed}
                  onChange={(e) => setFormData({ ...formData, areas_discussed: e.target.value })}
                  placeholder="e.g. Practical confidence, workshop ergonomics, peer collaboration..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observed Strengths *</label>
                <textarea
                  required
                  rows="2"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  placeholder="e.g. Diligent attention to precision measurements and tool safety..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Growth & Career Recommendations *</label>
                <textarea
                  required
                  rows="2"
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="e.g. Recommended for commercial micro-enterprise grant and advanced pattern grading..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Saving...' : 'Save Feedback Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
