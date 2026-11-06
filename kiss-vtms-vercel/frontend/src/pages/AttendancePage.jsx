import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CalendarCheck, CheckCircle2, XCircle, Clock, AlertTriangle, Save, Filter, AlertCircle } from 'lucide-react';

export default function AttendancePage() {
  const { hasRole } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [lowAttendanceList, setLowAttendanceList] = useState([]);

  useEffect(() => {
    fetchBatches();
    fetchLowAttendance();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchAttendance();
    }
  }, [selectedBatch, selectedDate]);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      if (res.success && res.data.length > 0) {
        setBatches(res.data);
        setSelectedBatch(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/batch/${selectedBatch}?date=${selectedDate}`);
      if (res.success) {
        // Map records with default status if not recorded yet
        const records = (res.data.trainees || []).map((t) => ({
          trainee_id: t.trainee_id,
          registration_no: t.registration_no,
          full_name: t.full_name,
          status: t.status || 'present',
          remarks: t.remarks || ''
        }));
        setAttendanceRecords(records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowAttendance = async () => {
    try {
      const res = await api.get('/attendance/report/low-attendance');
      if (res.success) setLowAttendanceList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (traineeId, status) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.trainee_id === traineeId ? { ...rec, status } : rec))
    );
  };

  const handleRemarksChange = (traineeId, remarks) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.trainee_id === traineeId ? { ...rec, remarks } : rec))
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSuccessMessage('');
    try {
      const payload = {
        batch_id: selectedBatch,
        session_date: selectedDate,
        session_number: 1,
        records: attendanceRecords.map((r) => ({
          trainee_id: r.trainee_id,
          status: r.status,
          remarks: r.remarks
        }))
      };

      const res = await api.post('/attendance/mark', payload);
      if (res.success) {
        setSuccessMessage(`Attendance successfully recorded for ${selectedDate}.`);
        fetchAttendance();
        fetchLowAttendance();
      }
    } catch (err) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vocational Attendance Registry</h2>
          <p className="text-xs text-slate-500">
            Session-level tracking, percentage calculation, and 75% institutional compliance monitoring
          </p>
        </div>

        {hasRole(['super_admin', 'coordinator', 'trainer']) && (
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || attendanceRecords.length === 0}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Recording...' : 'Submit Session Attendance'}</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Low Attendance Alert Banner if any */}
      {lowAttendanceList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900">Low Attendance Notice (&lt;75% Threshold)</h4>
            <p className="text-amber-800 mt-0.5">
              {lowAttendanceList.length} trainee(s) currently fall below the required 75% attendance threshold for certificate qualification.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowAttendanceList.map((t) => (
                <span key={t.id} className="bg-white border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {t.full_name} ({t.attendancePct}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Batch & Date Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Training Batch / Cohort
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.programme_title})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Training Session Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium"
          />
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Enrolled Trainees in Session ({attendanceRecords.length})
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Leave</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading session attendance...</div>
        ) : attendanceRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No trainees enrolled in this batch.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Trainee / Student</th>
                  <th className="py-3 px-4">Registration ID</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Session Remarks / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRecords.map((rec) => (
                  <tr key={rec.trainee_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rec.full_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {rec.registration_no}
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rec.trainee_id, 'present')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            rec.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rec.trainee_id, 'absent')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            rec.status === 'absent'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rec.trainee_id, 'leave')}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            rec.status === 'leave'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={rec.remarks}
                        onChange={(e) => handleRemarksChange(rec.trainee_id, e.target.value)}
                        placeholder="e.g. Arrived on time, active engagement"
                        className="w-full text-xs border border-slate-200 rounded px-2.5 py-1 focus:ring-brand-800 focus:border-brand-800"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
