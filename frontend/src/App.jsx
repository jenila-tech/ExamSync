import { useState, useEffect } from "react";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import FacultyDashboard from "./components/FacultyDashboard";
import StudentDashboard from "./components/StudentDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persistent user session from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("exam_system_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Error loading session:", err);
      localStorage.removeItem("exam_system_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("exam_system_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("exam_system_user");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70 text-slate-600 font-semibold">
        Loading system...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-indigo-600 text-white rounded-lg text-lg font-bold shadow-sm">
              📚
            </span>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">
              Exam Seating & Invigilation System
            </span>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 capitalize">
                Role: <strong>{user.role}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {!user ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : user.role === "admin" ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : user.role === "faculty" ? (
          <FacultyDashboard user={user} onLogout={handleLogout} />
        ) : user.role === "student" ? (
          <StudentDashboard user={user} onLogout={handleLogout} />
        ) : (
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold">Unknown role specified.</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg"
            >
              Return to Login
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;