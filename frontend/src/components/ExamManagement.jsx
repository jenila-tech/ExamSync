import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/exams";
const SUBJECTS_API_URL = "http://localhost:5000/subjects";

export default function ExamManagement({ user }) {
  // Check authorization
  const isAdmin = user?.role === "admin";

  const [examsList, setExamsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add form state
  const [formData, setFormData] = useState({
    subject_id: "",
    exam_date: "",
    start_time: "10:00",
    end_time: "13:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingExam, setEditingExam] = useState(null);
  const [editFormData, setEditFormData] = useState({
    subject_id: "",
    exam_date: "",
    start_time: "",
    end_time: "",
  });

  // Delete modal state
  const [deletingExam, setDeletingExam] = useState(null);

  // Helper for auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // Fetch all exams and subjects on mount
  useEffect(() => {
    if (isAdmin) {
      fetchSubjects();
      fetchExams();
    }
  }, [isAdmin]);

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

  // Fetch Subjects for Dropdown
  const fetchSubjects = async () => {
    try {
      const response = await fetch(SUBJECTS_API_URL, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setSubjectsList(data);
      }
    } catch (err) {
      console.error("Error loading subjects dropdown:", err);
    }
  };

  // GET /exams
  const fetchExams = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch exams");
      }

      setExamsList(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Edit Form inputs
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // POST /exams - Add new exam
  const handleAddExam = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.subject_id || !formData.exam_date || !formData.start_time || !formData.end_time) {
      setError("Please fill in all fields (Subject, Exam Date, Start Time, and End Time)");
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setError("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule exam");
      }

      setSuccess(`Exam for "${data.subject_code} - ${data.subject_name}" scheduled successfully!`);
      setFormData({
        subject_id: "",
        exam_date: "",
        start_time: "10:00",
        end_time: "13:00",
      });
      fetchExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (exam) => {
    setEditingExam(exam);
    setEditFormData({
      subject_id: String(exam.subject_id),
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
    });
  };

  // PUT /exams/:id - Update exam
  const handleUpdateExam = async (e) => {
    e.preventDefault();
    if (!editingExam) return;

    setError("");
    setSuccess("");

    if (!editFormData.subject_id || !editFormData.exam_date || !editFormData.start_time || !editFormData.end_time) {
      setError("All fields are required.");
      return;
    }

    if (editFormData.start_time >= editFormData.end_time) {
      setError("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${editingExam.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update exam");
      }

      setSuccess(`Exam for "${data.subject_code} - ${data.subject_name}" updated successfully!`);
      setEditingExam(null);
      fetchExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE /exams/:id - Delete exam
  const handleDeleteExam = async () => {
    if (!deletingExam) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${deletingExam.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete exam");
      }

      setSuccess(`Exam for "${deletingExam.subject_code} - ${deletingExam.subject_name}" deleted successfully!`);
      setDeletingExam(null);
      fetchExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
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
              You do not have permission to access Exam Management. Only System Administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered exams for search
  const filteredExams = examsList.filter(
    (e) =>
      e.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.exam_date.includes(searchQuery)
  );

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

      {/* Grid Layout: Add Form & Exam Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Exam Form (1 Column) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xl">
              ➕
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schedule New Exam</h2>
              <p className="text-xs text-slate-500">Create an examination slot</p>
            </div>
          </div>

          <form onSubmit={handleAddExam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Subject <span className="text-red-500">*</span>
              </label>
              {subjectsList.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                  ⚠️ No subjects found. Please add subjects in Subject Management first.
                </div>
              ) : (
                <select
                  name="subject_id"
                  required
                  value={formData.subject_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none bg-white"
                >
                  <option value="">-- Select Subject --</option>
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject_code} - {s.subject_name} ({s.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="exam_date"
                required
                value={formData.exam_date}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="start_time"
                  required
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="end_time"
                  required
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm outline-none bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || subjectsList.length === 0}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? "Scheduling..." : "Add Exam Schedule"}
            </button>
          </form>
        </div>

        {/* Exam Timetable Directory (2 Columns) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Exam Timetable</h2>
              <p className="text-xs text-slate-500">
                Scheduled Exams: <strong>{examsList.length}</strong>
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by code, subject or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none w-full sm:w-64"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Table view */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Loading exam timetable...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-2xl mb-1">📝</p>
              <p className="font-semibold text-slate-700">No scheduled exams found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try refining your search query" : "Use the form on the left to schedule your first examination."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 rounded-l-lg">Subject Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Exam Date</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredExams.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-mono font-bold text-xs rounded-md">
                          {e.subject_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{e.subject_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                          {e.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 text-xs">
                        📅 {e.exam_date}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-indigo-600">
                        ⏰ {e.start_time} - {e.end_time}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(e)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeletingExam(e)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Exam Modal */}
      {editingExam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Exam Schedule</h3>
              <button
                onClick={() => setEditingExam(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateExam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject
                </label>
                <select
                  name="subject_id"
                  required
                  value={editFormData.subject_id}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject_code} - {s.subject_name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  name="exam_date"
                  required
                  value={editFormData.exam_date}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    required
                    value={editFormData.start_time}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    required
                    value={editFormData.end_time}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingExam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Exam Schedule</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete the exam schedule for <strong className="text-slate-800">{deletingExam.subject_code} - {deletingExam.subject_name}</strong> on <span className="font-semibold text-slate-700">{deletingExam.exam_date}</span>?
            </p>
            <p className="text-xs text-red-500 mt-1 font-semibold">This action cannot be undone.</p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeletingExam(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExam}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
