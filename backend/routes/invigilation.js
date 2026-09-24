// backend/routes/invigilation.js
const express = require('express');
const router = express.Router();


// Mongoose models
const Exam = require('../models/Exam');
const Faculty = require('../models/Faculty');
const Venue = require('../models/Venue');
const SeatingAssignment = require('../models/SeatingAssignment');
const InvigilationAssignment = require('../models/InvigilationAssignment');




const verifyAdmin = require("../middleware/verifyAdmin");

router.use(verifyAdmin);

// 1. POST /invigilation/generate – generate invigilation assignments for an exam
router.post('/generate', async (req, res) => {
  const { exam_id } = req.body;

  if (!exam_id) {
    return res.status(400).json({ error: 'Please select an exam.' });
  }

  try {
    // Validate exam exists and populate its subject
    const exam = await Exam.findById(exam_id).populate('subject').lean();
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    const examObj = {
      id: exam._id,
      subject_code: exam.subject?.subject_code,
      subject_name: exam.subject?.subject_name,
      subject_department: exam.subject?.department,
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
    };

    // STEP 1: Get distinct venues used in this exam's seating plan
    const seatingAssignments = await SeatingAssignment.find({ exam: exam_id })
      .populate('venue')
      .lean();
    const venueMap = new Map();
    seatingAssignments.forEach((sa) => {
      if (sa.venue) {
        const v = sa.venue;
        venueMap.set(v._id.toString(), {
          venue_id: v._id,
          venue_name: v.venue_name,
          building: v.building,
          capacity: v.capacity,
        });
      }
    });
    const venues = Array.from(venueMap.values());

    if (venues.length === 0) {
      return res.status(400).json({
        error: `No seating plan found for this exam (${examObj.subject_code} - ${examObj.subject_name}). Please generate a seating plan first.`,
      });
    }

    // STEP 2: Get all faculty members
    const facultyList = await Faculty.find().sort('_id').lean();
    if (facultyList.length === 0) {
      return res.status(400).json({
        error: 'No faculty members found in the database. Please add faculty members first.',
      });
    }

    // STEP 3: Ensure enough faculty for venues
    if (facultyList.length < venues.length) {
      return res.status(400).json({
        error: `Not enough faculty available for invigilation. Required venues: ${venues.length}, Available faculty: ${facultyList.length}. Please add more faculty members.`,
        required_venues: venues.length,
        available_faculty: facultyList.length,
        shortage: venues.length - facultyList.length,
      });
    }

    // Clean up any orphaned invigilation assignments whose exam document no longer exists
    const validExamIds = await Exam.distinct('_id');
    await InvigilationAssignment.deleteMany({ exam: { $nin: validExamIds } });

    // STEP 4: Conflict detection and fair distribution
    const allInvAssignments = await InvigilationAssignment.find()
      .populate('exam')
      .lean();
    const conflictingFacultyIds = new Set();
    allInvAssignments.forEach((ia) => {
      const e = ia.exam;
      if (!e) return;
      if (
        e.exam_date?.toISOString().split('T')[0] === examObj.exam_date?.toISOString().split('T')[0] &&
        e._id.toString() !== exam_id.toString() &&
        examObj.start_time < e.end_time &&
        examObj.end_time > e.start_time
      ) {
        conflictingFacultyIds.add(ia.faculty.toString());
      }
    });

    const availableFacultyList = facultyList.filter(
      (f) => !conflictingFacultyIds.has(f._id.toString())
    );

    const assignmentCounts = await InvigilationAssignment.aggregate([
      { $match: { faculty: { $in: availableFacultyList.map((f) => f._id) } } },
      { $group: { _id: '$faculty', assignment_count: { $sum: 1 } } },
    ]);
    const assignmentCountMap = new Map();
    assignmentCounts.forEach((doc) => {
      assignmentCountMap.set(doc._id.toString(), doc.assignment_count);
    });

    availableFacultyList.sort(
      (a, b) => (assignmentCountMap.get(a._id.toString()) || 0) - (assignmentCountMap.get(b._id.toString()) || 0)
    );

    if (availableFacultyList.length < venues.length) {
      return res.status(400).json({
        error: `Not enough available faculty members without schedule conflicts for this exam. Required venues: ${venues.length}, Non-conflicting faculty available: ${availableFacultyList.length}.`,
        required_venues: venues.length,
        available_faculty: availableFacultyList.length,
        conflicting_faculty_count: conflictingFacultyIds.size,
        shortage: venues.length - availableFacultyList.length,
      });
    }

    // Remove any existing assignments for this exam
    await InvigilationAssignment.deleteMany({ exam: exam_id });

    const assignments = [];
    for (let i = 0; i < venues.length; i++) {
      const venue = venues[i];
      const faculty = availableFacultyList[i];

      const newAssign = new InvigilationAssignment({
        exam: exam_id,
        venue: venue.venue_id,
        faculty: faculty._id,
      });
      const saved = await newAssign.save();

      assignments.push({
        id: saved._id,
        venue_id: venue.venue_id,
        venue_name: venue.venue_name,
        building: venue.building,
        faculty_id: faculty._id,
        faculty_name: faculty.name,
        faculty_department: faculty.department,
      });
    }

    res.status(201).json({
      message: 'Invigilation plan generated successfully!',
      exam: examObj,
      total_venues: venues.length,
      assigned_faculty_count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error('Error in invigilation generation:', error);
    res.status(500).json({ error: 'Internal server error during invigilation generation.' });
  }
});

// 2. GET /invigilation/:examId – fetch generated plan
router.get('/:examId', async (req, res) => {
  const { examId } = req.params;
  try {
    const plan = await InvigilationAssignment.find({ exam: examId })
      .populate('faculty')
      .populate({ path: 'venue' })
      .populate({
        path: 'exam',
        populate: { path: 'subject' },
      })
      .lean();
    const rows = plan.map((ia) => ({
      id: ia._id,
      exam_id: ia.exam._id,
      venue_id: ia.venue._id,
      faculty_id: ia.faculty._id,
      faculty_name: ia.faculty.name,
      faculty_department: ia.faculty.department,
      faculty_email: ia.faculty.email,
      venue_name: ia.venue.venue_name,
      building: ia.venue.building,
      venue_capacity: ia.venue.capacity,
      subject_code: ia.exam.subject?.subject_code,
      subject_name: ia.exam.subject?.subject_name,
      subject_department: ia.exam.subject?.department,
      exam_date: ia.exam.exam_date,
      start_time: ia.exam.start_time,
      end_time: ia.exam.end_time,
    }));
    res.json(rows);
  } catch (error) {
    console.error('Error fetching invigilation plan:', error);
    res.status(500).json({ error: 'Failed to fetch invigilation plan' });
  }
});

// 3. DELETE /invigilation/:examId – clear plan
router.delete('/:examId', async (req, res) => {
  const { examId } = req.params;
  try {
    const result = await InvigilationAssignment.deleteMany({ exam: examId });
    res.json({
      message: 'Invigilation plan cleared successfully.',
      count: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing invigilation plan:', error);
    res.status(500).json({ error: 'Failed to clear invigilation plan' });
  }
});

module.exports = router;
