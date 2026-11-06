import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Layers, Plus, Wrench, CheckCircle2, AlertCircle, X, BookOpen, ShieldCheck } from 'lucide-react';

export default function TradesPage() {
  const { hasRole } = useAuth();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    trade_code: '',
    name: '',
    category: 'Textile & Apparel',
    description: '',
    skills_covered: '',
    required_equipment: '',
    training_level: 'National Skills Level 4'
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trades');
      if (res.success) setTrades(res.data);
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
      const res = await api.post('/trades', formData);
      if (res.success) {
        setShowModal(false);
        fetchTrades();
        setFormData({
          trade_code: '', name: '', category: 'Textile & Apparel',
          description: '', skills_covered: '', required_equipment: '',
          training_level: 'National Skills Level 4'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to save trade');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vocational Trade Domains</h2>
          <p className="text-xs text-slate-500">
            Vocational competencies, workshop machinery, and skill certification levels at KISS
          </p>
        </div>

        {hasRole(['super_admin']) && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vocational Trade</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading vocational trades...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trades.map((tr) => (
            <div key={tr.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded">
                    {tr.trade_code}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {tr.status ? tr.status.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{tr.name}</h3>
                <span className="text-xs text-slate-400 font-medium block mt-0.5">{tr.category}</span>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {tr.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div>
                    <strong className="text-slate-700 block text-[11px] uppercase tracking-wider">Skills Covered:</strong>
                    <span className="text-slate-600">{tr.skills_covered || 'Core trade skills'}</span>
                  </div>

                  <div>
                    <strong className="text-slate-700 block text-[11px] uppercase tracking-wider">Required Machinery / Equipment:</strong>
                    <span className="text-slate-600">{tr.required_equipment || 'Workshop tools'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded">
                  {tr.training_level || 'National Skills Level 4'}
                </span>
                <span className="text-slate-500 font-medium">
                  {tr.enrolled_count || 1} Enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Trade Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Vocational Trade</h3>
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Code *</label>
                <input
                  type="text"
                  required
                  value={formData.trade_code}
                  onChange={(e) => setFormData({ ...formData, trade_code: e.target.value })}
                  placeholder="e.g. TRD-AUTO"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trade Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Automotive Diagnostics & Electric Vehicles"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Mechanical & Renewable"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description of the vocational domain..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Equipment</label>
                <input
                  type="text"
                  value={formData.required_equipment}
                  onChange={(e) => setFormData({ ...formData, required_equipment: e.target.value })}
                  placeholder="e.g. Digital Scanners, Hydraulic Jacks"
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
                  {modalLoading ? 'Saving...' : 'Save Trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
