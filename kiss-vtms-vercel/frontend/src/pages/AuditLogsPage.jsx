import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, ShieldCheck, User } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs');
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200 mb-1">
          <History className="w-3.5 h-3.5" />
          <span>Security Compliance & Governance</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Mutation Audit Trail</h2>
        <p className="text-xs text-slate-500">
          Immutable audit record of all authentication events, attendance modifications, and certification approvals
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading compliance audit trace...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{log.created_at}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                      {log.user_name || 'System / Anonymous'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-brand-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{log.entity_type}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.ip_address}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate font-sans text-xs">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
