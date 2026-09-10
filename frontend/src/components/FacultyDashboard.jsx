function FacultyDashboard({ user, onLogout }) {
  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 bg-blue-500/30 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 mb-2">
            Faculty Access
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Faculty Dashboard</h1>
          <p className="text-blue-200 mt-1 text-sm">
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
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            📋
          </div>
          <h3 className="font-bold text-lg text-slate-800">Invigilation Duties</h3>
          <p className="text-slate-500 text-sm mt-2">
            View assigned exam halls, invigilation duty dates, and duty slots.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-blue-600">
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            🏫
          </div>
          <h3 className="font-bold text-lg text-slate-800">Hall Allocations</h3>
          <p className="text-slate-500 text-sm mt-2">
            Inspect hall capacity, bench arrangements, and assigned student lists.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">
            <span>Coming Soon</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4">
            📊
          </div>
          <h3 className="font-bold text-lg text-slate-800">Attendance & Reports</h3>
          <p className="text-slate-500 text-sm mt-2">
            Mark student attendance during exams and generate invigilation logs.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-purple-600">
            <span>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
