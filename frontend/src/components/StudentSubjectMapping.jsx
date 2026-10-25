import { useState, useEffect } from "react";

const API_BASE_URL = "https://examsync-backend-zvqi.onrender.com/student-subjects";
const STUDENTS_API_URL = "https://examsync-backend-zvqi.onrender.com/students";
const SUBJECTS_API_URL = "https://examsync-backend-zvqi.onrender.com/subjects";

export default function StudentSubjectMapping({ user }) {
  // Check authorization
  const isAdmin = user?.role === "admin";

  const [mappingsList, setMappingsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add form state
  const [formData, setFormData] = useState({
    student_id: "",
    subject_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingMapping, setEditingMapping] = useState(null);
  const [editFormData, setEditFormData] = useState({
    student_id: "",
    subject_id: "",
  });

  // Delete modal state
  const [deletingMapping, setDeletingMapping] = useState(null);

  // Helper for auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // Fetch all initial data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Clear toast notifications after 4 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [mapRes, studRes, subjRes] = await Promise.all([
        fetch(API_BASE_URL, { headers: getAuthHeaders() }),
        fetch(STUDENTS_API_URL, { headers: getAuthHeaders() }),
        fetch(SUBJECTS_API_URL, { headers: getAuthHeaders() }),
      ]);

      const mapData = await mapRes.json();
      const studData = await studRes.json();
      const subjData = await subjRes.json();

      if (mapRes.ok) setMappingsList(mapData);
      if (studRes.ok) setStudentsList(studData);
      if (subjRes.ok) setSubjectsList(subjData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async () => {
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setMappingsList(data);
      }
    } catch (err) {
      console.error("Error refreshing mappings:", err);
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

  // POST /student-subjects - Create new mapping
  const handleAddMapping = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.student_id || !formData.subject_id) {
      setError("Please select both a student and a subject.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          student_id: formData.student_id,
          subject_id: formData.subject_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create student-subject mapping");
      }

      setSuccess(
        `Mapped "${data.student_name}" (${data.register_number}) to "${data.subject_code} - ${data.subject_name}" successfully!`
      );
      setFormData({ student_id: "", subject_id: "" });
      fetchMappings();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (mapping) => {
    setEditingMapping(mapping);
    setEditFormData({
      student_id: String(mapping.student_id),
      subject_id: String(mapping.subject_id),
    });
  };

  // PUT /student-subjects/:id - Update mapping
  const handleUpdateMapping = async (e) => {
    e.preventDefault();
    if (!editingMapping) return;

    setError("");
    setSuccess("");

    if (!editFormData.student_id || !editFormData.subject_id) {
      setError("Please select both a student and a subject.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${editingMapping.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          student_id: editFormData.student_id,
          subject_id: editFormData.subject_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update mapping");
      }

      setSuccess(`Updated mapping for "${data.student_name}" successfully!`);
      setEditingMapping(null);
      fetchMappings();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE /student-subjects/:id - Delete mapping
  const handleDeleteMapping = async () => {
    if (!deletingMapping) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${deletingMapping.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete mapping");
      }

      setSuccess(`Mapping for "${deletingMapping.student_name}" removed successfully!`);
      setDeletingMapping(null);
      fetchMappings();
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
              You do not have permission to access Student–Subject Mapping. Only System Administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered mappings for search
  const filteredMappings = mappingsList.filter(
    (m) =>
      (m.register_number ?? "").toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.student_name ?? "").toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject_code ?? "").toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.subject_name ?? "").toString().toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Grid Layout: Add Form & Mappings Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Mapping Form (1 Column) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center font-bold text-xl">
              🔗
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Student–Subject Mapping</h2>
              <p className="text-xs text-slate-500">Enroll student in a course subject</p>
            </div>
          </div>

          <form onSubmit={handleAddMapping} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Student <span className="text-red-500">*</span>
              </label>
              {studentsList.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                  ⚠️ No students found. Add students in Student Management first.
                </div>
              ) : (
                <select
                  name="student_id"
                  required
                  value={formData.student_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm outline-none bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.register_number} - {st.name} ({st.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Course Subject <span className="text-red-500">*</span>
              </label>
              {subjectsList.length === 0 ? (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                  ⚠️ No subjects found. Add subjects in Subject Management first.
                </div>
              ) : (
                <select
                  name="subject_id"
                  required
                  value={formData.subject_id}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm outline-none bg-white"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject_code} - {sub.subject_name} ({sub.department})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || studentsList.length === 0 || subjectsList.length === 0}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? "Mapping..." : "Map Student to Subject"}
            </button>
          </form>
        </div>

        {/* Mappings Directory (2 Columns) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student–Subject Mappings Directory</h2>
              <p className="text-xs text-slate-500">
                Total Registered Mappings: <strong>{mappingsList.length}</strong>
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search register no, student, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-64"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Table view */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Loading student–subject mappings...
            </div>
          ) : filteredMappings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-3xl mb-1">🔗</p>
              <p className="font-semibold text-slate-700">No mappings found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try refining your search query" : "Use the form on the left to map students to subjects."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 rounded-l-lg">Register Number</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Subject Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredMappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 text-xs">
                        {m.register_number}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.student_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-teal-100 text-teal-800 font-mono font-bold text-xs rounded-md">
                          {m.subject_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium text-xs">
                        {m.subject_name}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(m)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeletingMapping(m)}
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

      {/* Edit Mapping Modal */}
      {editingMapping && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Student–Subject Mapping</h3>
              <button
                onClick={() => setEditingMapping(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMapping} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student
                </label>
                <select
                  name="student_id"
                  required
                  value={editFormData.student_id}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  {studentsList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.register_number} - {st.name} ({st.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Subject
                </label>
                <select
                  name="subject_id"
                  required
                  value={editFormData.subject_id}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                >
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject_code} - {sub.subject_name} ({sub.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMapping(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMapping && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Mapping</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to remove the mapping for <strong className="text-slate-800">{deletingMapping.student_name}</strong> ({deletingMapping.register_number}) in <span className="font-semibold text-slate-700">{deletingMapping.subject_code}</span>?
            </p>
            <p className="text-xs text-red-500 mt-1 font-semibold">This action cannot be undone.</p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeletingMapping(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMapping}
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
