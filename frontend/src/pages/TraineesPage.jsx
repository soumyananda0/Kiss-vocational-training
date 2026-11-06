import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users, UserPlus, Search, Filter, Eye, Award, CheckCircle2,
  AlertCircle, X, ChevronRight, BookOpen
} from 'lucide-react';

export default function TraineesPage() {
  const { hasRole } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [trades, setTrades] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  // Register Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    registration_no: '',
    dob: '2007-05-15',
    gender: 'Female',
    blood_group: 'O+',
    tribal_community: 'Santhal',
    class_grade: 'Grade 11 (Vocational)',
    department_id: 1,
    district: 'Mayurbhanj',
    state: 'Odisha',
    address: 'KISS Residential Campus, Block 4',
    guardian_name: '',
    guardian_phone: '',
    batch_id: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchData();
  }, [search, selectedTrade, selectedBatch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedTrade) params.trade_id = selectedTrade;
      if (selectedBatch) params.batch_id = selectedBatch;

      const [resTrainees, resTrades, resBatches] = await Promise.all([
        api.get('/trainees', { params }),
        api.get('/trades'),
        api.get('/batches')
      ]);

      if (resTrainees.success) setTrainees(resTrainees.data);
      if (resTrades.success) setTrades(resTrades.data);
      if (resBatches.success) setBatches(resBatches.data);
    } catch (err) {
      console.error('Error fetching trainees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const res = await api.post('/trainees', formData);
      if (res.success) {
        setShowModal(false);
        fetchData();
        // Reset form
        setFormData({
          full_name: '', email: '', registration_no: '', dob: '2007-05-15',
          gender: 'Female', blood_group: 'O+', tribal_community: 'Santhal',
          class_grade: 'Grade 11 (Vocational)', department_id: 1, district: 'Mayurbhanj',
          state: 'Odisha', address: 'KISS Residential Campus, Block 4',
          guardian_name: '', guardian_phone: '', batch_id: ''
        });
      }
    } catch (err) {
      setModalError(err.message || 'Registration failed');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Trainee Management Directory</h2>
          <p className="text-xs text-slate-500">
            Enrolment records, tribal community context, and complete vocational journeys
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator']) && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Trainee</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, registration ID, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-brand-800 focus:border-brand-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Trades</option>
            {trades.map((tr) => (
              <option key={tr.id} value={tr.id}>{tr.name}</option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trainees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading trainee directory...</div>
        ) : trainees.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No trainees match the search filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Trainee / Student</th>
                  <th className="py-3 px-4">Reg. ID</th>
                  <th className="py-3 px-4">Tribal Community</th>
                  <th className="py-3 px-4">Vocational Trade</th>
                  <th className="py-3 px-4">Cohort Batch</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainees.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{t.full_name}</div>
                      <div className="text-[11px] text-slate-400">{t.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-brand-800">
                      {t.registration_no}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {t.tribal_community || 'Native Odisha'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {t.trade_name || 'Tailoring & Apparel'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.batch_name || 'Apparel Tech Cohort 2026-A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.class_grade}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/trainees/${t.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Portfolio</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New KISS Trainee</h3>
                <p className="text-xs text-slate-500">Record demographic details, community context, and cohort allocation</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Sita Majhi"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. sita.majhi@student.kiss.ac.in"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unique Trainee Registration ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.registration_no}
                    onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                    placeholder="e.g. KISS-VT-2026-004"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tribal Community / Heritage</label>
                  <input
                    type="text"
                    value={formData.tribal_community}
                    onChange={(e) => setFormData({ ...formData, tribal_community: e.target.value })}
                    placeholder="e.g. Santhal, Ho, Bonda, Munda"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Academic Grade / Level *</label>
                  <input
                    type="text"
                    required
                    value={formData.class_grade}
                    onChange={(e) => setFormData({ ...formData, class_grade: e.target.value })}
                    placeholder="e.g. Grade 11 (Vocational)"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Batch Enrolment</label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">Select Training Batch (Optional)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.programme_title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    placeholder="e.g. Ramu Majhi"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Phone Contact</label>
                  <input
                    type="tel"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                    placeholder="e.g. +91 9438112233"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg font-semibold shadow-xs"
                >
                  {modalLoading ? 'Registering...' : 'Complete Trainee Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
