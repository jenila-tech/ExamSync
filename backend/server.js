require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mongoose = require('./mongo');

const studentRoutes = require("./routes/students");
const authRoutes = require("./routes/auth");
const studentExamsRoutes = require("./routes/studentExams");
const facultyRoutes = require("./routes/faculty");
const subjectRoutes = require("./routes/subjects");
const examRoutes = require("./routes/exams");
const venueRoutes = require("./routes/venues");
const seatingRoutes = require("./routes/seating");
const studentSubjectRoutes = require("./routes/studentSubjects");
const invigilationRoutes = require("./routes/invigilation");
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'x-user-id', 'x-user-role'],
}));

app.use(express.json());

app.use("/students", studentRoutes);
app.use("/faculty", facultyRoutes);
app.use("/subjects", subjectRoutes);
app.use("/exams", examRoutes);
app.use("/venues", venueRoutes);
app.use("/seating", seatingRoutes);
app.use("/student-subjects", studentSubjectRoutes);
app.use("/invigilation", invigilationRoutes);
app.use("/auth", authRoutes);
app.use("/student-exams", studentExamsRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Examination Management System Backend is Running!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});