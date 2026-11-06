import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserCog, UserCheck, ShieldAlert, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';

export default function AllocationsPage() {
  const { hasRole } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trainer Assign Modal
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [trainerForm, setTrainerForm] = useState({ batch_id: '', trainer_id: '' });

  // Mentor Assign Modal
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorForm, setMentorForm] = useState({ batch_id: '', trainee_id: '', mentor_id: '' });

  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTr, resM, resB, resT] = await Promise.all([
        api.get('/allocations/trainers'),
        api.get('/allocations/mentors'),
        api.get('/batches'),
        api.get('/trainees')
      ]);
      if (resTr.success) setTrainers(resTr.data);
      if (resM.success) setMentors(resM.data);
      if (resB.success) setBatches(resB.data);
      if (resT.success) setTrainees(resT.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTrainer = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post('/allocations/assign-trainer', trainerForm);
      if (res.success) {
        setShowTrainerModal(false);
        setSuccessMsg('Trainer successfully assigned to training batch.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign trainer');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post('/allocations/assign-mentor', mentorForm);
      if (res.success) {
        setShowMentorModal(false);
        setSuccessMsg('Mentor successfully paired with student.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign mentor');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faculty & Mentor Allocation Engine</h2>
          <p className="text-xs text-slate-500">
            Certified vocational trainers and faculty mentors assigned to training batches
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator']) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setShowTrainerModal(true);
              }}
              className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Trainer</span>
            </button>
            <button
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setShowMentorModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Mentor</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Trainers Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserCog className="w-4 h-4 text-brand-800" />
          <span>Certified Vocational Trainers & Teachers</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((tr) => (
            <div key={tr.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {tr.employee_id}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                  {tr.active_assignments || 1} Active Batch
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{tr.full_name}</h4>
              <p className="text-xs text-brand-800 font-semibold">{tr.specialization}</p>

              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div><strong>Qualification:</strong> {tr.qualification}</div>
                <div><strong>Experience:</strong> {tr.experience_years} Years Teaching</div>
                <div><strong>Contact:</strong> {tr.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentors Section */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>Faculty Mentors & Pastoral Care Guides</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((m) => (
            <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {m.employee_id}
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">
                  {m.active_mentees || 1} Assigned Mentees
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">{m.full_name}</h4>
              <p className="text-xs text-amber-700 font-semibold">{m.designation}</p>

              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div><strong>Expertise:</strong> {m.area_of_expertise}</div>
                <div><strong>Contact:</strong> {m.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Assign Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Assign Trainer to Batch</h3>
              <button onClick={() => setShowTrainerModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAssignTrainer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Batch *</label>
                <select
                  required
                  value={trainerForm.batch_id}
                  onChange={(e) => setTrainerForm({ ...trainerForm, batch_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">Select Batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.trade_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Trainer *</label>
                <select
                  required
                  value={trainerForm.trainer_id}
                  onChange={(e) => setTrainerForm({ ...trainerForm, trainer_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">Select Trainer...</option>
                  {trainers.map((tr) => (
                    <option key={tr.id} value={tr.id}>{tr.full_name} ({tr.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTrainerModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !trainerForm.batch_id || !trainerForm.trainer_id}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentor Assign Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Pair Mentor with Student</h3>
              <button onClick={() => setShowMentorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAssignMentor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Batch *</label>
                <select
                  required
                  value={mentorForm.batch_id}
                  onChange={(e) => setMentorForm({ ...mentorForm, batch_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">Select Batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Trainee *</label>
                <select
                  required
                  value={mentorForm.trainee_id}
                  onChange={(e) => setMentorForm({ ...mentorForm, trainee_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">Select Trainee...</option>
                  {trainees.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.registration_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Mentor *</label>
                <select
                  required
                  value={mentorForm.mentor_id}
                  onChange={(e) => setMentorForm({ ...mentorForm, mentor_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">Select Mentor...</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.designation})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !mentorForm.batch_id || !mentorForm.trainee_id || !mentorForm.mentor_id}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Pairing...' : 'Confirm Pairing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
