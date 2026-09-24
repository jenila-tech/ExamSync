# Examination Seating and Invigilation Management System

An automated, full-stack web application designed to streamline academic examination logistics, automated student seating allocation, faculty invigilation assignment, and conflict detection.

---

## 1. Project Overview
The **Examination Seating and Invigilation Management System** simplifies the complex administration involved in conducting institution-wide examinations. It automates student seat allocation across multiple halls, assigns invigilation duties fairly to available faculty members, detects scheduling conflicts in real time, and provides dedicated portals for Administrators, Faculty, and Students.

---

## 2. Problem Statement
Manual management of examination seating plans and invigilation rosters is highly labor-intensive, error-prone, and inefficient. Institutions frequently face:
- **Scheduling Conflicts:** Double-booking exam halls or assigning faculty to multiple overlapping exam shifts.
- **Uneven Workload Distribution:** Unfair distribution of invigilation duties among faculty members.
- **Inconvenient Communication:** Difficulty in communicating seat numbers and exam hall locations to students in advance.
- **Lack of Real-time Oversight:** Inability to track changes, activity logs, and venue utilization metrics effectively.

---

## 3. Objectives
- **Automation:** Automatically generate seating arrangements and faculty invigilation rosters with a single click.
- **Conflict Prevention:** Detect and prevent overlapping exam times and faculty schedule conflicts.
- **Fair Distribution:** Ensure equal distribution of invigilation duties among faculty members.
- **Role-Based Access:** Provide distinct, secure interfaces tailored for Admins, Faculty, and Students.
- **Data Integrity & Exporting:** Maintain activity logs and allow report downloads (CSV/Print) for institutional compliance.

---

## 4. Key Features
- ⚡ **Automatic Seating Plan Generation:** Sequentially allocates enrolled students to available venues based on hall capacity.
- 👨‍🏫 **Automatic Invigilation Roster Assignment:** Assigns available faculty to exam halls while avoiding schedule overlaps.
- 🛡️ **Built-in Conflict Detection:** Prevents exam time overlaps on identical dates and flags faculty availability conflicts.
- 📊 **Interactive Admin Dashboard:** Overview cards for total students, faculty, subjects, venues, exams, and activity logs.
- 🎫 **Digital Student Hall Tickets:** Students can view their assigned exam dates, venues, seating positions, and print digital tickets.
- 📋 **Faculty Duty Rosters:** Faculty members can view assigned invigilation duties, venue details, and print shift schedules.
- 📥 **CSV Data Exports:** Download reports for seating allocations and invigilation rosters.
- 🔄 **Cascade Deletion Cleanup:** Deleting an exam automatically cleans up linked seating and invigilation records to prevent orphaned data.

---

## 5. User Roles – Admin, Faculty, Student

| Role | Responsibilities & Access |
|------|---------------------------|
| **Admin** | Full system control: Manage Students, Faculty, Subjects, Venues, Exams, Student-Subject Mappings, generate Seating Plans, generate Invigilation Rosters, view Activity Logs, and export reports. |
| **Faculty** | View personal profile, view assigned invigilation duties (exam date, time, venue, building, capacity), and print duty schedules. |
| **Student** | View personal profile, enrolled subjects, personalized upcoming exam schedule, assigned venue/hall position, and print hall tickets. |

---

## 6. Technology Stack – React, Node.js, Express.js, MongoDB, Mongoose

- **Frontend:**
  - **Framework:** React.js (built with Vite)
  - **Styling:** Vanilla CSS & Modern Responsive UI Components
  - **Icons:** Emoji & SVG UI elements
- **Backend:**
  - **Runtime:** Node.js
  - **Framework:** Express.js
  - **Database ODM:** Mongoose (MongoDB)
- **Database & Security:**
  - **Database:** MongoDB (Local / Atlas connection supported)
  - **Authentication:** Role-based access control with bcrypt password hashing.

---

## 7. System Modules

1. **Auth Module:** Role-based login and session handling for Admin, Faculty, and Student users.
2. **Student Management:** Add, edit, delete, search, and list student records.
3. **Faculty Management:** Manage faculty directory, departments, and contact details.
4. **Subject Management:** Create and maintain academic course codes, names, and departments.
5. **Venue Management:** Register exam halls, building names, and seating capacities.
6. **Exam Scheduling:** Schedule dates, start times, and end times for course examinations with conflict checks.
7. **Student-Subject Mapping:** Enroll students into specific course subjects.
8. **Seating Allocation Module:** Generate, view, and clear venue seating assignments for scheduled exams.
9. **Invigilation Module:** Auto-assign non-conflicting faculty to exam venues based on room counts and workload fairness.
10. **Activity Logger:** Audit trail recording creation, updates, and deletions across system entities.

---

