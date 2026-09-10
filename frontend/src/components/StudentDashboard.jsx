function StudentDashboard({ user, onLogout }) {
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
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-teal-600">
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            🎟️
          </div>
          <h3 className="font-bold text-lg text-slate-800">Hall Ticket</h3>
          <p className="text-slate-500 text-sm mt-2">
            View and download your digital hall ticket for upcoming semester examinations.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-amber-600">
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            📅
          </div>
          <h3 className="font-bold text-lg text-slate-800">Exam Timetable</h3>
          <p className="text-slate-500 text-sm mt-2">
            Review course exam schedules, timings, and department notices.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600">
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
