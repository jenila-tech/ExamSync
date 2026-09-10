import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/venues";

export default function VenueManagement({ user }) {
  // Check authorization
  const isAdmin = user?.role === "admin";

  const [venuesList, setVenuesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Add form state
  const [formData, setFormData] = useState({
    venue_name: "",
    building: "",
    capacity: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingVenue, setEditingVenue] = useState(null);
  const [editFormData, setEditFormData] = useState({
    venue_name: "",
    building: "",
    capacity: "",
  });

  // Delete modal state
  const [deletingVenue, setDeletingVenue] = useState(null);

  // Helper for auth headers
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id ? String(user.id) : "",
  });

  // Fetch all venues
  useEffect(() => {
    if (isAdmin) {
      fetchVenues();
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

  // GET /venues
  const fetchVenues = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_BASE_URL, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch venues");
      }

      setVenuesList(data);
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

  // POST /venues - Add new venue
  const handleAddVenue = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.venue_name.trim() || !formData.capacity) {
      setError("Please fill in required fields (Venue Name and Capacity)");
      return;
    }

    const capNum = parseInt(formData.capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setError("Capacity must be a positive number greater than 0");
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
        throw new Error(data.error || "Failed to add venue");
      }

      setSuccess(`Venue "${data.venue_name}" added successfully!`);
      setFormData({ venue_name: "", building: "", capacity: "" });
      fetchVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (venue) => {
    setEditingVenue(venue);
    setEditFormData({
      venue_name: venue.venue_name,
      building: venue.building || "",
      capacity: String(venue.capacity),
    });
  };

  // PUT /venues/:id - Update venue
  const handleUpdateVenue = async (e) => {
    e.preventDefault();
    if (!editingVenue) return;

    setError("");
    setSuccess("");

    if (!editFormData.venue_name.trim() || !editFormData.capacity) {
      setError("Venue Name and Capacity cannot be empty.");
      return;
    }

    const capNum = parseInt(editFormData.capacity, 10);
    if (isNaN(capNum) || capNum <= 0) {
      setError("Capacity must be a positive number greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${editingVenue.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update venue");
      }

      setSuccess(`Venue "${data.venue_name}" updated successfully!`);
      setEditingVenue(null);
      fetchVenues();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE /venues/:id - Delete venue
  const handleDeleteVenue = async () => {
    if (!deletingVenue) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${deletingVenue.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete venue");
      }

      setSuccess(`Venue "${deletingVenue.venue_name}" deleted successfully!`);
      setDeletingVenue(null);
      fetchVenues();
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
              You do not have permission to access Venue Management. Only System Administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered venues for search
  const filteredVenues = venuesList.filter(
    (v) =>
      v.venue_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.building && v.building.toLowerCase().includes(searchQuery.toLowerCase()))
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

      {/* Grid Layout: Add Form & Venue Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Venue Form (1 Column) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center font-bold text-xl">
              ➕
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Venue</h2>
              <p className="text-xs text-slate-500">Register an exam hall or room</p>
            </div>
          </div>

          <form onSubmit={handleAddVenue} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venue_name"
                required
                value={formData.venue_name}
                onChange={handleInputChange}
                placeholder="e.g. Hall A101"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Building Name
              </label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
                placeholder="e.g. Science & Tech Block"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seating Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                required
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g. 60"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? "Adding..." : "Add Venue"}
            </button>
          </form>
        </div>

        {/* Venue Directory (2 Columns) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Venue Directory</h2>
              <p className="text-xs text-slate-500">
                Total Venues: <strong>{venuesList.length}</strong> | Total Capacity:{" "}
                <strong>{venuesList.reduce((sum, v) => sum + (v.capacity || 0), 0)} seats</strong>
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search venue or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none w-full sm:w-64"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Table view */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              Loading venue directory...
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-2xl mb-1">🏛️</p>
              <p className="font-semibold text-slate-700">No venues found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try refining your search query" : "Use the form on the left to add your first exam venue."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4 rounded-l-lg">Venue Name</th>
                    <th className="py-3 px-4">Building</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredVenues.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{v.venue_name}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {v.building ? (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                            🏢 {v.building}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-italic">Main Block</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-md text-xs font-bold">
                          🪑 {v.capacity} Seats
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeletingVenue(v)}
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

      {/* Edit Venue Modal */}
      {editingVenue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Venue Details</h3>
              <button
                onClick={() => setEditingVenue(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateVenue} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  name="venue_name"
                  required
                  value={editFormData.venue_name}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building Name
                </label>
                <input
                  type="text"
                  name="building"
                  value={editFormData.building}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  required
                  value={editFormData.capacity}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVenue(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVenue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Venue</h3>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete <strong className="text-slate-800">{deletingVenue.venue_name}</strong>?
            </p>
            <p className="text-xs text-red-500 mt-1 font-semibold">This action cannot be undone.</p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeletingVenue(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVenue}
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
