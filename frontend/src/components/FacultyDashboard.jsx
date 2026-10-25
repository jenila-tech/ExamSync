import React, { useEffect, useState } from 'react';

function FacultyDashboard({ user, onLogout }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://examsync-backend-zvqi.onrender.com/faculty/invigilation', {
          headers: {
            'x-user-id': user?.id ? String(user.id) : user?._id ? String(user._id) : '',
            'x-user-role': user?.role ? String(user.role) : '',
          },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch invigilation duties');
        }
        const data = await response.json();
        setAssignments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error in faculty dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 bg-blue-500/30 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 mb-2">
            Faculty Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Faculty Dashboard</h1>
          <p className="text-blue-100 mt-1 text-sm">
            Welcome back, <span className="font-bold text-white">{user?.name || 'Faculty Member'}</span> ({user?.email})
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm shadow-xs"
        >
          <span>🚪</span> Logout
        </button>
      </div>

      {/* Profile & Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            👨‍🏫
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-3">Faculty Profile</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-700">Name:</span> {user?.name || 'Faculty Member'}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Email:</span> {user?.email || 'N/A'}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Designation:</span> Assistant Professor / Invigilator
            </p>
          </div>
        </div>

        {/* Assigned Duties Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4">
              📋
            </div>
            <h3 className="font-bold text-lg text-slate-800">Assigned Duties</h3>
            <p className="text-slate-500 text-sm mt-1">Total invigilation sessions currently assigned.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-3xl font-extrabold text-indigo-600">
              {loading ? '...' : assignments.length}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
              Active Schedule
            </span>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            📌
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Invigilation Guidelines</h3>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Report to the exam cell 20 minutes prior to exam time.</li>
            <li>Verify student ID cards and digital hall tickets.</li>
            <li>Ensure no unauthorized electronic devices in exam hall.</li>
          </ul>
        </div>
      </div>

      {/* Invigilation Duties Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>📝</span> My Invigilation Duties
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Complete schedule of allocated examination venues and supervising timings.
            </p>
          </div>
          {assignments.length > 0 && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>🖨️</span> Print Duties
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
            <p className="text-sm font-medium">Loading invigilation duties...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Error Loading Invigilation Duties</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assignments.length === 0 && (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <span className="text-4xl block">🏖️</span>
            <p className="font-bold text-slate-700 text-base">No Invigilation Duties Assigned</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You currently do not have any invigilation duties assigned for upcoming exams. Please check back later.
            </p>
          </div>
        )}

        {/* Duties Table / List */}
        {!loading && !error && assignments.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Subject / Course</th>
                  <th className="px-4 py-3">Exam Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Venue / Hall</th>
                  <th className="px-4 py-3">Building</th>
                  <th className="px-4 py-3 text-center">Hall Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((ia, index) => (
                  <tr key={ia.exam_id ? `${ia.exam_id}-${index}` : index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {ia.subject_code ? (
                        <div>
                          <span className="inline-block font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs mr-2">
                            {ia.subject_code}
                          </span>
                          <span className="font-semibold">{ia.subject_name || 'Exam'}</span>
                        </div>
                      ) : (
                        <span className="font-semibold">{ia.subject_name || 'General Examination'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {formatDate(ia.exam_date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-mono text-xs font-semibold">
                        {ia.start_time || '--:--'} – {ia.end_time || '--:--'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800">{ia.venue_name || 'TBA'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {ia.building || 'Main Campus'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full text-xs border border-emerald-200">
                        {ia.venue_capacity || 'N/A'} seats
                      </span>
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

export default FacultyDashboard;
