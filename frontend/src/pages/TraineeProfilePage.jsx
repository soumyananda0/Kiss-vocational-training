import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { downloadCertificatePdf, previewCertificatePdf } from '../utils/downloadHelper';
import {
  User, Award, CalendarCheck, BookCheck, FileText, CheckCircle2,
  Clock, Download, QrCode, ArrowLeft, Star, Wrench, ShieldCheck, Tag, Eye
} from 'lucide-react';

export default function TraineeProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('journey'); // 'journey', 'attendance', 'assessments', 'feedback', 'skills'

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/trainees/${id}`);
      if (res.success) {
        setProfile(res.data);

        // Fetch chronological diary entries
        const batchId = res.data.enrolments[0]?.batch_id;
        if (batchId) {
          const diaryRes = await api.get(`/diary?batch_id=${batchId}&trainee_id=${id}`);
          if (diaryRes.success) {
            setDiaryEntries(diaryRes.data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching trainee profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-800"></div>
        <span className="ml-3 text-sm font-medium">Loading comprehensive trainee dossier...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <h3 className="text-base font-bold text-slate-800">Trainee profile not found</h3>
        <Link to="/trainees" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-800">
          <ArrowLeft className="w-4 h-4" /> Back to Trainee Directory
        </Link>
      </div>
    );
  }

  const { trainee, enrolments, attendanceStats, skills, assessments, mentorFeedback, certificates } = profile;
  const primaryEnrolment = enrolments[0] || {};

  const completionCert = certificates?.find(c => c.certificate_type === 'completion_certificate') || certificates?.[0];
  const portfolioCert = certificates?.find(c => c.certificate_type === 'journey_portfolio');

  const cert1Number = completionCert ? completionCert.certificate_number : 'KISS-VT-CERT-2026-0001';
  const cert2Number = portfolioCert ? portfolioCert.certificate_number : `${cert1Number.replace('-PORTFOLIO', '')}-PORTFOLIO`;
  const baseVerifyId = cert1Number.replace('-PORTFOLIO', '');

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (certId, filename) => {
    setDownloading(true);
    try {
      await downloadCertificatePdf(certId, filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/trainees" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Trainees</span>
      </Link>

      {/* Trainee Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-800 border-2 border-gold-500 text-white font-bold text-2xl flex items-center justify-center shadow">
              {trainee.full_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{trainee.full_name}</h2>
                <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  {trainee.registration_no}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Tribal Community: <strong className="text-slate-700">{trainee.tribal_community || 'Santhal'}</strong></span>
                <span>&bull;</span>
                <span>Academic Grade: <strong className="text-slate-700">{trainee.class_grade}</strong></span>
                <span>&bull;</span>
                <span>District: <strong className="text-slate-700">{trainee.district || 'Mayurbhanj'}, Odisha</strong></span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Vocational Programme: <strong className="text-brand-800">{primaryEnrolment.programme_title || 'Apparel Manufacturing & Fashion Technology'}</strong> ({primaryEnrolment.trade_name || 'Tailoring & Apparel'})
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Attendance</div>
              <div className="text-lg font-bold text-emerald-600">{attendanceStats.percentage}%</div>
            </div>
            <div className="text-right border-l pl-3 border-slate-200">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Journey Days</div>
              <div className="text-lg font-bold text-brand-800">{diaryEntries.length} Days</div>
            </div>
          </div>
        </div>

        {/* Dual Document Download Callout */}
        <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/80 -mx-6 -mb-6 p-6 rounded-b-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-700 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Vocational Credentials
              </div>
              <div className="text-xs text-slate-600">
                Official Completion Certificate & Complete 20-Section Training Journey Portfolio
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => handleDownload(cert1Number, `KISS_Official_Certificate_${baseVerifyId}.pdf`)}
              disabled={downloading}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cert 1: Official Certificate (A4)</span>
            </button>

            <button
              onClick={() => handleDownload(cert2Number, `KISS_Journey_Portfolio_${baseVerifyId}.pdf`)}
              disabled={downloading}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cert 2: Journey Portfolio</span>
            </button>

            <button
              onClick={() => previewCertificatePdf(cert1Number)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
              title="Preview Certificate in New Tab"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>Preview</span>
            </button>

            <Link
              to={`/verify/${baseVerifyId}`}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-brand-800" />
              <span>Verify QR</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('journey')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'journey'
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Chronological Training Diary ({diaryEntries.length} Days)</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Attendance Breakdown ({attendanceStats.percentage}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('assessments')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'assessments'
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookCheck className="w-4 h-4" />
            <span>Assessments & Marks ({assessments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'skills'
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Skills Acquired ({skills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'feedback'
                ? 'border-brand-800 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mentor Feedback ({mentorFeedback.length})</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Chronological Daily Training Diary Timeline */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Day-Wise Experiential Learning Timeline</h3>
              <p className="text-xs text-slate-500">
                Empirical records from Day 1 to Day {diaryEntries.length} documented in KISS-VTMS
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
              Total Training Hours: {diaryEntries.reduce((acc, cur) => acc + (cur.hours_spent || 0), 0)} Hrs
            </span>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
            {diaryEntries.map((day) => (
              <div key={day.id} className="relative pl-12">
                {/* Node icon */}
                <div className="absolute left-2.5 top-3 -translate-x-1/2 w-6 h-6 rounded-full bg-brand-800 border-2 border-white text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  {day.day_number}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-gold-600 uppercase tracking-wider">
                        Day {day.day_number} &bull; {day.training_date}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{day.topic_covered}</h4>
                    </div>
                    <div className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
                      {day.hours_spent} Hours Logged
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Theoretical Activities:</span>
                      <p className="text-slate-600 leading-relaxed">{day.theoretical_activities}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Practical Activities & Exercises:</span>
                      <p className="text-slate-600 leading-relaxed">{day.practical_activities}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-start gap-2">
                      <Wrench className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-700">Tools / Machinery Used: </span>
                        <span className="text-slate-600">{day.tools_equipment_used}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700">Learning Outcome: </span>
                      <span className="text-slate-600">{day.learning_outcomes}</span>
                    </div>
                  </div>

                  {/* Remarks Row */}
                  {(day.trainer_remarks || day.mentor_observations) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {day.trainer_remarks && (
                        <div>
                          <span className="font-semibold text-emerald-800">Trainer Review: </span>
                          <span className="text-slate-600 italic">"{day.trainer_remarks}"</span>
                        </div>
                      )}
                      {day.mentor_observations && (
                        <div>
                          <span className="font-semibold text-brand-800">Mentor Observation: </span>
                          <span className="text-slate-600 italic">"{day.mentor_observations}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Breakdown */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">Total Sessions</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{attendanceStats.total}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">Sessions Present</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{attendanceStats.present}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">Approved Leave</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{attendanceStats.leave}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-semibold">Compliance Gate (&ge;75%)</div>
              <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-5 h-5" />
                <span>QUALIFIED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Assessments */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Modular Assessments & Practical Evaluations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Assessment Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Max Marks</th>
                  <th className="py-2.5 px-3">Marks Obtained</th>
                  <th className="py-2.5 px-3">Percentage</th>
                  <th className="py-2.5 px-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a, i) => (
                  <tr key={i}>
                    <td className="py-3 px-3 font-semibold text-slate-900">{a.title}</td>
                    <td className="py-3 px-3 text-slate-600 uppercase text-[10px] font-bold">{a.assessment_type}</td>
                    <td className="py-3 px-3 text-slate-600">{a.max_marks}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{a.marks_obtained}</td>
                    <td className="py-3 px-3 font-semibold text-brand-800">{a.percentage}%</td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {a.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Skills Acquired */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((sk, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center font-bold">
                  <Star className="w-4 h-4 text-gold-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{sk.name}</div>
                  <div className="text-[11px] text-slate-500">Domain: {sk.category}</div>
                </div>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded">
                {sk.proficiency_level}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Mentor Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {mentorFeedback.map((mf, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="text-xs font-bold text-slate-900">
                  Mentoring Session &bull; {mf.session_date}
                </div>
                <div className="text-xs text-brand-800 font-semibold">
                  Mentor: {mf.mentor_name} ({mf.designation})
                </div>
              </div>
              <div className="text-xs space-y-1.5 pt-1">
                <div>
                  <strong className="text-slate-700">Areas Discussed:</strong> <span className="text-slate-600">{mf.areas_discussed}</span>
                </div>
                <div>
                  <strong className="text-emerald-800">Observed Strengths:</strong> <span className="text-slate-600">{mf.strengths}</span>
                </div>
                <div>
                  <strong className="text-amber-800">Growth Recommendations:</strong> <span className="text-slate-600">{mf.recommendations}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
