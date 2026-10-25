import React, { useEffect, useState } from 'react';

function StudentDashboard({ user, onLogout }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [seating, setSeating] = useState([]);
  const [seatingLoading, setSeatingLoading] = useState(true);
  const [seatingError, setSeatingError] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch('https://examsync-backend-zvqi.onrender.com/student-exams', {
          headers: {
            'x-user-id': user?.id ? String(user.id) : (user?._id ? String(user._id) : ''),
            'x-user-role': user?.role ? String(user.role) : '',
          },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch exams');
        }
        const data = await response.json();
        setExams(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [user]);

  useEffect(() => {
    const fetchSeating = async () => {
      try {
        const response = await fetch('https://examsync-backend-zvqi.onrender.com/student-exams/seating', {
          headers: {
            'x-user-id': user?.id ? String(user.id) : (user?._id ? String(user._id) : ''),
            'x-user-role': user?.role ? String(user.role) : '',
          },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch seating arrangement');
        }
        const data = await response.json();
        setSeating(data);
      } catch (err) {
        setSeatingError(err.message);
      } finally {
        setSeatingLoading(false);
      }
    };
    fetchSeating();
  }, [user]);

  const [showHallTicketModal, setShowHallTicketModal] = useState(false);

  // Derive student information from available data
  const studentName = seating[0]?.student_name || user?.name || 'Student User';
  const registerNumber = seating[0]?.register_number || user?.register_number || '310624104130';
  const department = exams.find((e) => e.department)?.department || user?.department || 'ECE';
  const year = user?.year || 3;
  const section = user?.section || 'C';

  // Cross-reference scheduled exams with seating assignments
  const hallTicketExams = exams.length > 0
    ? exams.map((exam) => {
        const match = seating.find(
          (s) => String(s.exam_id) === String(exam.exam_id || exam.id)
        );
        return {
          id: exam.exam_id || exam.id,
          subject_code: exam.subject_code,
          subject_name: exam.subject_name,
          exam_date: exam.exam_date,
          start_time: exam.start_time,
          end_time: exam.end_time,
          venue_name: match?.venue_name || null,
          building: match?.building || null,
          seat_number: match?.seat_number || null,
          isAllocated: !!match,
        };
      })
    : seating.map((s) => ({
        id: s.assignment_id || s.exam_id,
        subject_code: s.subject_code,
        subject_name: s.subject_name,
        exam_date: s.exam_date,
        start_time: s.start_time,
        end_time: s.end_time,
        venue_name: s.venue_name,
        building: s.building,
        seat_number: s.seat_number,
        isAllocated: true,
      }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-800 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 bg-emerald-500/30 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-2">
            Student Portal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Student Dashboard</h1>
          <p className="text-emerald-200 mt-1 text-sm">
            Welcome back, <span className="font-bold text-white">{user?.name}</span> ({user?.email})
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm"
        >
          <span>🚪</span> Logout
        </button>
      </div>

      {/* Placeholder Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            🪑
          </div>
          <h3 className="font-bold text-lg text-slate-800">My Seating Arrangement</h3>
          <p className="text-slate-500 text-sm mt-2">
            Check your allocated exam hall, bench number, and seat position.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            {seatingLoading ? (
              <p className="text-slate-600">Loading seating...</p>
            ) : seatingError ? (
              <p className="text-red-600">Error: {seatingError}</p>
            ) : seating.length === 0 ? (
              <p className="text-slate-600">No seating allocated yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Date & Time</th>
                      <th className="px-4 py-2">Venue / Hall</th>
                      <th className="px-4 py-2">Seat No</th>
                      <th className="px-4 py-2">Register No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seating.map((seat) => (
                      <tr key={seat.assignment_id || seat.exam_id} className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {seat.subject_code ? `${seat.subject_code} - ` : ''}{seat.subject_name}
                        </td>
                        <td className="px-4 py-2">
                          <div>{seat.exam_date}</div>
                          <div className="text-xs text-gray-400">{seat.start_time} - {seat.end_time}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="font-medium text-gray-800">{seat.venue_name}</div>
                          {seat.building && <div className="text-xs text-gray-400">{seat.building}</div>}
                        </td>
                        <td className="px-4 py-2 font-bold text-teal-600">
                          #{seat.seat_number}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {seat.register_number}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Hall Ticket Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl mb-4">
              🎟️
            </div>
            <h3 className="font-bold text-lg text-slate-800">Hall Ticket</h3>
            <p className="text-slate-500 text-sm mt-2">
              View and download your digital hall ticket for upcoming semester examinations.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowHallTicketModal(true)}
              disabled={loading || (exams.length === 0 && seating.length === 0)}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🎟️</span> View Digital Hall Ticket
            </button>
          </div>
        </div>

        {/* Exam Timetable */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            📅
          </div>
          <h3 className="font-bold text-lg text-slate-800">Exam Timetable</h3>
          <p className="text-slate-500 text-sm mt-2">
            Review course exam schedules, timings, and department notices.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100">
            {loading ? (
              <p className="text-slate-600">Loading exams...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : exams.length === 0 ? (
              <p className="text-slate-600">No exams scheduled</p>
            ) : (
              <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Subject</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Start</th>
                    <th className="px-4 py-2">End</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.exam_id || exam.id} className="border-b">
                      <td className="px-4 py-2 font-medium text-gray-900">{exam.subject_name || exam.subject_code}</td>
                      <td className="px-4 py-2">{exam.exam_date}</td>
                      <td className="px-4 py-2">{exam.start_time}</td>
                      <td className="px-4 py-2">{exam.end_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Digital Hall Ticket Modal */}
      {showHallTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Print specific stylesheet */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-hall-ticket, #printable-hall-ticket * {
                visibility: visible;
              }
              #printable-hall-ticket {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 16px;
                border: 2px solid #0f172a !important;
                box-shadow: none !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 my-8 max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎟️</span>
                <span className="font-extrabold text-slate-800 text-lg">Digital Hall Ticket</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span> Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowHallTicketModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Hall Ticket Document */}
            <div id="printable-hall-ticket" className="bg-white p-6 sm:p-8 rounded-xl border-2 border-slate-800 text-slate-800 space-y-6">
              {/* Institution Header */}
              <div className="text-center pb-4 border-b-2 border-slate-800">
                <div className="text-2xl font-black uppercase tracking-wider text-slate-900">
                  College of Engineering & Technology
                </div>
                <div className="text-xs uppercase tracking-widest text-slate-600 font-semibold mt-0.5">
                  Office of the Controller of Examinations
                </div>
                <div className="inline-block px-3 py-0.5 bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-widest rounded mt-2">
                  Official Digital Examination Hall Ticket
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  Semester End Examinations — Academic Session 2026
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-300 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Candidate Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{studentName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Register Number</span>
                  <span className="font-mono font-extrabold text-indigo-700 text-sm">{registerNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Department</span>
                  <span className="font-bold text-slate-800">{department}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Year & Section</span>
                  <span className="font-bold text-slate-800">Year {year} • Sec {section}</span>
                </div>
              </div>

              {/* Scheduled Exams & Seating Allocation Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Authorized Examination Schedule & Seating</span>
                  <span className="text-[11px] font-normal text-slate-500">{hallTicketExams.length} Courses</span>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Venue / Building</th>
                        <th className="py-2.5 px-3 text-center">Seat Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {hallTicketExams.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-slate-500">
                            No scheduled examinations found for this student.
                          </td>
                        </tr>
                      ) : (
                        hallTicketExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              <span className="font-mono font-bold text-indigo-700 mr-1.5">{exam.subject_code}</span>
                              {exam.subject_name}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-800">{exam.exam_date}</div>
                              <div className="text-[11px] text-slate-500">{exam.start_time} - {exam.end_time}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              {exam.isAllocated ? (
                                <div>
                                  <span className="font-bold text-slate-800">{exam.venue_name}</span>
                                  {exam.building && <span className="text-slate-500 ml-1">({exam.building})</span>}
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-semibold rounded border border-amber-200">
                                  Pending Allocation
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {exam.isAllocated ? (
                                <span className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-800 font-mono font-extrabold rounded border border-teal-200">
                                  #{exam.seat_number}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions for Candidates */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-1.5 text-xs text-slate-700">
                <div className="font-bold uppercase tracking-wider text-[11px] text-slate-900 flex items-center gap-1.5">
                  <span>📌</span> Instructions for Candidates:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li>Candidates must carry this printed Digital Hall Ticket along with their official College ID card to every exam.</li>
                  <li>Report to the assigned examination hall at least 15 minutes prior to the commencement of the exam.</li>
                  <li>Mobile phones, smartwatches, programmable calculators, and any unauthorized notes/materials are strictly prohibited.</li>
                  <li>No candidate will be allowed to enter the examination hall 30 minutes after the exam has commenced.</li>
                  <li>Candidates must occupy only their assigned seat number and maintain strict silence during the examination.</li>
                </ul>
              </div>

              {/* Signature Blocks */}
              <div className="pt-8 flex items-end justify-between text-xs text-slate-700">
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1"></div>
                  <span className="font-semibold text-[11px]">Candidate's Signature</span>
                </div>
                <div className="text-center">
                  <div className="text-xs font-mono font-bold text-slate-800 mb-1">SEAL & VERIFIED</div>
                  <div className="w-48 border-b border-slate-400 mb-1"></div>
                  <span className="font-semibold text-[11px]">Controller of Examinations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
