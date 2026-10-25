import { useState, useEffect } from "react";

const API_BASE_URL = "https://examsync-backend-zvqi.onrender.com/faculty";

export default function FacultyManagement({ user }) {
  // Check authorization
  const isAdmin = user?.role === "admin";

  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add form state
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    department: "",
    email: "",
  });

  // Delete modal state
  const [deletingFaculty, setDeletingFaculty] = useState(null);

  // Helper for auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // Fetch all faculty members
  useEffect(() => {
    if (isAdmin) {
      fetchFaculty();
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

  // GET /faculty
  const fetchFaculty = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch faculty members");
      }

      setFacultyList(data);
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

  // POST /faculty - Add new faculty
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.department.trim() || !formData.email.trim()) {
      setError("Please fill in all fields (Name, Department, and Email)");
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
        throw new Error(data.error || "Failed to add faculty member");
      }

      setSuccess(`Faculty member "${data.name}" added successfully!`);
      setFormData({ name: "", department: "", email: "" });
      fetchFaculty();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (faculty) => {
    setEditingFaculty(faculty);
    setEditFormData({
      name: faculty.name,
      department: faculty.department,
      email: faculty.email,
    });
  };

  // PUT /faculty/:id - Update faculty
  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    if (!editingFaculty) return;

    setError("");
    setSuccess("");

    if (!editFormData.name.trim() || !editFormData.department.trim() || !editFormData.email.trim()) {
      setError("Name, Department, and Email cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${editingFaculty.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update faculty member");
      }

      setSuccess(`Faculty member "${data.name}" updated successfully!`);
      setEditingFaculty(null);
      fetchFaculty();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE /faculty/:id - Delete faculty
  const handleDeleteFaculty = async () => {
    if (!deletingFaculty) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${deletingFaculty.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete faculty member");
      }

      setSuccess(`Faculty member "${deletingFaculty.name}" deleted successfully!`);
      setDeletingFaculty(null);
      fetchFaculty();
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
              You do not have permission to access Faculty Management. Only System Administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered faculty for search
  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            className="text-red-500 hover:text-red-700 font-bold text-sm"
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
            className="text-emerald-500 hover:text-emerald-700 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid Layout: Add Form & Faculty Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Faculty Form (1 Column) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">
              ➕
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Faculty</h2>
              <p className="text-xs text-slate-500">Register a faculty member</p>
            </div>
          </div>

          <form onSubmit={handleAddFaculty} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
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
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. sarah.jenkins@univ.edu"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? "Adding..." : "Add Faculty Member"}
            </button>
          </form>
        </div>

        {/* Faculty List (2 Columns) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Faculty Directory</h2>
              <p className="text-xs text-slate-500">
                Total Registered: <strong>{facultyList.length}</strong>
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Table view */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Loading faculty directory...
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-2xl mb-1">👨‍🏫</p>
              <p className="font-semibold text-slate-700">No faculty members found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try refining your search query" : "Use the form on the left to add your first faculty member."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 rounded-l-lg">ID</th>
                    <th className="py-3 px-4">Faculty Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredFaculty.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-400">#{f.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{f.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                          {f.department}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{f.email}</td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(f)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeletingFaculty(f)}
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

      {/* Edit Faculty Modal */}
      {editingFaculty && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Faculty Details</h3>
              <button
                onClick={() => setEditingFaculty(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFaculty} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFaculty && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Faculty Member</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete <strong className="text-slate-800">{deletingFaculty.name}</strong> ({deletingFaculty.email})?
            </p>
            <p className="text-xs text-red-500 mt-1 font-semibold">This action cannot be undone.</p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeletingFaculty(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFaculty}
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
