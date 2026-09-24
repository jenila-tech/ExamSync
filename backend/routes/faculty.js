const express = require("express");
const router = express.Router();
const logActivity = require('../utils/activityLogger');

const Faculty = require("../models/Faculty"); // Mongoose model
const Exam = require("../models/Exam");
const verifyFaculty = require("../middleware/verifyFaculty");
const InvigilationAssignment = require("../models/InvigilationAssignment");

// Authorization Middleware: Verify user has Admin role
const verifyAdmin = require("../middleware/verifyAdmin");

// Apply verifyAdmin middleware to admin endpoints individually
// New endpoint for faculty to view their invigilation assignments
router.get('/invigilation', verifyFaculty, async (req, res) => {
  try {
    // Purge any orphaned invigilation assignments whose exam no longer exists
    const validExamIds = await Exam.distinct('_id');
    await InvigilationAssignment.deleteMany({ exam: { $nin: validExamIds } });

    const faculty = req.faculty;
    const assignments = await InvigilationAssignment.find({ faculty: faculty._id })
      .populate({
        path: 'exam',
        populate: { path: 'subject' }
      })
      .populate('venue')
      .lean();

    const validAssignments = assignments.filter((ia) => ia.exam != null);

    const rows = validAssignments.map((ia) => ({
      exam_id: ia.exam._id,
      subject_code: ia.exam.subject?.subject_code,
      subject_name: ia.exam.subject?.subject_name,
      exam_date: ia.exam.exam_date,
      start_time: ia.exam.start_time,
      end_time: ia.exam.end_time,
      venue_name: ia.venue?.venue_name,
      building: ia.venue?.building,
      venue_capacity: ia.venue?.capacity,
      faculty_name: faculty.name,
    }));

    res.json(rows);
  } catch (error) {
    console.error('Error fetching faculty invigilation assignments:', error);
    res.status(500).json({ error: 'Failed to fetch invigilation assignments' });
  }
});

// 1. GET /faculty - Get all faculty members
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ _id: 1 });
    const mapped = faculty.map(f => ({
      id: f._id,
      name: f.name,
      department: f.department,
      email: f.email,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching faculty (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch faculty" });
  }
});

// 2. GET /faculty/:id - Get single faculty member by ID
router.get("/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty member not found" });
    }
    const mapped = {
      id: faculty._id,
      name: faculty.name,
      department: faculty.department,
      email: faculty.email,
    };
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching faculty (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch faculty member" });
  }
});

// 3. POST /faculty - Add a faculty member
router.post("/", verifyAdmin, async (req, res) => {
  const { name, department, email } = req.body;

  if (!name || !department || !email) {
    return res.status(400).json({ error: "Name, department, and email are required" });
  }

  try {
    const newFaculty = new Faculty({
      name: name.trim(),
      department: department.trim(),
      email: email.trim().toLowerCase(),
    });
    const saved = await newFaculty.save();
    const mapped = {
      id: saved._id,
      name: saved.name,
      department: saved.department,
      email: saved.email,
    };
    await logActivity({ action: 'Add', entityType: 'Faculty', entityName: saved.name, message: `New faculty ${saved.name} added` });
res.status(201).json(mapped);
  } catch (error) {
    console.error("Error adding faculty (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Faculty email already exists" });
    }
    res.status(500).json({ error: "Failed to add faculty member" });
  }
});

// 4. PUT /faculty/:id - Update a faculty member
router.put("/:id", verifyAdmin, async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body
  }
  const { name, department, email } = req.body;

  if (!name || !department || !email) {
    return res.status(400).json({ error: "Name, department, and email are required" });
  }

  try {
    const updated = await Faculty.findByIdAndUpdate(
      id,
      { name: name.trim(), department: department.trim(), email: email.trim().toLowerCase() },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Faculty member not found" });
    }
    const mapped = {
      id: updated._id,
      name: updated.name,
      department: updated.department,
      email: updated.email,
    };
    await logActivity({ action: 'Update', entityType: 'Faculty', entityName: updated.name, message: `Faculty ${updated.name} updated` });
res.json(mapped);
  } catch (error) {
    console.error("Error updating faculty (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Faculty email already exists" });
    }
    res.status(500).json({ error: "Failed to update faculty member" });
  }
});

// 5. DELETE /faculty/:id - Delete a faculty member
router.delete("/:id", verifyAdmin, async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body if needed
  }
  try {
    const deleted = await Faculty.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Faculty member not found" });
    }
    const mapped = {
      id: deleted._id,
      name: deleted.name,
      department: deleted.department,
      email: deleted.email,
    };
    await logActivity({ action: 'Delete', entityType: 'Faculty', entityName: deleted.name, message: `Faculty ${deleted.name} deleted` });
res.json({ message: "Faculty member deleted successfully", faculty: mapped });
  } catch (error) {
    console.error("Error deleting faculty (MongoDB):", error);
    res.status(500).json({ error: "Failed to delete faculty member" });
  }
});

module.exports = router;
