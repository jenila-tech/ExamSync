import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/seating";
const EXAMS_API_URL = "http://localhost:5000/exams";
const STUDENTS_API_URL = "http://localhost:5000/students";
const VENUES_API_URL = "http://localhost:5000/venues";
const STUDENT_SUBJECTS_API_URL = "http://localhost:5000/student-subjects";

export default function SeatingManagement({ user }) {
  // Check authorization
  const isAdmin = user?.role === "admin";

  const [examsList, setExamsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [venuesList, setVenuesList] = useState([]);
  const [mappingsList, setMappingsList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [seatingAssignments, setSeatingAssignments] = useState([]);

  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSeating, setLoadingSeating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation Modals
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Helper for auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // Load initial data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchInitialData();
    }
  }, [isAdmin]);

  // Load seating assignments when selectedExamId changes
  useEffect(() => {
    if (selectedExamId) {
      fetchSeatingForExam(selectedExamId);
    } else {
      setSeatingAssignments([]);
    }
  }, [selectedExamId]);

  // Clear toast notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch exams, students, venues, and student-subject mappings
  const fetchInitialData = async () => {
    setLoadingExams(true);
    try {
      const [examsRes, studentsRes, venuesRes, mappingsRes] = await Promise.all([
        fetch(EXAMS_API_URL, { headers: getAuthHeaders() }),
        fetch(STUDENTS_API_URL, { headers: getAuthHeaders() }),
        fetch(VENUES_API_URL, { headers: getAuthHeaders() }),
        fetch(STUDENT_SUBJECTS_API_URL, { headers: getAuthHeaders() }),
      ]);

      const examsData = await examsRes.json();
      const studentsData = await studentsRes.json();
      const venuesData = await venuesRes.json();
      const mappingsData = await mappingsRes.json();

      if (examsRes.ok) setExamsList(examsData);
      if (studentsRes.ok) setStudentsList(studentsData);
      if (venuesRes.ok) setVenuesList(venuesData);
      if (mappingsRes.ok) setMappingsList(mappingsData);
    } catch (err) {
      console.error("Error fetching seating initial data:", err);
      setError("Failed to load initial data from server.");
    } finally {
      setLoadingExams(false);
    }
  };

  // GET /seating/:examId
  const fetchSeatingForExam = async (examId) => {
    setLoadingSeating(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/${examId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch seating assignments");
      }

      setSeatingAssignments(data);
    } catch (err) {
      console.error("Fetch seating error:", err);
      setError(err.message || "Failed to fetch seating plan.");
    } finally {
      setLoadingSeating(false);
    }
  };

  // Trigger POST /seating/generate
  const handleGenerateSeating = async () => {
    if (!selectedExamId) {
      setError("Please select an exam.");
      return;
    }

    setShowRegenerateModal(false);
    setError("");
    setSuccess("");
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ exam_id: selectedExamId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate seating plan");
      }

      setSuccess(data.message || "Seating plan generated successfully!");
      fetchSeatingForExam(selectedExamId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger DELETE /seating/:examId
  const handleClearSeating = async () => {
    if (!selectedExamId) return;

    setShowClearModal(false);
    setError("");
    setSuccess("");
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${selectedExamId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear seating plan");
      }

      setSuccess(data.message || "Seating plan cleared successfully.");
      setSeatingAssignments([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Non-Admin access block
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-sm text-red-700">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🚫</span>
          <div>
            <h3 className="font-bold text-lg">Access Denied</h3>
            <p className="text-sm mt-1">
              You do not have permission to access Seating Generation. Only System Administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Selected Exam Details
  const selectedExam = examsList.find((e) => (e._id || e.id) === selectedExamId);

  // Filter students mapped to the selected exam's subject
  const mappedStudentsForSubject = selectedExam
    ? mappingsList.filter((m) => m.subject_id === selectedExam.subject_id)
    : [];

  // Capacity calculations (based on mapped students for selected exam)
  const totalStudents = selectedExamId ? mappedStudentsForSubject.length : studentsList.length;
  const activeVenues = venuesList.filter((v) => v.capacity > 0);
  const totalCapacity = activeVenues.reduce((sum, v) => sum + parseInt(v.capacity, 10), 0);
  const availableCapacity = totalCapacity - totalStudents;

  // Group seating assignments by venue
  const groupedSeating = seatingAssignments.reduce((acc, curr) => {
    const venueKey = curr.venue_name;
    if (!acc[venueKey]) {
      acc[venueKey] = {
        venue_name: curr.venue_name,
        building: curr.building,
        capacity: curr.venue_capacity,
        students: [],
      };
    }
    acc[venueKey].students.push(curr);
    return acc;
  }, {});

  // Search filter inside seating plan
  const filteredVenueKeys = Object.keys(groupedSeating).filter((venueName) => {
    const venueObj = groupedSeating[venueName];
    if (venueName.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    return venueObj.students.some(
      (s) =>
        s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8">
      {/* Toast Alert Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-red-500 font-bold text-xl">⚠️</span>
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-emerald-500 font-bold text-xl">✅</span>
            <p className="text-sm font-semibold text-emerald-800">{success}</p>
          </div>
          <button
            onClick={() => setSuccess("")}
            className="text-emerald-500 hover:text-emerald-700 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Exam Selection Header & Control Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Automatic Seating Generator</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an examination schedule to generate seating plans exclusively for mapped students
            </p>
          </div>
          {selectedExamId && seatingAssignments.length > 0 && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              Seating Already Generated ({seatingAssignments.length} Assigned)
            </span>
          )}
        </div>

        {/* Dropdown & Primary Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Examination Schedule <span className="text-red-500">*</span>
            </label>
            {loadingExams ? (
              <div className="p-3 text-xs text-slate-500 font-semibold bg-slate-50 rounded-xl">
                Loading exam schedules...
              </div>
            ) : examsList.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                ⚠️ No exams available. Please create an exam schedule in Exam Management first.
              </div>
            ) : (
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold text-slate-800 outline-none bg-white shadow-xs"
              >
                <option value="">-- Choose an Examination Schedule --</option>
                {examsList.map((e) => (
                  <option key={e._id || e.id} value={e._id || e.id}>
                    {e.subject_code} - {e.subject_name} | Date: {e.exam_date} ({e.start_time} - {e.end_time})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            {seatingAssignments.length > 0 ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRegenerateModal(true)}
                  disabled={isGenerating || !selectedExamId}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? "Processing..." : "🔄 Regenerate Seating"}
                </button>
                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={isGenerating || !selectedExamId}
                  className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  🗑️ Clear
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateSeating}
                disabled={isGenerating || !selectedExamId}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? "Generating..." : "⚡ Generate Seating"}
              </button>
            )}
          </div>
        </div>

        {/* Selected Exam Information & Capacity Breakdown */}
        {selectedExamId && (
          <div className="pt-4 border-t border-slate-100 space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div className="text-xs font-semibold text-slate-500">Mapped Students for Subject</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">
                  🎓 {mappedStudentsForSubject.length}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Enrolled in {selectedExam?.subject_code}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div className="text-xs font-semibold text-slate-500">Total Venue Capacity</div>
                <div className="text-2xl font-extrabold text-slate-800 mt-1">
                  🏛️ {totalCapacity}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{activeVenues.length} available venues</div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  availableCapacity >= 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="text-xs font-semibold uppercase">
                  {availableCapacity >= 0 ? "Available Capacity Margin" : "Shortage Capacity"}
                </div>
                <div className="text-2xl font-extrabold mt-1">
                  {availableCapacity >= 0 ? `+${availableCapacity}` : `${availableCapacity}`} Seats
                </div>
                <div className="text-xs mt-0.5 opacity-80">
                  {availableCapacity >= 0
                    ? "Capacity is sufficient for mapped students"
                    : `Requires ${Math.abs(availableCapacity)} more seats!`}
                </div>
              </div>
            </div>

            {/* Venue Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Available Venues Capacity Breakdown:
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeVenues.map((v) => (
                  <span
                    key={v.id}
                    className="px-3 py-1 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    🏢 <strong>{v.venue_name}</strong> ({v.building || "Main"}) — {v.capacity} seats
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Seating Plan Table */}
      {selectedExamId && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Seating Plan: {selectedExam?.subject_code} - {selectedExam?.subject_name}
              </h3>
              <p className="text-xs text-slate-500">
                Exam Date: <strong>{selectedExam?.exam_date}</strong> ({selectedExam?.start_time} - {selectedExam?.end_time})
              </p>
            </div>

            {seatingAssignments.length > 0 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter student or venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              </div>
            )}
          </div>

          {loadingSeating ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Loading seating arrangement...
            </div>
          ) : seatingAssignments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-3xl mb-2">🪑</p>
              <p className="font-bold text-slate-800 text-base">No Seating Plan Generated Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                {mappedStudentsForSubject.length === 0
                  ? `No students are mapped to ${selectedExam?.subject_code}. Please map students in Student–Subject Mapping first.`
                  : "Click the \"Generate Seating\" button above to allocate mapped students to exam halls."}
              </p>
            </div>
          ) : filteredVenueKeys.length === 0 ? (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl">
              No seating assignments match your search query.
            </div>
          ) : (
            <div className="space-y-8">
              {filteredVenueKeys.map((venueName) => {
                const venueData = groupedSeating[venueName];
                return (
                  <div
                    key={venueName}
                    className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
                  >
                    {/* Venue Header Banner */}
                    <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🏛️</span>
                        <span className="font-extrabold text-slate-800 text-base">
                          {venueData.venue_name}
                        </span>
                        {venueData.building && (
                          <span className="text-xs font-semibold text-slate-500 px-2 py-0.5 bg-slate-200 rounded-md">
                            Building: {venueData.building}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                        Assigned: {venueData.students.length} / {venueData.capacity} Seats
                      </span>
                    </div>

                    {/* Venue Students Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                            <th className="py-2.5 px-4 w-20">Seat No</th>
                            <th className="py-2.5 px-4">Register Number</th>
                            <th className="py-2.5 px-4">Student Name</th>
                            <th className="py-2.5 px-4">Department</th>
                            <th className="py-2.5 px-4">Year</th>
                            <th className="py-2.5 px-4">Section</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {venueData.students.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono font-extrabold text-indigo-600">
                                #{st.seat_number}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">
                                {st.register_number}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {st.student_name}
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                                  {st.student_department}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600">Year {st.year}</td>
                              <td className="py-3 px-4 text-xs text-slate-600 font-semibold">
                                {st.section || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirm Regeneration Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl mx-auto">
              🔄
            </div>
            <h3 className="text-lg font-bold text-slate-900">Regenerate Seating Plan?</h3>
            <p className="text-xs text-slate-500">
              Existing seating assignments for this exam will be replaced with a new allocation. Do you want to continue?
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSeating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Yes, Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clear Seating Plan?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete all seating assignments for this exam? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSeating}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Yes, Clear Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