## 8. Automatic Seating Generation
The seating engine operates using the following logic:
1. Validates that the selected exam exists and has enrolled students mapped via Student-Subject mappings.
2. Fetches available exam venues sorted by capacity.
3. Clears any existing seating plan for the specified exam.
4. Sequentially maps enrolled students into venues until hall capacities are filled.
5. Persists the generated `SeatingAssignment` documents into MongoDB.

---

## 9. Automatic Invigilation Assignment
The invigilation assignment algorithm operates using the following steps:
1. Identifies distinct venues required for an exam based on its generated seating plan.
2. Verifies that sufficient total faculty exist to cover all required venues.
3. Detects schedule conflicts by checking if a faculty member is already invigilating another exam on the same date with overlapping times.
4. Ranks available, non-conflicting faculty based on their current invigilation duty count to promote fair workload distribution.
5. Assigns top-ranked faculty to venues and saves `InvigilationAssignment` records.

---

## 10. Conflict Detection
The system enforces validation rules to guarantee smooth operations:
- **Exam Schedule Conflicts:** Prevents scheduling two exams for overlapping time windows on the same date.
- **Faculty Availability Conflicts:** Excludes faculty members from invigilation assignment if they have an overlapping duty shift.
- **Orphan Cleanup:** Automatically removes stale invigilation assignments if an exam document is deleted or regenerated.

---

## 11. Student Portal Features
- **Student Dashboard:** Displays student name, email, department, and roll number.
- **Enrolled Subjects:** Lists all registered courses for the current term.
- **Exam Timetable:** Chronological timeline of upcoming exams.
- **Seat Allocation Details:** Displays assigned venue, building, and seat details once generated.
- **Printable Hall Ticket:** One-click option to print official examination hall tickets.

---

## 12. Faculty Portal Features
- **Faculty Dashboard:** Displays faculty profile and active schedule summary.
- **Assigned Duties Counter:** Real-time count of total allocated invigilation sessions.
- **Detailed Duties Roster:** Table detailing subject code, course name, exam date, shift timings, venue hall, building, and hall capacity.
- **Printable Schedule:** One-click option to print duty rosters for notice boards or personal records.

---

## 13. Project Structure

```
exam-seating-invigilation-system/
├── backend/
│   ├── middleware/
│   │   ├── verifyAdmin.js
│   │   ├── verifyFaculty.js
│   │   └── verifyStudent.js
│   ├── models/
│   │   ├── Activity.js
│   │   ├── Exam.js
│   │   ├── Faculty.js
│   │   ├── InvigilationAssignment.js
│   │   ├── SeatingAssignment.js
│   │   ├── Student.js
│   │   ├── StudentSubject.js
│   │   ├── Subject.js
│   │   ├── User.js
│   │   └── Venue.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── exams.js
│   │   ├── faculty.js
│   │   ├── invigilation.js
│   │   ├── seating.js
│   │   ├── studentExams.js
│   │   ├── studentSubjects.js
│   │   ├── students.js
│   │   ├── subjects.js
│   │   └── venues.js
│   ├── utils/
│   │   └── activityLogger.js
│   ├── mongo.js
│   ├── seedMongo.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ExamManagement.jsx
│   │   │   ├── FacultyDashboard.jsx
│   │   │   ├── FacultyManagement.jsx
│   │   │   ├── InvigilationManagement.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── SeatingManagement.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentManagement.jsx
│   │   │   ├── StudentSubjectMapping.jsx
│   │   │   ├── SubjectManagement.jsx
│   │   │   └── VenueManagement.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 14. Installation and Setup

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (Running locally on port 27017 or Atlas URI)

### Backend Setup
1. Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

2. Configure Environment Variables (`backend/.env`):
```env
MONGO_PASSWORD=YourMongoPassword
```

3. Seed default users (optional) and start the server:
```bash
node seedMongo.js
node server.js
```
*(Server will run on http://localhost:5000)*

### Frontend Setup
1. Open a new terminal, navigate to the frontend directory, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
*(Frontend will run on http://localhost:5173)*

---

## 15. Demo Login Credentials (Seeded Demo Accounts)

| Role | Email | Password |
|------|-------|----------|
| **System Admin** | `admin@exam.com` | `admin123` |
| **Faculty Member** | `faculty@exam.com` | `faculty123` |
| **Student User** | `student@exam.com` | `student123` |

---

## 16. Future Enhancements
- 📱 **QR Code Verification:** Add scannable QR codes on digital hall tickets for instant entry verification at exam hall doors.
- 📧 **Automated Email Notifications:** Send email alerts to faculty members upon assignment or rescheduling of invigilation duties.
- 🏢 **Multi-Shift & Multi-Block Support:** Support complex venue building hierarchies, sub-floors, and multi-shift exam periods.
- 📊 **Advanced Analytics:** Detailed visual charts on hall capacity usage, faculty duty metrics, and room utilization rates.
