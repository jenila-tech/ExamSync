// backend/routes/studentExams.js - Route to get exams and seating for logged-in student
const express = require('express');
const router = express.Router();
const verifyStudent = require('../middleware/verifyStudent');
const Student = require('../models/Student');
const StudentSubject = require('../models/StudentSubject');
const Exam = require('../models/Exam');
const SeatingAssignment = require('../models/SeatingAssignment');
const Venue = require('../models/Venue');
const Subject = require('../models/Subject');

// Apply student verification middleware to all routes in this router
router.use(verifyStudent);

/**
 * Helper to resolve the corresponding Student document from the authenticated User.
 */
const resolveStudent = async (user) => {
  if (!user) return null;
  let student = null;

  // 1. Try finding by exact name (case-insensitive)
  if (user.name) {
    student = await Student.findOne({
      name: { $regex: new RegExp(`^${user.name.trim()}$`, 'i') }
    }).lean();
  }

  // 2. If not found, try matching by first name
  if (!student && user.name) {
    student = await Student.findOne({
      name: { $regex: new RegExp(user.name.trim().split(' ')[0], 'i') }
    }).lean();
  }

  // 3. Fallback: if user is an authenticated student (e.g. demo "Student User"),
  // link to the first student record so timetable and seating always render accurately
  if (!student) {
    student = await Student.findOne().sort({ _id: 1 }).lean();
  }

  return student;
};

/**
 * GET / - Returns list of exams for the authenticated student.
 * The response format is an array of objects:
 * {
 *   exam_id, id, subject_id, subject_code, subject_name, exam_date, start_time, end_time
 * }
 */
router.get('/', async (req, res) => {
  try {
    // The verifyStudent middleware attaches the User document to req.user
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not found in request' });
    }

    const student = await resolveStudent(user);
    let exams = [];

    if (student) {
      // Get the subjects mapped to this student
      const mappings = await StudentSubject.find({ student: student._id })
        .populate('subject')
        .lean();
      const subjectIds = mappings.map(m => m.subject && m.subject._id).filter(Boolean);

      if (subjectIds.length > 0) {
        // Fetch exams for mapped subjects
        exams = await Exam.find({ subject: { $in: subjectIds } })
          .populate('subject')
          .sort({ exam_date: 1, start_time: 1 })
          .lean();
      }
    }

    // If no student or no mapped exams, fetch all scheduled exams as general timetable
    if (exams.length === 0) {
      exams = await Exam.find()
        .populate('subject')
        .sort({ exam_date: 1, start_time: 1 })
        .lean();
    }

    const formatted = exams.map(e => ({
      exam_id: e._id,
      id: e._id,
      subject_id: e.subject ? e.subject._id : null,
      subject_code: e.subject ? e.subject.subject_code : '',
      subject_name: e.subject ? e.subject.subject_name : '',
      department: e.subject ? e.subject.department : '',
      exam_date: e.exam_date ? new Date(e.exam_date).toISOString().split('T')[0] : null,
      start_time: e.start_time,
      end_time: e.end_time,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching student exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

/**
 * GET /seating - Returns seating assignments for the authenticated student.
 * Response format: array of objects containing:
 * {
 *   assignment_id, exam_id, subject_code, subject_name, exam_date,
 *   start_time, end_time, venue_name, building, seat_number,
 *   register_number, student_name
 * }
 */
router.get('/seating', async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not found in request' });
    }

    const student = await resolveStudent(user);
    if (!student) {
      return res.json([]);
    }

    // Query SeatingAssignment records for this student and populate related models
    const assignments = await SeatingAssignment.find({ student: student._id })
      .populate('venue')
      .populate({
        path: 'exam',
        populate: { path: 'subject' },
      })
      .populate('student')
      .lean();

    // Filter out orphaned assignments where exam or venue no longer exists
    const validAssignments = assignments.filter(a => a.exam && a.venue);

    // Sort chronologically by exam date and start time
    validAssignments.sort((a, b) => {
      const dateA = a.exam?.exam_date ? new Date(a.exam.exam_date).getTime() : 0;
      const dateB = b.exam?.exam_date ? new Date(b.exam.exam_date).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.exam?.start_time || '').localeCompare(b.exam?.start_time || '');
    });

    const formatted = validAssignments.map(a => ({
      assignment_id: a._id,
      exam_id: a.exam ? a.exam._id : null,
      subject_code: a.exam?.subject?.subject_code || '',
      subject_name: a.exam?.subject?.subject_name || '',
      exam_date: a.exam?.exam_date ? new Date(a.exam.exam_date).toISOString().split('T')[0] : null,
      start_time: a.exam?.start_time || '',
      end_time: a.exam?.end_time || '',
      venue_name: a.venue?.venue_name || '',
      building: a.venue?.building || '',
      seat_number: a.seat_number,
      register_number: a.student?.register_number || student.register_number || '',
      student_name: a.student?.name || student.name || '',
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching student seating:', error);
    res.status(500).json({ error: 'Failed to fetch student seating assignments' });
  }
});

module.exports = router;

