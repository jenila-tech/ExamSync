import { useState, useEffect } from "react";
import StudentManagement from "./StudentManagement";
import FacultyManagement from "./FacultyManagement";
import SubjectManagement from "./SubjectManagement";
import ExamManagement from "./ExamManagement";
import VenueManagement from "./VenueManagement";
import SeatingManagement from "./SeatingManagement";
import StudentSubjectMapping from "./StudentSubjectMapping";
import InvigilationManagement from "./InvigilationManagement";

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("students");
  const [stats, setStats] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [examStatuses, setExamStatuses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");
  const [exportingReport, setExportingReport] = useState("");

  // =========================
  // Dashboard Statistics
  // =========================
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          "https://examsync-backend-zvqi.onrender.com/dashboard/stats",
          {
            headers: {
              "x-user-id": user?.id || user?._id || "",
              "x-user-role": user?.role || "",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch dashboard stats");
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchStats();
  }, [user]);

  // =========================
  // Upcoming Exams
  // =========================
  useEffect(() => {
    const fetchUpcomingExams = async () => {
      try {
        const response = await fetch(
          "https://examsync-backend-zvqi.onrender.com/dashboard/upcoming-exams",
          {
            headers: {
              "x-user-id": user?.id || user?._id || "",
              "x-user-role": user?.role || "",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch upcoming exams");
          return;
        }

        const data = await response.json();

        setUpcomingExams(
          Array.isArray(data.upcomingExams) ? data.upcomingExams : []
        );
      } catch (err) {
        console.error("Error fetching upcoming exams:", err);
      }
    };

    fetchUpcomingExams();
  }, [user]);

  // =========================
  // Recent Activity
  // =========================
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch(
          "https://examsync-backend-zvqi.onrender.com/dashboard/recent-activity",
          {
            headers: {
              "x-user-id": user?.id || user?._id || "",
              "x-user-role": user?.role || "",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch recent activity");
          return;
        }

        const data = await response.json();

        setRecentActivity(
          Array.isArray(data.recentActivity) ? data.recentActivity : []
        );
      } catch (err) {
        console.error("Error fetching recent activity:", err);
      }
    };

    fetchRecentActivity();
  }, [user]);

  // =========================
  // Exam Status
  // =========================
  useEffect(() => {
    const fetchExamStatus = async () => {
      try {
        const response = await fetch(
          "https://examsync-backend-zvqi.onrender.com/dashboard/exam-status",
          {
            headers: {
              "x-user-id": user?.id || user?._id || "",
              "x-user-role": user?.role || "",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch exam status");
          return;
        }

        const data = await response.json();

        setExamStatuses(
          Array.isArray(data.examStatuses) ? data.examStatuses : []
        );
      } catch (err) {
        console.error("Error fetching exam status:", err);
      }
    };

    fetchExamStatus();
  }, [user]);

  // =========================
  // Alerts & Conflicts
  // =========================
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(
          "https://examsync-backend-zvqi.onrender.com/dashboard/alerts",
          {
            headers: {
              "x-user-id": user?.id || user?._id || "",
              "x-user-role": user?.role || "",
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to fetch dashboard alerts");
          return;
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.alerts)
          ? data.alerts
          : [];

        setAlerts(list);
      } catch (err) {
        console.error("Error fetching dashboard alerts:", err);
      }
    };

    fetchAlerts();
  }, [user]);

  // =========================
  // Reports
  // =========================
  const fetchReports = async () => {
    setReportsLoading(true);
    setReportsError("");

    try {
      const response = await fetch(
        "https://examsync-backend-zvqi.onrender.com/dashboard/reports",
        {
          headers: {
            "x-user-id": user?.id || user?._id || "",
            "x-user-role": user?.role || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load reports data");
      }

      const data = await response.json();
      setReportsData(data);
    } catch (err) {
      console.error("Error fetching dashboard reports:", err);
      setReportsError(
        err.message || "Failed to load report data"
      );
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  // =========================
  // CSV Download
  // =========================
  const handleDownloadCSV = (reportType) => {
    if (!reportsData) {
      alert(
        "Report data is not loaded yet. Please wait a moment or click Retry."
      );
      return;
    }

    const configs = {
      students: {
        filename: "students-report.csv",
        data: reportsData.students || [],
        headers: [
          { label: "Register Number", key: "register_number" },
          { label: "Student Name", key: "name" },
          { label: "Department", key: "department" },
          { label: "Year", key: "year" },
          { label: "Section", key: "section" },
        ],
      },

      exams: {
        filename: "exams-report.csv",
        data: reportsData.exams || [],
        headers: [
          { label: "Subject Code", key: "subject_code" },
          { label: "Subject Name", key: "subject_name" },
          { label: "Department", key: "department" },
          { label: "Exam Date", key: "exam_date" },
          { label: "Start Time", key: "start_time" },
          { label: "End Time", key: "end_time" },
        ],
      },

      seating: {
        filename: "seating-report.csv",
        data:
          reportsData.seatingAssignments ||
          reportsData.seating ||
          [],
        headers: [
          {
            label: "Register Number",
            key: "student_register_number",
          },
          {
            label: "Student Name",
            key: "student_name",
          },
          {
            label: "Student Department",
            key: "student_department",
          },
          {
            label: "Student Year",
            key: "student_year",
          },
          {
            label: "Subject Code",
            key: "subject_code",
          },
          {
            label: "Subject Name",
            key: "subject_name",
          },
          {
            label: "Exam Date",
            key: "exam_date",
          },
          {
            label: "Start Time",
            key: "start_time",
          },
          {
            label: "End Time",
            key: "end_time",
          },
          {
            label: "Venue Name",
            key: "venue_name",
          },
          {
            label: "Building",
            key: "building",
          },
          {
            label: "Seat Number",
            key: "seat_number",
          },
        ],
      },

      invigilation: {
        filename: "invigilation-report.csv",
        data:
          reportsData.invigilationAssignments ||
          reportsData.invigilation ||
          [],
        headers: [
          {
            label: "Faculty Name",
            key: "faculty_name",
          },
          {
            label: "Faculty Email",
            key: "faculty_email",
          },
          {
            label: "Faculty Department",
            key: "faculty_department",
          },
          {
            label: "Subject Code",
            key: "subject_code",
          },
          {
            label: "Subject Name",
            key: "subject_name",
          },
          {
            label: "Exam Date",
            key: "exam_date",
          },
          {
            label: "Start Time",
            key: "start_time",
          },
          {
            label: "End Time",
            key: "end_time",
          },
          {
            label: "Venue Name",
            key: "venue_name",
          },
          {
            label: "Building",
            key: "building",
          },
        ],
      },
    };

    const target = configs[reportType];

    if (!target) return;

    if (!target.data || target.data.length === 0) {
      alert("No records found for " + target.filename + ". Nothing to export.");
      return;
    }

    try {
      setExportingReport(reportType);

      const headerRow = target.headers
  .map(
    (h) =>
      '"' + h.label.replace(/"/g, '""') + '"'
  )
  .join(",");

      const rows = target.data.map((row) =>
        target.headers
          .map((h) => {
            let val = row[h.key];

            if (val === null || val === undefined) {
              val = "";
            }

            val = String(val).replace(/"/g, '""');

            return `"${val}"`;
          })
          .join(",")
      );

      const csvString = [
        headerRow,
        ...rows,
      ].join("\r\n");

      const blob = new Blob(
        [csvString],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.setAttribute("href", url);
      link.setAttribute("download", target.filename);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Error generating CSV export:",
        err
      );

      alert(
        "Failed to generate CSV export."
      );
    } finally {
      setTimeout(
        () => setExportingReport(""),
        500
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>
          <div className="inline-block px-3 py-1 bg-indigo-500/30 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
            Administrator Access
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="text-indigo-200 mt-1 text-sm">
            Welcome back,{" "}
            <span className="font-bold text-white">
              {user?.name}
            </span>{" "}
            ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() => setActiveTab("students")}
            className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>➕</span>
            Add Student
          </button>

          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer backdrop-blur-sm"
          >
            <span>🚪</span>
            Logout
          </button>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 mt-4">

        <button
          onClick={() => setActiveTab("students")}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>➕</span>
          Add Student
        </button>

        <button
          onClick={() => setActiveTab("faculty")}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>➕</span>
          Add Faculty
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>➕</span>
          Add Subject
        </button>

        <button
          onClick={() => setActiveTab("exams")}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>📅</span>
          Schedule Exam
        </button>

        <button
          onClick={() => setActiveTab("seating")}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>🪑</span>
          Generate Seating
        </button>

        <button
          onClick={() => setActiveTab("invigilation")}
          className="px-5 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>🕵️</span>
          Generate Invigilation
        </button>

      </div>

      {/* Dashboard Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Students
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.students}
            </p>
          </div>

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Faculty
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.faculty}
            </p>
          </div>

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Subjects
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.subjects}
            </p>
          </div>

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Venues
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.venues}
            </p>
          </div>

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Exams
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.exams}
            </p>
          </div>

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Seating Assignments
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.seatingAssignments}
            </p>
          </div>

          <div className="p-4 bg-indigo-100 rounded-xl shadow">
            <h3 className="text-sm font-medium text-indigo-800">
              Invigilation Assignments
            </h3>
            <p className="text-2xl font-bold text-indigo-900">
              {stats.invigilationAssignments}
            </p>
          </div>

        </div>
      )}

      {/* Upcoming Exams */}
      <div className="mt-6">

        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Upcoming Exams
        </h3>

        <div className="overflow-x-auto">

          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Subject
                </th>

                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Date
                </th>

                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Start Time
                </th>

                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  End Time
                </th>

              </tr>

            </thead>

            <tbody>

              {Array.isArray(upcomingExams) &&
                upcomingExams.map((exam) => (

                  <tr
                    key={exam._id}
                    className="border-t"
                  >

                    <td className="px-4 py-2 text-sm text-gray-800">
                      {exam.subject?.subject_name || "N/A"}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-800">
                      {new Date(
                        exam.exam_date
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-800">
                      {exam.start_time}
                    </td>

                    <td className="px-4 py-2 text-sm text-gray-800">
                      {exam.end_time}
                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-semibold text-gray-800">
            Recent Activity
          </h3>

          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            Latest 10 actions
          </span>

        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100 overflow-hidden">

          {Array.isArray(recentActivity) &&
          recentActivity.length > 0 ? (

            recentActivity.map((activity) => {

              const badgeMap = {

                Student: {
                  icon: "🎓",
                  style:
                    "bg-blue-50 text-blue-700 border-blue-200",
                },

                Faculty: {
                  icon: "👨‍🏫",
                  style:
                    "bg-indigo-50 text-indigo-700 border-indigo-200",
                },

                Subject: {
                  icon: "📚",
                  style:
                    "bg-purple-50 text-purple-700 border-purple-200",
                },

                Venue: {
                  icon: "🏛️",
                  style:
                    "bg-cyan-50 text-cyan-700 border-cyan-200",
                },

                Exam: {
                  icon: "📝",
                  style:
                    "bg-amber-50 text-amber-700 border-amber-200",
                },

                SeatingAssignment: {
                  icon: "🪑",
                  style:
                    "bg-emerald-50 text-emerald-700 border-emerald-200",
                },

                InvigilationAssignment: {
                  icon: "🕵️",
                  style:
                    "bg-slate-100 text-slate-700 border-slate-200",
                },
              };

              const meta =
                badgeMap[activity.type] || {
                  icon: "⚡",
                  style:
                    "bg-gray-100 text-gray-700 border-gray-200",
                };

              return (
                <div
                  key={
                    activity.id ||
                    `${activity.type}-${activity.timestamp}`
                  }
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/80 transition-colors"
                >

                  <div className="flex items-center gap-3">

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${meta.style}`}
                    >
                      <span>{meta.icon}</span>
                      <span>{activity.type}</span>
                    </span>

                    <span className="text-sm font-medium text-gray-800">
                      {activity.description}
                    </span>

                  </div>

                  <span className="text-xs text-gray-400 whitespace-nowrap self-end sm:self-auto">
                    {activity.timestamp
                      ? new Date(
                          activity.timestamp
                        ).toLocaleString()
                      : ""}
                  </span>

                </div>
              );
            })

          ) : (

            <div className="p-6 text-center text-sm text-gray-500">
              No recent activity recorded yet.
            </div>

          )}

        </div>
      </div>

      {/* Exam Status */}
      <div className="mt-6">

        <div className="flex items-center justify-between mb-4">

          <h3 className="text-lg font-semibold text-gray-800">
            Exam Status
          </h3>

          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {examStatuses.length} exam
            {examStatuses.length !== 1 ? "s" : ""}
          </span>

        </div>

        {examStatuses.length > 0 ? (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {examStatuses.map((exam) => {

              const statusConfig = {

                Upcoming: {
                  bg: "bg-blue-50",
                  border: "border-blue-200",
                  text: "text-blue-700",
                  badge:
                    "bg-blue-100 text-blue-800",
                  icon: "📅",
                },

                "Seating Generated": {
                  bg: "bg-amber-50",
                  border: "border-amber-200",
                  text: "text-amber-700",
                  badge:
                    "bg-amber-100 text-amber-800",
                  icon: "🪑",
                },

                "Invigilation Assigned": {
                  bg: "bg-indigo-50",
                  border: "border-indigo-200",
                  text: "text-indigo-700",
                  badge:
                    "bg-indigo-100 text-indigo-800",
                  icon: "🕵️",
                },

                Completed: {
                  bg: "bg-emerald-50",
                  border: "border-emerald-200",
                  text: "text-emerald-700",
                  badge:
                    "bg-emerald-100 text-emerald-800",
                  icon: "✅",
                },
              };

              const cfg =
                statusConfig[exam.status] ||
                statusConfig.Upcoming;

              const subjectName =
                exam.subject?.subject_name ||
                exam.subject_name ||
                "Unknown Subject";

              const subjectCode =
                exam.subject?.subject_code ||
                exam.subject_code ||
                "";

              const examKey =
                exam._id || exam.id;

              return (
                <div
                  key={examKey}
                  className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 shadow-sm hover:shadow-md transition-shadow`}
                >

                  <div className="flex items-start justify-between mb-3">

                    <div className="flex-1 min-w-0">

                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {subjectName}
                      </h4>

                      {subjectCode && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {subjectCode}
                        </p>
                      )}

                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${cfg.badge} whitespace-nowrap ml-2`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{exam.status}</span>
                    </span>

                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">

                    <div className="flex items-center gap-2">

                      <span className="font-medium text-gray-500">
                        Date:
                      </span>

                      <span className="font-semibold text-gray-800">
                        {exam.exam_date
                          ? new Date(
                              exam.exam_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </span>

                    </div>

                    <div className="flex items-center gap-2">

                      <span className="font-medium text-gray-500">
                        Time:
                      </span>

                      <span className="font-semibold text-gray-800">
                        {exam.start_time} –{" "}
                        {exam.end_time}
                      </span>

                    </div>

                  </div>

                  {(exam.seatingCount > 0 ||
                    exam.invigilationCount > 0) && (

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200/60">

                      {exam.seatingCount > 0 && (
                        <span className="text-xs text-gray-500">
                          🪑 {exam.seatingCount} seat
                          {exam.seatingCount !== 1
                            ? "s"
                            : ""}
                        </span>
                      )}

                      {exam.invigilationCount > 0 && (
                        <span className="text-xs text-gray-500">
                          🕵️ {exam.invigilationCount}{" "}
                          invigilator
                          {exam.invigilationCount !== 1
                            ? "s"
                            : ""}
                        </span>
                      )}

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        ) : (

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center text-sm text-gray-500">
            No exams found.
          </div>

        )}

      </div>

      {/* Alerts & Conflicts */}
      <div className="mt-6">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2">

            <h3 className="text-lg font-semibold text-gray-800">
              Alerts & Conflicts
            </h3>

            {alerts.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse">
                Action Required
              </span>
            )}

          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              alerts.length > 0
                ? "bg-rose-100 text-rose-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {alerts.length}{" "}
            {alerts.length === 1
              ? "alert"
              : "alerts"}
          </span>

        </div>

        {alerts.length > 0 ? (

          <div className="space-y-3">

            {alerts.map((alert) => {

              const severityStyles = {

                high: {
                  bg: "bg-rose-50",
                  border: "border-rose-200",
                  badge:
                    "bg-rose-100 text-rose-800 border-rose-200",
                  iconBg:
                    "bg-rose-200 text-rose-700",
                  icon: "🚨",
                },

                medium: {
                  bg: "bg-amber-50",
                  border: "border-amber-200",
                  badge:
                    "bg-amber-100 text-amber-800 border-amber-200",
                  iconBg:
                    "bg-amber-200 text-amber-700",
                  icon: "⚠️",
                },

                low: {
                  bg: "bg-blue-50",
                  border: "border-blue-200",
                  badge:
                    "bg-blue-100 text-blue-800 border-blue-200",
                  iconBg:
                    "bg-blue-200 text-blue-700",
                  icon: "ℹ️",
                },
              };

              const style =
                severityStyles[alert.severity] ||
                severityStyles.medium;

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${style.border} ${style.bg} shadow-xs flex items-start justify-between gap-4 transition-all`}
                >

                  <div className="flex items-start gap-3 min-w-0">

                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg} text-base`}
                    >
                      {style.icon}
                    </div>

                    <div className="min-w-0">

                      <div className="flex items-center gap-2 flex-wrap">

                        <h4 className="text-sm font-bold text-gray-900">
                          {alert.title}
                        </h4>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.badge} uppercase tracking-wider`}
                        >
                          {alert.type ||
                            alert.severity}
                        </span>

                      </div>

                      <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                        {alert.message}
                      </p>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        ) : (

          <div className="bg-white border border-emerald-200 rounded-xl shadow-xs p-6 flex items-center justify-center gap-3 text-emerald-800">

            <span className="text-xl">
              ✅
            </span>

            <div>

              <p className="text-sm font-bold">
                No alerts or conflicts
              </p>

              <p className="text-xs text-emerald-600 mt-0.5">
                All scheduled exams, student mappings,
                seating plans, and invigilation
                assignments are in order.
              </p>

            </div>

          </div>

        )}

      </div>

      {/* Reports & Export */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">

          <div>

            <div className="flex items-center gap-2">

              <h3 className="text-lg font-semibold text-gray-800">
                Reports & Export
              </h3>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                CSV Data Export
              </span>

            </div>

            <p className="text-xs text-gray-500 mt-1">
              Download system records in standard CSV format
              for audits, printing, and administrative analysis.
            </p>

          </div>

          {reportsLoading && (
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <span className="animate-spin">
                ⏳
              </span>
              Loading report data...
            </span>
          )}

        </div>

        {reportsError && (

          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">

            <span>{reportsError}</span>

            <button
              onClick={fetchReports}
              className="text-xs font-bold text-red-800 hover:underline ml-2 cursor-pointer"
            >
              Retry
            </button>

          </div>

        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Students Report */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">

            <div>

              <div className="flex items-center justify-between mb-2">

                <span className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                  🎓
                </span>

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-700">
                  {reportsData?.students
                    ? `${reportsData.students.length} records`
                    : "—"}
                </span>

              </div>

              <h4 className="text-sm font-bold text-gray-900">
                Students Report
              </h4>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Full student directory with register numbers,
                departments, years, and sections.
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">

              <button
                onClick={() =>
                  handleDownloadCSV("students")
                }
                disabled={
                  reportsLoading ||
                  exportingReport === "students"
                }
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>📥</span>

                <span>
                  {exportingReport === "students"
                    ? "Exporting..."
                    : "Download CSV"}
                </span>

              </button>

            </div>

          </div>

          {/* Exams Report */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">

            <div>

              <div className="flex items-center justify-between mb-2">

                <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold">
                  📝
                </span>

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-700">
                  {reportsData?.exams
                    ? `${reportsData.exams.length} records`
                    : "—"}
                </span>

              </div>

              <h4 className="text-sm font-bold text-gray-900">
                Exams Report
              </h4>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Scheduled exams timetable, subject codes, dates,
                and session start/end timings.
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">

              <button
                onClick={() =>
                  handleDownloadCSV("exams")
                }
                disabled={
                  reportsLoading ||
                  exportingReport === "exams"
                }
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>📥</span>

                <span>
                  {exportingReport === "exams"
                    ? "Exporting..."
                    : "Download CSV"}
                </span>

              </button>

            </div>

          </div>

          {/* Seating Report */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">

            <div>

              <div className="flex items-center justify-between mb-2">

                <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold">
                  🪑
                </span>

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700">
                  {reportsData?.seatingAssignments
                    ? `${reportsData.seatingAssignments.length} records`
                    : "—"}
                </span>

              </div>

              <h4 className="text-sm font-bold text-gray-900">
                Seating Assignments
              </h4>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Seat-by-seat student allocations across venues,
                exam schedules, and seat numbers.
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">

              <button
                onClick={() =>
                  handleDownloadCSV("seating")
                }
                disabled={
                  reportsLoading ||
                  exportingReport === "seating"
                }
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>📥</span>

                <span>
                  {exportingReport === "seating"
                    ? "Exporting..."
                    : "Download CSV"}
                </span>

              </button>

            </div>

          </div>

          {/* Invigilation Report */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">

            <div>

              <div className="flex items-center justify-between mb-2">

                <span className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-lg font-bold">
                  🕵️
                </span>

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-700">
                  {reportsData?.invigilationAssignments
                    ? `${reportsData.invigilationAssignments.length} records`
                    : "—"}
                </span>

              </div>

              <h4 className="text-sm font-bold text-gray-900">
                Invigilation Assignments
              </h4>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Faculty duty schedules, venue assignments,
                buildings, and exam session mappings.
              </p>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">

              <button
                onClick={() =>
                  handleDownloadCSV("invigilation")
                }
                disabled={
                  reportsLoading ||
                  exportingReport === "invigilation"
                }
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>📥</span>

                <span>
                  {exportingReport === "invigilation"
                    ? "Exporting..."
                    : "Download CSV"}
                </span>

              </button>

            </div>

          </div>

        </div>

      </div>

      {/* Module Navigation */}
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
          onClick={() =>
            setActiveTab("student-subjects")
          }
          className={`px-5 py-3 font-bold text-sm rounded-t-xl transition-all cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeTab === "student-subjects"
              ? "bg-white text-teal-600 border-teal-600 shadow-xs"
              : "bg-slate-50 text-slate-600 hover:text-slate-900 border-transparent"
          }`}
        >
          <span>🔗</span>
          <span>
            Student–Subject Mapping
          </span>
        </button>

      </div>

      {/* Admin Module Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

        {activeTab === "students" ? (

          <div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Student Management Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Faculty Management Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Subject Management Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Exam Management Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Venue Management Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Automatic Seating Generation Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Automatic Invigilation Generation Module
                </h2>

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

                <h2 className="text-xl font-bold text-slate-900">
                  Student–Subject Mapping Module
                </h2>

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