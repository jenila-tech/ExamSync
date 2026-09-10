import { useState } from "react";
import StudentManagement from "./StudentManagement";
import FacultyManagement from "./FacultyManagement";
import SubjectManagement from "./SubjectManagement";
import ExamManagement from "./ExamManagement";
import VenueManagement from "./VenueManagement";
import SeatingManagement from "./SeatingManagement";
import StudentSubjectMapping from "./StudentSubjectMapping";
import InvigilationManagement from "./InvigilationManagement";

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("students"); // 'students' | 'faculty' | 'subjects' | 'exams' | 'venues' | 'seating' | 'invigilation' | 'student-subjects'

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome card */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 bg-indigo-500/30 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
            Administrator Access
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-indigo-200 mt-1 text-sm">
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

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "students"
              ? "bg-white text-indigo-600 border-indigo-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>🎓</span>
          <span>Student Management</span>
        </button>

        <button
          onClick={() => setActiveTab("faculty")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "faculty"
              ? "bg-white text-indigo-600 border-indigo-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>👨‍🏫</span>
          <span>Faculty Management</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "subjects"
              ? "bg-white text-purple-600 border-purple-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>📚</span>
          <span>Subject Management</span>
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "exams"
              ? "bg-white text-amber-600 border-amber-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>📝</span>
          <span>Exam Management</span>
        </button>

        <button
          onClick={() => setActiveTab("venues")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "venues"
              ? "bg-white text-cyan-600 border-cyan-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>🏛️</span>
          <span>Venue Management</span>
        </button>

        <button
          onClick={() => setActiveTab("seating")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "seating"
              ? "bg-white text-emerald-600 border-emerald-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>🪑</span>
          <span>Seating Generation</span>
        </button>

        <button
          onClick={() => setActiveTab("invigilation")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "invigilation"
              ? "bg-white text-slate-900 border-slate-900 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>🕵️</span>
          <span>Invigilation Management</span>
        </button>

        <button
          onClick={() => setActiveTab("student-subjects")}
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "student-subjects"
              ? "bg-white text-teal-600 border-teal-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>🔗</span>
          <span>Student–Subject Mapping</span>
        </button>
      </div>

      {/* Admin Module Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {activeTab === "students" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Student Management Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, view, edit, and delete student records for exam seating
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                Active System
              </span>
            </div>
            <StudentManagement user={user} />
          </div>
        ) : activeTab === "faculty" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Faculty Management Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, view, edit, and delete faculty members for invigilation assignments
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <FacultyManagement user={user} />
          </div>
        ) : activeTab === "subjects" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Subject Management Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, view, edit, and delete course subjects for exam scheduling
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <SubjectManagement user={user} />
          </div>
        ) : activeTab === "exams" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Exam Management Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule, view, edit, and manage examination timetables & detect conflicts
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <ExamManagement user={user} />
          </div>
        ) : activeTab === "venues" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Venue Management Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, view, edit, and delete exam hall venues & seating capacities
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <VenueManagement user={user} />
          </div>
        ) : activeTab === "seating" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Automatic Seating Generation Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically allocate students to exam halls, inspect capacity, and manage seating plans
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <SeatingManagement user={user} />
          </div>
        ) : activeTab === "invigilation" ? (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Automatic Invigilation Generation Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically assign faculty members to invigilate exam venues without conflict
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <InvigilationManagement user={user} />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Student–Subject Mapping Module</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enroll students in course subjects and manage academic course mappings
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                Admin Restricted
              </span>
            </div>
            <StudentSubjectMapping user={user} />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
