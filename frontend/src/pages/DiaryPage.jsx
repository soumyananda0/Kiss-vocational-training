import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BookCheck, Plus, Clock, Wrench, CheckCircle2, Award,
  MessageSquare, User, Filter, AlertCircle, X, Edit3, ArrowRight
} from 'lucide-react';

export default function DiaryPage() {
  const { user, hasRole } = useAuth();
  const [batches, setBatches] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(1);
  const [selectedTrainee, setSelectedTrainee] = useState(1);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Entry Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    day_number: 16,
    training_date: new Date().toISOString().split('T')[0],
    topic_covered: '',
    theoretical_activities: '',
    practical_activities: '',
    tools_equipment_used: '',
    skills_learned: '',
    learning_outcomes: '',
    hours_spent: 4.0,
    trainer_remarks: ''
  });

  // Mentor Review Modal
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [activeDiaryId, setActiveDiaryId] = useState(null);
  const [mentorObservation, setMentorObservation] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBatch && selectedTrainee) {
      fetchDiary();
    }
  }, [selectedBatch, selectedTrainee]);

  const fetchInitialData = async () => {
    try {
      const [resB, resT] = await Promise.all([
        api.get('/batches'),
        api.get('/trainees')
      ]);
      if (resB.success && resB.data.length > 0) {
        setBatches(resB.data);
        setSelectedBatch(resB.data[0].id);
      }
      if (resT.success && resT.data.length > 0) {
        setTrainees(resT.data);
        setSelectedTrainee(resT.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDiary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/diary?batch_id=${selectedBatch}&trainee_id=${selectedTrainee}`);
      if (res.success) {
        setDiaryEntries(res.data);
        if (res.data.length > 0) {
          const maxDay = Math.max(...res.data.map(d => d.day_number));
          setFormData(prev => ({ ...prev, day_number: maxDay + 1 }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const payload = {
        ...formData,
        batch_id: selectedBatch,
        trainee_id: selectedTrainee
      };
      const res = await api.post('/diary', payload);
      if (res.success) {
        setShowAddModal(false);
        setSuccessMsg(`Day ${formData.day_number} diary record created.`);
        fetchDiary();
        setFormData({
          day_number: formData.day_number + 1,
          training_date: new Date().toISOString().split('T')[0],
          topic_covered: '',
          theoretical_activities: '',
          practical_activities: '',
          tools_equipment_used: '',
          skills_learned: '',
          learning_outcomes: '',
          hours_spent: 4.0,
          trainer_remarks: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to add diary entry');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveMentorObservation = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.put(`/diary/${activeDiaryId}/mentor-observation`, {
        mentor_observations: mentorObservation
      });
      if (res.success) {
        setShowMentorModal(false);
        setSuccessMsg('Mentor observation appended successfully.');
        fetchDiary();
      }
    } catch (err) {
      setError(err.message || 'Failed to save mentor observation');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-brand-200 mb-1">
            <span>Primary Core Module &bull; Chronological Audit Trail</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daily Training Diary (Day 1 to Final Day)</h2>
          <p className="text-xs text-slate-500">
            Day-wise experiential records documenting practical tasks, tools used, hours spent, and mentor observations
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator', 'trainer']) && (
          <button
            onClick={() => {
              setError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Day {formData.day_number} Record</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Training Batch
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.programme_title})</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Trainee / Candidate
          </label>
          <select
            value={selectedTrainee}
            onChange={(e) => setSelectedTrainee(parseInt(e.target.value))}
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium"
          >
            {trainees.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name} ({t.registration_no})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Diary Timeline */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading chronological training diary...</div>
      ) : diaryEntries.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <BookCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Training Diary Records Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Click "Add Record" above to document Day 1 activities.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-semibold">{diaryEntries.length} Training Days Documented</span>
            <span>Total Hours: {diaryEntries.reduce((acc, c) => acc + (c.hours_spent || 0), 0)} Hours</span>
          </div>

          <div className="space-y-4">
            {diaryEntries.map((day) => (
              <div key={day.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      D{day.day_number}
                    </span>
                    <div>
                      <div className="text-[11px] font-semibold text-gold-600">
                        {day.training_date} &bull; Day {day.day_number}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{day.topic_covered}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                      {day.hours_spent} Hours
                    </span>
                    {hasRole(['super_admin', 'mentor']) && (
                      <button
                        onClick={() => {
                          setActiveDiaryId(day.id);
                          setMentorObservation(day.mentor_observations || '');
                          setShowMentorModal(true);
                        }}
                        className="text-xs font-semibold text-brand-800 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{day.mentor_observations ? 'Edit Review' : 'Add Mentor Review'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <strong className="text-slate-700 block mb-1">Theoretical Concepts Covered:</strong>
                    <p className="text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                      {day.theoretical_activities}
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-700 block mb-1">Practical Demonstrations & Exercises:</strong>
                    <p className="text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                      {day.practical_activities}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-700">Tools / Equipment: </strong>
                      <span className="text-slate-600">{day.tools_equipment_used}</span>
                    </div>
                  </div>

                  <div>
                    <strong className="text-slate-700">Skills Learned: </strong>
                    <span className="text-slate-600">{day.skills_learned}</span>
                  </div>
                </div>

                {(day.trainer_remarks || day.mentor_observations) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/80 -mx-5 -mb-5 p-4 rounded-b-xl">
                    {day.trainer_remarks && (
                      <div>
                        <strong className="text-emerald-800">Trainer Evaluation: </strong>
                        <span className="text-slate-600 italic">"{day.trainer_remarks}"</span>
                      </div>
                    )}
                    {day.mentor_observations && (
                      <div>
                        <strong className="text-brand-800">Mentor Observation: </strong>
                        <span className="text-slate-600 italic">"{day.mentor_observations}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Diary Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Daily Training Diary Entry</h3>
                <p className="text-xs text-slate-500">Document topic, practical workshop activities, tools, and hours</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day Number *</label>
                  <input
                    type="number"
                    required
                    value={formData.day_number}
                    onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-brand-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Training Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.training_date}
                    onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hours Spent *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.hours_spent}
                    onChange={(e) => setFormData({ ...formData, hours_spent: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Topic Covered *</label>
                <input
                  type="text"
                  required
                  value={formData.topic_covered}
                  onChange={(e) => setFormData({ ...formData, topic_covered: e.target.value })}
                  placeholder="e.g. Precision French Curve Grading and Dart Manipulation"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Theoretical Activities *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.theoretical_activities}
                    onChange={(e) => setFormData({ ...formData, theoretical_activities: e.target.value })}
                    placeholder="Theory, safety briefing, mathematical rules..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Practical Activities *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.practical_activities}
                    onChange={(e) => setFormData({ ...formData, practical_activities: e.target.value })}
                    placeholder="Hands-on demonstration and machine operation..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tools / Equipment Used *</label>
                  <input
                    type="text"
                    required
                    value={formData.tools_equipment_used}
                    onChange={(e) => setFormData({ ...formData, tools_equipment_used: e.target.value })}
                    placeholder="e.g. Single needle lockstitch machine, tailoring shears"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Skills Learned *</label>
                  <input
                    type="text"
                    required
                    value={formData.skills_learned}
                    onChange={(e) => setFormData({ ...formData, skills_learned: e.target.value })}
                    placeholder="e.g. Machine tension balancing, French curve drafting"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trainer Evaluative Remarks</label>
                <input
                  type="text"
                  value={formData.trainer_remarks}
                  onChange={(e) => setFormData({ ...formData, trainer_remarks: e.target.value })}
                  placeholder="e.g. Trainee showed excellent precision with zero measurement defects"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Saving...' : 'Save Day Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mentor Review Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Mentor Observation</h3>
              <button onClick={() => setShowMentorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMentorObservation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualitative Feedback & Pastoral Observation *</label>
                <textarea
                  required
                  rows="4"
                  value={mentorObservation}
                  onChange={(e) => setMentorObservation(e.target.value)}
                  placeholder="Record your observations on student engagement, practical confidence, and behavioural progress..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
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
                  disabled={modalLoading || !mentorObservation}
                  className="px-4 py-2 bg-brand-800 text-white rounded-lg font-semibold"
                >
                  {modalLoading ? 'Saving...' : 'Save Observation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
