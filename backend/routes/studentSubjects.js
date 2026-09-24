// backend/routes/studentSubjects.js - Migrated to MongoDB (Mongoose)
const express = require("express");
const router = express.Router();
const logActivity = require('../utils/activityLogger');
// PostgreSQL fallback (kept for backup, not used in this migration)


// Mongoose models
const StudentSubject = require("../models/StudentSubject");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

// Authorization Middleware: Verify user has Admin role (unchanged)
const verifyAdmin = require("../middleware/verifyAdmin");

router.use(verifyAdmin);

// Helper to format mapping with populated fields
const formatMapping = (doc) => {
  return {
    id: doc._id,
    student_id: doc.student ? doc.student._id : null,
    subject_id: doc.subject ? doc.subject._id : null,
    // flattened student details
    register_number: doc.student ? doc.student.register_number : null,
    student_name: doc.student ? doc.student.name : null,
    student_department: doc.student ? doc.student.department : null,
    // flattened subject details
    subject_code: doc.subject ? doc.subject.subject_code : null,
    subject_name: doc.subject ? doc.subject.subject_name : null,
    subject_department: doc.subject ? doc.subject.department : null,
  };
};

// 1. GET /student-subjects - Get all mappings
router.get("/", async (req, res) => {
  try {
    const mappings = await StudentSubject.find()
      .populate("student")
      .populate("subject")
      .lean();
    const formatted = mappings.map(formatMapping);
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching student-subject mappings (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch student-subject mappings" });
  }
});

// 2. GET /student-subjects/:id - Get single mapping
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await StudentSubject.findById(id)
      .populate("student")
      .populate("subject")
      .lean();
    if (!doc) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    res.json(formatMapping(doc));
  } catch (error) {
    console.error("Error fetching mapping (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch mapping" });
  }
});

// 3. POST /student-subjects - Create a new mapping
router.post("/", async (req, res) => {
  const { student_id, subject_id } = req.body;
  if (!student_id || !subject_id) {
    return res.status(400).json({ error: "Student and Subject are required" });
  }
  try {
    // Validate existence of referenced documents
    const [student, subject] = await Promise.all([
      Student.findById(student_id).lean(),
      Subject.findById(subject_id).lean(),
    ]);
    if (!student) {
      return res.status(400).json({ error: "Invalid student ID. Student does not exist." });
    }
    if (!subject) {
      return res.status(400).json({ error: "Invalid subject ID. Subject does not exist." });
    }
    const newMapping = new StudentSubject({ student: student_id, subject: subject_id });
    const saved = await newMapping.save();
    const populated = await StudentSubject.findById(saved._id)
      .populate("student")
      .populate("subject")
      .lean();
    res.status(201).json(formatMapping(populated));
  } catch (error) {
    console.error("Error creating student-subject mapping (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "This student is already mapped to the selected subject." });
    }
    res.status(500).json({ error: "Failed to create student-subject mapping" });
  }
});

// 4. PUT /student-subjects/:id - Update an existing mapping
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { student_id, subject_id } = req.body;
  if (!student_id || !subject_id) {
    return res.status(400).json({ error: "Student and Subject are required" });
  }
  try {
    // Ensure mapping exists
    const exists = await StudentSubject.findById(id);
    if (!exists) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    // Validate referenced documents
    const [student, subject] = await Promise.all([
      Student.findById(student_id).lean(),
      Subject.findById(subject_id).lean(),
    ]);
    if (!student) {
      return res.status(400).json({ error: "Invalid student ID. Student does not exist." });
    }
    if (!subject) {
      return res.status(400).json({ error: "Invalid subject ID. Subject does not exist." });
    }
    const updated = await StudentSubject.findByIdAndUpdate(
      id,
      { student: student_id, subject: subject_id },
      { new: true, runValidators: true }
    )
      .populate("student")
      .populate("subject")
      .lean();
    await logActivity({ action: 'Update', entityType: 'StudentSubject', entityName: `${updated.student?.name || ''} - ${updated.subject?.subject_name || ''}`, message: `Student-Subject mapping updated` });
    res.json(formatMapping(updated));
  } catch (error) {
    console.error("Error updating mapping (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "This student is already mapped to the selected subject." });
    }
    res.status(500).json({ error: "Failed to update student-subject mapping" });
  }
});

// 5. DELETE /student-subjects/:id - Delete a mapping
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await StudentSubject.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: "Mapping not found" });
    }
    await logActivity({ action: 'Delete', entityType: 'StudentSubject', entityName: `${deleted.student?.name || ''} - ${deleted.subject?.subject_name || ''}`, message: `Student-Subject mapping deleted` });
    res.json({ message: "Student-Subject mapping deleted successfully", mapping: formatMapping(deleted) });
  } catch (error) {
    console.error("Error deleting mapping (MongoDB):", error);
    res.status(500).json({ error: "Failed to delete mapping" });
  }
});

module.exports = router;
