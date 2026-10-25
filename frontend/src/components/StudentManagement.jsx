import { useState, useEffect } from "react";

const API_BASE_URL = "https://examsync-backend-zvqi.onrender.com/students";

export default function StudentManagement({ user }) {
  // State variables
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "x-user-role": user?.role || "",
  "x-user-id": user?.id ? String(user.id) : "",
});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add form state
  const [formData, setFormData] = useState({
    register_number: "",
    name: "",
    department: "",
    year: "",
    section: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    register_number: "",
    name: "",
    department: "",
    year: "",
    section: "",
  });

  // Delete confirmation modal state
  const [deletingStudent, setDeletingStudent] = useState(null);

  // Fetch all students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

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

  // 1. GET /students - Fetch student list from API
  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE_URL, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to connect to backend server. Make sure node server.js is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Edit Form input change
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. POST /students - Add new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.register_number || !formData.name || !formData.department || !formData.year) {
      setError("Please fill in all required fields (Register Number, Name, Department, Year)");
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
        throw new Error(data.error || "Failed to add student");
      }

      setSuccess(`Student "${data.name}" added successfully!`);
      setFormData({
        register_number: "",
        name: "",
        department: "",
        year: "",
        section: "",
      });
      fetchStudents(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditFormData({
      register_number: student.register_number || "",
      name: student.name || "",
      department: student.department || "",
      year: student.year || "",
      section: student.section || "",
    });
  };

  // 3. PUT /students/:id - Update existing student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/${editingStudent.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update student");
      }

      setSuccess(`Student "${data.name}" updated successfully!`);
      setEditingStudent(null);
      fetchStudents(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  // 4. DELETE /students/:id - Delete student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/${deletingStudent.id}`, {
        method: "DELETE",
headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete student");
      }

      setSuccess(`Student "${deletingStudent.name}" deleted successfully.`);
      setDeletingStudent(null);
      fetchStudents(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const q = searchQuery.toLowerCase();
    return (
      student.register_number.toLowerCase().includes(q) ||
      student.name.toLowerCase().includes(q) ||
      student.department.toLowerCase().includes(q) ||
      (student.section && student.section.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Top Banner / Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student records for examination seating & invigilation allocation.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200">
            Total Students: {students.length}
          </span>
          <button
            onClick={fetchStudents}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Notifications Alert Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex justify-between items-center animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Side Add Form, Right Side Student List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ADD STUDENT FORM (4 columns on lg) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-lg">➕</span>
              <h2 className="text-lg font-bold text-slate-800">Add New Student</h2>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Register Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="register_number"
                  placeholder="e.g. 717621CS001"
                  value={formData.register_number}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. CSE, ECE, IT"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm text-slate-800"
                  >
                    <option value="">Select</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    placeholder="e.g. A, B"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-indigo-200 transition duration-150 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Saving..." : "Save Student"}
              </button>
            </form>
          </div>
        </div>

        {/* STUDENT LIST TABLE (8 columns on lg) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Students Directory</h2>
                <p className="text-xs text-slate-500">View, edit, or delete existing student records</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search by name, reg no, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3"></div>
                <p className="text-sm">Loading student records...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-3xl mb-2">🎓</p>
                <p className="text-slate-600 font-semibold">No students found</p>
                <p className="text-xs mt-1 text-slate-400">
                  {searchQuery ? "Try matching a different search keyword." : "Add a student using the form on the left."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-4">Reg Number</th>
                      <th className="py-3.5 px-4">Name</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Year</th>
                      <th className="py-3.5 px-4">Section</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700 bg-indigo-50/50 rounded-md">
                          {student.register_number}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {student.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md">
                            {student.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 text-xs font-medium text-indigo-800 bg-indigo-100 rounded">
                            Year {student.year}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {student.section ? (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium text-emerald-800 bg-emerald-100 rounded">
                              Sec {student.section}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
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
      </div>

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg p-6 relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Edit Student Details</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Register Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="register_number"
                  value={editFormData.register_number}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={editFormData.department}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={editFormData.section}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 relative">
            <div className="text-center mb-4">
              <span className="inline-block p-3 bg-red-100 text-red-600 rounded-full text-2xl mb-2">
                🗑️
              </span>
              <h3 className="text-lg font-bold text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-700">{deletingStudent.name}</strong> ({deletingStudent.register_number})? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
