import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/subjects";

export default function SubjectManagement({ user }) {
  // Check authorization
  const isAdmin = user?.role === "admin";

  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add form state
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    department: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingSubject, setEditingSubject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    subject_code: "",
    subject_name: "",
    department: "",
  });

  // Delete modal state
  const [deletingSubject, setDeletingSubject] = useState(null);

  // Helper for auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // Fetch all subjects
  useEffect(() => {
    if (isAdmin) {
      fetchSubjects();
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

  // GET /subjects
  const fetchSubjects = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subjects");
      }

      setSubjectsList(data);
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

  // POST /subjects - Add new subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.subject_code.trim() ||
      !formData.subject_name.trim() ||
      !formData.department.trim()
    ) {
      setError("Please fill in all fields (Subject Code, Subject Name, and Department)");
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
        throw new Error(data.error || "Failed to add subject");
      }

      setSuccess(`Subject "${data.subject_name}" (${data.subject_code}) added successfully!`);
      setFormData({ subject_code: "", subject_name: "", department: "" });
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (subject) => {
    setEditingSubject(subject);
    setEditFormData({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      department: subject.department,
    });
  };

  // PUT /subjects/:id - Update subject
  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;

    setError("");
    setSuccess("");

    if (
      !editFormData.subject_code.trim() ||
      !editFormData.subject_name.trim() ||
      !editFormData.department.trim()
    ) {
      setError("Subject Code, Subject Name, and Department cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${editingSubject.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update subject");
      }

      setSuccess(`Subject "${data.subject_name}" updated successfully!`);
      setEditingSubject(null);
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE /subjects/:id - Delete subject
  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${deletingSubject.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete subject");
      }

      setSuccess(`Subject "${deletingSubject.subject_name}" deleted successfully!`);
      setDeletingSubject(null);
      fetchSubjects();
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
              You do not have permission to access Subject Management. Only System Administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered subjects for search
  const filteredSubjects = subjectsList.filter(
    (s) =>
      s.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Grid Layout: Add Form & Subjects Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Subject Form (1 Column) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
              ➕
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Subject</h2>
              <p className="text-xs text-slate-500">Register a course subject</p>
            </div>
          </div>

          <form onSubmit={handleAddSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject_code"
                required
                value={formData.subject_code}
                onChange={handleInputChange}
                placeholder="e.g. CS101"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="subject_name"
                required
                value={formData.subject_name}
                onChange={handleInputChange}
                placeholder="e.g. Data Structures & Algorithms"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. Computer Science"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? "Adding..." : "Add Subject"}
            </button>
          </form>
        </div>

        {/* Subject Directory (2 Columns) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Subject Directory</h2>
              <p className="text-xs text-slate-500">
                Total Registered: <strong>{subjectsList.length}</strong>
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none w-full sm:w-64"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Table view */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Loading subject catalog...
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-2xl mb-1">📖</p>
              <p className="font-semibold text-slate-700">No subjects found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try refining your search query" : "Use the form on the left to add your first course subject."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 rounded-l-lg">Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSubjects.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-mono font-bold text-xs rounded-md">
                          {s.subject_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{s.subject_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                          {s.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-600 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeletingSubject(s)}
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

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Subject Details</h3>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  name="subject_code"
                  required
                  value={editFormData.subject_code}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  name="subject_name"
                  required
                  value={editFormData.subject_name}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  required
                  value={editFormData.department}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSubject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Subject</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete <strong className="text-slate-800">{deletingSubject.subject_name}</strong> ({deletingSubject.subject_code})?
            </p>
            <p className="text-xs text-red-500 mt-1 font-semibold">This action cannot be undone.</p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubject}
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
