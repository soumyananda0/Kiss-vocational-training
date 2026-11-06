import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookOpen, Plus, Clock, Award, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';

export default function ProgrammesPage() {
  const { hasRole } = useAuth();
  const [programmes, setProgrammes] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    programme_code: '',
    title: '',
    trade_id: 1,
    description: '',
    objectives: '',
    scope: '',
    expected_outcomes: '',
    duration_weeks: 12,
    total_training_hours: 180,
    min_attendance_pct: 75.0,
    min_pass_pct: 50.0
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      const [resProg, resTrades] = await Promise.all([
        api.get('/programmes'),
        api.get('/trades')
      ]);
      if (resProg.success) setProgrammes(resProg.data);
      if (resTrades.success) setTrades(resTrades.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      const res = await api.post('/programmes', formData);
      if (res.success) {
        setShowModal(false);
        fetchProgrammes();
      }
    } catch (err) {
      setError(err.message || 'Failed to create programme');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Training Programmes & Curricula</h2>
          <p className="text-xs text-slate-500">
            Modular learning objectives, duration hours, and certification passing criteria
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator']) && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Programme</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading training programmes...</div>
      ) : (
        <div className="space-y-4">
          {programmes.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-800 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded font-mono">
                      {p.programme_code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Trade: {p.trade_name}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-600 max-w-3xl pt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 self-start">
                  <div className="text-center px-2">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Duration</div>
                    <div className="text-sm font-bold text-slate-900">{p.duration_weeks} Wks</div>
                  </div>
                  <div className="text-center border-l pl-4 border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Hours</div>
                    <div className="text-sm font-bold text-brand-800">{p.total_training_hours} Hrs</div>
                  </div>
                  <div className="text-center border-l pl-4 border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Min Att %</div>
                    <div className="text-sm font-bold text-emerald-600">{p.min_attendance_pct}%</div>
                  </div>
                </div>
              </div>

              {/* Objectives & Scope Accordion */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <strong className="text-slate-800 block mb-1">Objectives & Competency Goals:</strong>
                  <p className="text-slate-600 whitespace-pre-line leading-relaxed">{p.objectives}</p>
                </div>
                <div>
                  <strong className="text-slate-800 block mb-1">Scope & Expected Learning Outcomes:</strong>
                  <p className="text-slate-600 leading-relaxed">{p.scope || p.expected_outcomes}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Methodology: {p.methodology || 'Classroom + Workshop'}</span>
                <span className="font-semibold text-slate-700">{p.batch_count || 1} Cohort Batches Scheduled</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Create Vocational Training Programme</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Programme Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.programme_code}
                    onChange={(e) => setFormData({ ...formData, programme_code: e.target.value })}
                    placeholder="e.g. PRG-COMP-2026"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vocational Trade *</label>
                  <select
                    value={formData.trade_id}
                    onChange={(e) => setFormData({ ...formData, trade_id: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {trades.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Programme Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Advanced Digital Office Skills & Financial Literacy"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed overview of this vocational programme..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Objectives & Competency Goals *</label>
                  <textarea
                    required
                    rows="2"
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    placeholder="Key objectives..."
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Weeks) *</label>
                  <input
                    type="number"
                    required
                    value={formData.duration_weeks}
                    onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Training Hours *</label>
                  <input
                    type="number"
                    required
                    value={formData.total_training_hours}
                    onChange={(e) => setFormData({ ...formData, total_training_hours: parseInt(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
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
                  {modalLoading ? 'Creating...' : 'Save Programme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
