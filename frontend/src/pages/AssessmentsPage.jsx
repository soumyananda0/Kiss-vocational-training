import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileCheck2, Plus, Award, CheckCircle2, AlertCircle, X,
  Edit3, BarChart2, Star
} from 'lucide-react';

export default function AssessmentsPage() {
  const { hasRole } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Assessment Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    batch_id: 1,
    title: '',
    assessment_type: 'practical',
    max_marks: 50,
    passing_marks: 25,
    weightage_pct: 25.0,
    evaluation_date: new Date().toISOString().split('T')[0]
  });

  // Grade Modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingTrainee, setGradingTrainee] = useState(null);
  const [marksInput, setMarksInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [resA, resB] = await Promise.all([
        api.get('/assessments'),
        api.get('/batches')
      ]);
      if (resA.success) {
        setAssessments(resA.data);
        if (resA.data.length > 0) {
          selectAssessment(resA.data[0]);
        }
      }
      if (resB.success) setBatches(resB.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectAssessment = async (asm) => {
    setSelectedAssessment(asm);
    try {
      const res = await api.get(`/assessments/${asm.id}/results`);
      if (res.success) {
        setAssessmentResults(res.data.results || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post('/assessments', createForm);
      if (res.success) {
        setShowCreateModal(false);
        setSuccessMsg('Assessment task created successfully.');
        fetchInitial();
      }
    } catch (err) {
      setError(err.message || 'Failed to create assessment');
    } finally {
      setModalLoading(false);
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post(`/assessments/${selectedAssessment.id}/grade`, {
        trainee_id: gradingTrainee.trainee_id,
        marks_obtained: parseFloat(marksInput),
        trainer_remarks: remarksInput
      });
      if (res.success) {
        setShowGradeModal(false);
        setSuccessMsg(`Marks recorded for ${gradingTrainee.full_name}.`);
        selectAssessment(selectedAssessment);
      }
    } catch (err) {
      setError(err.message || 'Failed to record marks');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assessment & Competency Evaluation</h2>
          <p className="text-xs text-slate-500">
            Formative practical evaluations, theoretical tests, capstone demonstrations, and passing criteria
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator', 'trainer']) && (
          <button
            onClick={() => {
              setError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Assessments list on left, scoring details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assessment Tasks */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Evaluation Modules ({assessments.length})
          </h3>

          <div className="space-y-2">
            {assessments.map((a) => (
              <div
                key={a.id}
                onClick={() => selectAssessment(a)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedAssessment?.id === a.id
                    ? 'border-brand-800 bg-brand-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {a.assessment_type}
                  </span>
                  <span className="text-[11px] text-slate-400">{a.evaluation_date}</span>
                </div>
                <h4 className="font-bold text-slate-900 mt-1.5 text-xs">{a.title}</h4>
                <div className="flex items-center justify-between text-slate-500 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span>Max: {a.max_marks} (Pass: {a.passing_marks})</span>
                  <span className="font-semibold text-brand-800">{a.batch_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Trainee Score Sheet */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAssessment ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gold-600 tracking-wider">
                    {selectedAssessment.assessment_type} Evaluation Scorecard
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedAssessment.title}</h3>
                  <p className="text-xs text-slate-500">
                    Max Marks: {selectedAssessment.max_marks} &bull; Passing Marks: {selectedAssessment.passing_marks} &bull; Batch: {selectedAssessment.batch_name}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Trainee Candidate</th>
                      <th className="py-2.5 px-3">Marks Scored</th>
                      <th className="py-2.5 px-3">Percentage</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Trainer Remarks</th>
                      {hasRole(['super_admin', 'coordinator', 'trainer']) && (
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessmentResults.map((r) => (
                      <tr key={r.trainee_id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{r.full_name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{r.registration_no}</div>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {r.marks_obtained !== null ? `${r.marks_obtained} / ${selectedAssessment.max_marks}` : '-'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-brand-800">
                          {r.percentage ? `${r.percentage}%` : '-'}
                        </td>
                        <td className="py-3 px-3">
                          {r.result ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.result === 'pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {r.result}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Ungraded</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                          {r.trainer_remarks || '-'}
                        </td>
                        {hasRole(['super_admin', 'coordinator', 'trainer']) && (
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setGradingTrainee(r);
                                setMarksInput(r.marks_obtained !== null ? String(r.marks_obtained) : '');
                                setRemarksInput(r.trainer_remarks || '');
                                setShowGradeModal(true);
                              }}
                              className="text-xs font-semibold text-brand-800 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded"
                            >
                              {r.marks_obtained !== null ? 'Update Grade' : 'Score Trainee'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
              Select an assessment on the left to review trainee scorecards.
            </div>
          )}
        </div>
      </div>

      {/* Grade Trainee Modal */}
      {showGradeModal && gradingTrainee && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Score Assessment</h3>
                <p className="text-xs text-slate-500">{gradingTrainee.full_name} ({gradingTrainee.registration_no})</p>
              </div>
              <button onClick={() => setShowGradeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Marks Obtained (Max: {selectedAssessment.max_marks}, Pass: {selectedAssessment.passing_marks}) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  max={selectedAssessment.max_marks}
                  min="0"
                  value={marksInput}
                  onChange={(e) => setMarksInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-brand-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trainer Remarks</label>
                <textarea
                  rows="2"
                  value={remarksInput}
                  onChange={(e) => setRemarksInput(e.target.value)}
                  placeholder="e.g. Excellent seam symmetry and clean finish"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || marksInput === ''}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Saving...' : 'Record Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create Assessment Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Training Batch *</label>
                <select
                  value={createForm.batch_id}
                  onChange={(e) => setCreateForm({ ...createForm, batch_id: parseInt(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. End-of-Term Capstone Practical Demonstration"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assessment Type *</label>
                <select
                  value={createForm.assessment_type}
                  onChange={(e) => setCreateForm({ ...createForm, assessment_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="theoretical">Theoretical Test</option>
                  <option value="practical">Practical Demonstration</option>
                  <option value="project">Course Assignment / Project</option>
                  <option value="final">Final Comprehensive Evaluation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Marks *</label>
                  <input
                    type="number"
                    required
                    value={createForm.max_marks}
                    onChange={(e) => setCreateForm({ ...createForm, max_marks: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Marks (&ge;50%) *</label>
                  <input
                    type="number"
                    required
                    value={createForm.passing_marks}
                    onChange={(e) => setCreateForm({ ...createForm, passing_marks: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evaluation Date *</label>
                <input
                  type="date"
                  required
                  value={createForm.evaluation_date}
                  onChange={(e) => setCreateForm({ ...createForm, evaluation_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
