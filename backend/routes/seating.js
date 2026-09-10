// backend/routes/seating.js - Mongoose implementation of Automatic Seating
const express = require('express');
const router = express.Router();


// Mongoose models
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const StudentSubject = require('../models/StudentSubject');
const Venue = require('../models/Venue');
const SeatingAssignment = require('../models/SeatingAssignment');

const verifyAdmin = require("../middleware/verifyAdmin");

// Apply verifyAdmin middleware to all seating endpoints
router.use(verifyAdmin);

// Helper function to interleave students by department to avoid adjacent same‑department seating
const interleaveByDepartment = (studentsList) => {
  if (!studentsList || studentsList.length <= 1) return studentsList;

  // Group students by department
  const deptMap = {};
  for (const s of studentsList) {
    const dept = s.department ? s.department.trim().toUpperCase() : 'GENERAL';
    if (!deptMap[dept]) deptMap[dept] = [];
    deptMap[dept].push(s);
  }

  // Sort department names by queue length descending
  const depts = Object.keys(deptMap).sort((a, b) => deptMap[b].length - deptMap[a].length);

  // Round‑Robin Interleaving across department queues
  const result = [];
  let remaining = studentsList.length;
  while (remaining > 0) {
    let addedAny = false;
    for (const dept of depts) {
      if (deptMap[dept].length > 0) {
        result.push(deptMap[dept].shift());
        remaining--;
        addedAny = true;
      }
    }
    if (!addedAny) break;
  }
  return result;
};

// 1. POST /seating/generate – generate seating plan for an exam (MongoDB version)
router.post('/generate', async (req, res) => {
  const { exam_id } = req.body;

  // STEP 1: Validate exam_id
  if (!exam_id) {
    return res.status(400).json({ error: 'Please select an exam.' });
  }

  try {
    // STEP 2: Validate exam exists and populate subject information
    const exam = await Exam.findById(exam_id).populate('subject');
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    // STEP 3: Get students mapped to the exam's subject, ordered by register_number ASC
    const mappings = await StudentSubject.find({ subject: exam.subject._id }).populate('student');
    let rawStudents = mappings.map(m => m.student);
    rawStudents.sort((a, b) => a.register_number.localeCompare(b.register_number));
    if (rawStudents.length === 0) {
      return res.status(400).json({
        error: `No students are mapped to this subject (${exam.subject.subject_code} - ${exam.subject.subject_name}). Please map students in Student‑Subject Mapping first.`,
      });
    }

    // Apply Department Interleaving / Mixing algorithm
    const students = interleaveByDepartment(rawStudents);

    // STEP 4: Get all venues with capacity > 0 ordered by _id ASC
    const venues = await Venue.find({ capacity: { $gt: 0 } }).sort({ _id: 1 });
    if (venues.length === 0) {
      return res.status(400).json({ error: 'No venues available.' });
    }

    const total_students = students.length;

    // STEP 5‑11: Conflict check for venues on the same date & overlapping time
    const conflictingExams = await Exam.find({
      _id: { $ne: exam._id },
      exam_date: exam.exam_date,
      $or: [
        { start_time: { $lt: exam.end_time }, end_time: { $gt: exam.start_time } },
      ],
    }).select('_id');

    const conflictingVenueIds = new Set();
    for (const cExam of conflictingExams) {
      const assignments = await SeatingAssignment.find({ exam: cExam._id }).select('venue');
      assignments.forEach(a => conflictingVenueIds.add(a.venue.toString()));
    }

    // Filter out venues with schedule conflicts
    const availableVenues = venues.filter(v => !conflictingVenueIds.has(v._id.toString()));
    const total_capacity = availableVenues.reduce((sum, v) => sum + v.capacity, 0);
    const shortage = total_students - total_capacity;

    if (availableVenues.length === 0 || total_capacity < total_students) {
      const conflictMsg = conflictingVenueIds.size > 0
        ? ` (${conflictingVenueIds.size} venue(s) unavailable due to schedule conflicts on this date & time)`
        : '';
      return res.status(400).json({
        error: `Not enough non‑conflicting venue capacity. ${shortage > 0 ? shortage + ' more seats are required.' : ''}${conflictMsg}`,
        total_students,
        total_capacity,
        available_venues_count: availableVenues.length,
        conflicting_venues_count: conflictingVenueIds.size,
        shortage: shortage > 0 ? shortage : 0,
      });
    }

    // STEP 6: Clear any existing seating assignments for this exam
    await SeatingAssignment.deleteMany({ exam: exam._id });

    // STEP 7‑10: Assign students to available venues
    let studentIndex = 0;
    const bulkDocs = [];
    for (const venue of availableVenues) {
      if (studentIndex >= students.length) break;
      const seatsToAssign = Math.min(venue.capacity, students.length - studentIndex);
      for (let seatNum = 1; seatNum <= seatsToAssign; seatNum++) {
        const student = students[studentIndex];
        bulkDocs.push({
          exam: exam._id,
          student: student._id,
          venue: venue._id,
          seat_number: seatNum,
        });
        studentIndex++;
      }
    }
    if (bulkDocs.length > 0) {
      await SeatingAssignment.insertMany(bulkDocs);
    }

    // STEP 12: Return summary result (mirroring previous SQL response shape)
    const examInfo = {
      id: exam._id,
      subject_id: exam.subject._id,
      subject_code: exam.subject.subject_code,
      subject_name: exam.subject.subject_name,
      department: exam.subject.department,
      exam_date: exam.exam_date.toISOString().split('T')[0],
      start_time: exam.start_time,
      end_time: exam.end_time,
    };

    res.status(201).json({
      message: 'Seating plan generated successfully!',
      exam: examInfo,
      total_students,
      total_capacity,
      assignments_count: studentIndex,
      assigned_venues_count: availableVenues.length,
    });
  } catch (error) {
    console.error('Error in seating generation:', error);
    res.status(500).json({ error: 'Internal server error during seating generation.' });
  }
});

