import { useState, useEffect } from "react";

function InvigilationManagement({ user }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [invigilationPlan, setInvigilationPlan] = useState([]);
  const [seatingVenuesCount, setSeatingVenuesCount] = useState(0);
  const [totalFacultyCount, setTotalFacultyCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "admin",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // 1. Fetch available exams and faculty count when user info is ready
  useEffect(() => {
    if (user?.role) {
      fetchExams();
      fetchFacultyCount();
    }
  }, [user]);

  // 2. Fetch invigilation plan & seating venues whenever selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetchInvigilationPlan(selectedExamId);
      fetchSeatingVenues(selectedExamId);
    } else {
      setInvigilationPlan([]);
      setSeatingVenuesCount(0);
      setError("");
      setSuccess("");
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      const res = await fetch("https://examsync-backend-zvqi.onrender.com/exams", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
    }
  };

  const fetchFacultyCount = async () => {
    try {
      const res = await fetch("https://examsync-backend-zvqi.onrender.com/faculty", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTotalFacultyCount(data.length);
      }
    } catch (err) {
      console.error("Error fetching faculty:", err);
    }
  };

  const fetchSeatingVenues = async (examId) => {
    try {
      const res = await fetch(`https://examsync-backend-zvqi.onrender.com/seating/${examId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const uniqueVenues = new Set(data.map((item) => item.venue_id));
        setSeatingVenuesCount(uniqueVenues.size);
      } else {
        setSeatingVenuesCount(0);
      }
    } catch (err) {
      console.error("Error fetching seating plan venues:", err);
      setSeatingVenuesCount(0);
    }
  };

  const fetchInvigilationPlan = async (examId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://examsync-backend-zvqi.onrender.com/invigilation/${examId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInvigilationPlan(data);
      } else {
        setInvigilationPlan([]);
      }
    } catch (err) {
      console.error("Error fetching invigilation plan:", err);
      setError("Failed to load invigilation plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedExamId) {
      setError("Please select an exam first.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("https://examsync-backend-zvqi.onrender.com/invigilation/generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ exam_id: selectedExamId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate invigilation plan.");
      }

      setSuccess(data.message || "Invigilation plan generated successfully!");
      fetchInvigilationPlan(selectedExamId);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = async () => {
    if (!selectedExamId) return;
    if (!window.confirm("Are you sure you want to clear the invigilation plan for this exam?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`https://examsync-backend-zvqi.onrender.com/invigilation/${selectedExamId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to clear invigilation plan.");
      }

      setSuccess(data.message || "Invigilation plan cleared successfully.");
      setInvigilationPlan([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedExam = exams.find((e) => e.id.toString() === selectedExamId.toString());

  const filteredPlan = invigilationPlan.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.faculty_name?.toLowerCase().includes(term) ||
      item.faculty_department?.toLowerCase().includes(term) ||
      item.venue_name?.toLowerCase().includes(term) ||
      item.building?.toLowerCase().includes(term) ||
      item.subject_code?.toLowerCase().includes(term) ||
      item.subject_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
              Admin Exclusive
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1 tracking-tight">Automatic Invigilation Generation</h2>
          <p className="text-slate-400 text-xs mt-1">
            Automatically assign available faculty members to exam venues without double-booking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {invigilationPlan.length > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🗑️</span> Clear Plan
            </button>
          )}

          <button
            onClick={handleGenerate}
            disabled={!selectedExamId || generating}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              !selectedExamId || generating
                ? "bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600"
                : "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30 active:scale-95"
            }`}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>{invigilationPlan.length > 0 ? "Regenerate Invigilation Plan" : "Generate Invigilation Plan"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="font-semibold">{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Selector & Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Exam Selection Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <label className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
            Select Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose Exam --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.subject_code} - {exam.subject_name} ({exam.exam_date})
              </option>
            ))}
          </select>
          {selectedExam && (
            <div className="mt-3 p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 font-medium">
              📅 <strong>Date:</strong> {selectedExam.exam_date} | ⏰ <strong>Time:</strong> {selectedExam.start_time} - {selectedExam.end_time}
            </div>
          )}
        </div>

        {/* Required Venues Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Venues Needing Invigilators
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {selectedExamId ? seatingVenuesCount : "--"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {seatingVenuesCount === 0 && selectedExamId
                ? "No seating plan generated yet"
                : "Active halls from seating plan"}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            🏛️
          </div>
        </div>

        {/* Available Faculty Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Available Faculty Pool
            </div>
            <div className="text-3xl font-black text-indigo-600 mt-1">
              {totalFacultyCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {selectedExamId && seatingVenuesCount > totalFacultyCount ? (
                <span className="text-red-600 font-bold">⚠️ Insufficient Faculty</span>
              ) : (
                "Total registered faculty"
              )}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
            👨‍🏫
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📋</span> Invigilation Roster
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned faculty members to exam venues
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search faculty, venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-semibold text-sm">
            Loading invigilation plan...
          </div>
        ) : !selectedExamId ? (
          <div className="py-16 text-center text-slate-400">
            <span className="text-4xl block mb-2">👈</span>
            <p className="font-bold text-slate-600">Please select an examination above</p>
            <p className="text-xs text-slate-400 mt-1">Select an exam to view or generate its invigilation roster.</p>
          </div>
        ) : invigilationPlan.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <span className="text-4xl block mb-2">🕵️</span>
            <p className="font-bold text-slate-600">No Invigilation Plan Generated Yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Click &quot;Generate Invigilation Plan&quot; to assign faculty members to exam venues.
            </p>
          </div>
        ) : filteredPlan.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            No invigilation assignments match your search term &quot;{searchTerm}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-xs tracking-wider">
                  <th className="py-3.5 px-6">Faculty Name</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Exam</th>
                  <th className="py-3.5 px-6">Venue</th>
                  <th className="py-3.5 px-6">Building</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlan.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200">
                        {item.faculty_name ? item.faculty_name.charAt(0) : "F"}
                      </div>
                      <span>{item.faculty_name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs">
                        {item.faculty_department}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-bold text-slate-900">
                          {item.subject_code} - {item.subject_name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          📅 {item.exam_date} | ⏰ {item.start_time} - {item.end_time}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/60 text-xs">
                        {item.venue_name}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600">
                      {item.building || "Main Campus"}
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

export default InvigilationManagement;
