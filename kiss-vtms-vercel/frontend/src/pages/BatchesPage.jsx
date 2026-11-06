import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Layers, Plus, Calendar, Users, CheckCircle2, UserPlus, X, AlertCircle } from 'lucide-react';

export default function BatchesPage() {
  const { hasRole } = useAuth();
  const [batches, setBatches] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Batch Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    batch_code: '',
    programme_id: 1,
    name: '',
    start_date: '2026-11-01',
    end_date: '2027-01-31',
    capacity: 30
  });

  // Enrol Modal
  const [showEnrolModal, setShowEnrolModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [enrolTraineeId, setEnrolTraineeId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const [resB, resP, resT] = await Promise.all([
        api.get('/batches'),
        api.get('/programmes'),
        api.get('/trainees')
      ]);
      if (resB.success) setBatches(resB.data);
      if (resP.success) setProgrammes(resP.data);
      if (resT.success) setTrainees(resT.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post('/batches', batchForm);
      if (res.success) {
        setShowBatchModal(false);
        fetchBatches();
      }
    } catch (err) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEnrolTrainee = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post(`/batches/${selectedBatchId}/enrol`, {
        trainee_id: parseInt(enrolTraineeId)
      });
      if (res.success) {
        setShowEnrolModal(false);
        fetchBatches();
      }
    } catch (err) {
      setError(err.message || 'Failed to enrol trainee');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Batches & Cohort Schedules</h2>
          <p className="text-xs text-slate-500">
            Training schedules, cohort capacity, and student enrolment management
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator']) && (
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Batch</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading batches...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold text-brand-800 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded font-mono">
                    {b.batch_code}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    b.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {b.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
                <span className="text-xs text-slate-500 block mt-0.5">{b.programme_title}</span>
                <span className="text-xs text-gold-600 font-semibold block mt-0.5">{b.trade_name}</span>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Training Duration:</span>
                    <strong className="text-slate-800">{b.duration_weeks} Weeks ({b.total_training_hours} Hrs)</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Dates:</span>
                    <strong className="text-slate-800">{b.start_date} to {b.end_date}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Enrolled / Capacity:</span>
                    <strong className="text-brand-800">{b.enrolled_count || 1} / {b.capacity} Students</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Assigned Trainer:</span>
                    <strong className="text-slate-800">{b.primary_trainer || 'Bhabani Shankar Sahoo'}</strong>
                  </div>
                </div>
              </div>

              {hasRole(['super_admin', 'coordinator']) && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => {
                      setSelectedBatchId(b.id);
                      setShowEnrolModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Enrol Trainee</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Schedule New Batch</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Code *</label>
                <input
                  type="text"
                  required
                  value={batchForm.batch_code}
                  onChange={(e) => setBatchForm({ ...batchForm, batch_code: e.target.value })}
                  placeholder="e.g. BATCH-COMP-2026-B"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Training Programme *</label>
                <select
                  value={batchForm.programme_id}
                  onChange={(e) => setBatchForm({ ...batchForm, programme_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. Computer Literacy Cohort B"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trainee Capacity *</label>
                <input
                  type="number"
                  required
                  value={batchForm.capacity}
                  onChange={(e) => setBatchForm({ ...batchForm, capacity: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Creating...' : 'Schedule Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enrol Modal */}
      {showEnrolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Enrol Trainee into Batch</h3>
              <button onClick={() => setShowEnrolModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEnrolTrainee} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Trainee *</label>
                <select
                  required
                  value={enrolTraineeId}
                  onChange={(e) => setEnrolTraineeId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">Select Trainee...</option>
                  {trainees.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.registration_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEnrolModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !enrolTraineeId}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Enrolling...' : 'Confirm Enrolment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