// 2. GET /seating/:examId – fetch generated seating assignments (MongoDB version)
router.get('/:examId', async (req, res) => {
  const { examId } = req.params;
  try {
    const assignments = await SeatingAssignment.find({ exam: examId })
      .populate({ path: 'student' })
      .populate({ path: 'venue' })
      .populate({
        path: 'exam',
        populate: { path: 'subject' },
      })
      .sort({ 'venue.venue_name': 1, seat_number: 1 });

    const rows = assignments.map(a => ({
      id: a._id,
      exam_id: a.exam._id,
      student_id: a.student._id,
      venue_id: a.venue._id,
      seat_number: a.seat_number,
      register_number: a.student.register_number,
      student_name: a.student.name,
      student_department: a.student.department,
      year: a.student.year,
      section: a.student.section,
      venue_name: a.venue.venue_name,
      building: a.venue.building,
      venue_capacity: a.venue.capacity,
      subject_id: a.exam.subject._id,
      subject_code: a.exam.subject.subject_code,
      subject_name: a.exam.subject.subject_name,
      subject_department: a.exam.subject.department,
      exam_date: a.exam.exam_date.toISOString().split('T')[0],
      start_time: a.exam.start_time,
      end_time: a.exam.end_time,
    }));

    res.json(rows);
  } catch (error) {
    console.error('Error fetching seating plan:', error);
    res.status(500).json({ error: 'Failed to fetch seating plan' });
  }
});

// 3. DELETE /seating/:examId – clear seating assignments for an exam (MongoDB version)
router.delete('/:examId', async (req, res) => {
  const { examId } = req.params;
  try {
    const result = await SeatingAssignment.deleteMany({ exam: examId });
    res.json({
      message: 'Seating plan cleared successfully.',
      count: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing seating plan:', error);
    res.status(500).json({ error: 'Failed to clear seating plan' });
  }
});

module.exports = router;
