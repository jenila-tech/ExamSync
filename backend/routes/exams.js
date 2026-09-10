const express = require("express");
const router = express.Router();

const Exam = require("../models/Exam"); // Mongoose model
const Subject = require("../models/Subject"); // Mongoose model
// Authorization Middleware: Verify user has Admin role
const verifyAdmin = require("../middleware/verifyAdmin");

// Apply verifyAdmin middleware to all exam endpoints
router.use(verifyAdmin);

// Helper: get single exam with populated subject
const getJoinedExam = async (examId) => {
  const exam = await Exam.findById(examId).populate('subject');
  if (!exam) return null;
  return {
    id: exam._id,
    subject_id: exam.subject._id,
    subject_code: exam.subject.subject_code,
    subject_name: exam.subject.subject_name,
    department: exam.subject.department,
    exam_date: exam.exam_date.toISOString().split('T')[0],
    start_time: exam.start_time,
    end_time: exam.end_time,
  };
};

// 1. GET /exams - Get all exams with subject information
router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().populate('subject').sort({ exam_date: 1, start_time: 1 });
    const mapped = exams.map(e => ({
      id: e._id,
      subject_id: e.subject ? e.subject._id : null,
      subject_code: e.subject ? e.subject.subject_code : '',
      subject_name: e.subject ? e.subject.subject_name : '',
      department: e.subject ? e.subject.department : '',
      exam_date: e.exam_date ? e.exam_date.toISOString().split('T')[0] : null,
      start_time: e.start_time,
      end_time: e.end_time,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching exams (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});

// 2. GET /exams/:id - Get single exam with subject information
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const exam = await getJoinedExam(id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json(exam);
  } catch (error) {
    console.error("Error fetching exam (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch exam" });
  }
});

// 3. POST /exams - Add an exam
router.post("/", async (req, res) => {
  const { subject_id, exam_date, start_time, end_time } = req.body;

  if (!subject_id || !exam_date || !start_time || !end_time) {
    return res.status(400).json({
      error: "Subject, exam date, start time, and end time are required",
    });
  }

  try {
    // Validate subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(400).json({ error: "Invalid subject ID. Subject does not exist." });
    }

    // Validate time order
    if (start_time >= end_time) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    // Conflict detection on same date
    const examsOnDate = await Exam.find({ exam_date: new Date(exam_date) }).populate('subject');
    const conflict = examsOnDate.find(e => start_time < e.end_time && end_time > e.start_time);
    if (conflict) {
      return res.status(400).json({
        error: `Exam schedule conflict: Another exam (${conflict.subject.subject_code} - ${conflict.subject.subject_name} from ${conflict.start_time} to ${conflict.end_time}) is already scheduled on this date.`,
      });
    }

    const newExam = new Exam({
      subject: subject_id,
      exam_date: new Date(exam_date),
      start_time,
      end_time,
    });
    const saved = await newExam.save();
    const result = await getJoinedExam(saved._id);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding exam (MongoDB):", error);
    res.status(500).json({ error: "Failed to add exam" });
  }
});

// 4. PUT /exams/:id - Update an exam
router.put("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body
  }
  const { subject_id, exam_date, start_time, end_time } = req.body;

  if (!subject_id || !exam_date || !start_time || !end_time) {
    return res.status(400).json({
      error: "Subject, exam date, start time, and end time are required",
    });
  }

  try {
    // Check exam exists
    const existing = await Exam.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Validate subject exists
    const subject = await Subject.findById(subject_id);
    if (!subject) {
      return res.status(400).json({ error: "Invalid subject ID. Subject does not exist." });
    }

    // Validate time order
    if (start_time >= end_time) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    // Conflict detection excluding current exam
    const examsOnDate = await Exam.find({ exam_date: new Date(exam_date), _id: { $ne: id } }).populate('subject');
    const conflict = examsOnDate.find(e => start_time < e.end_time && end_time > e.start_time);
    if (conflict) {
      return res.status(400).json({
        error: `Exam schedule conflict: Another exam (${conflict.subject.subject_code} - ${conflict.subject.subject_name} from ${conflict.start_time} to ${conflict.end_time}) is already scheduled on this date.`,
      });
    }

    // Update fields
    existing.subject = subject_id;
    existing.exam_date = new Date(exam_date);
    existing.start_time = start_time;
    existing.end_time = end_time;
    await existing.save();

    const updated = await getJoinedExam(id);
    res.json(updated);
  } catch (error) {
    console.error("Error updating exam (MongoDB):", error);
    res.status(500).json({ error: "Failed to update exam" });
  }
});

// 5. DELETE /exams/:id - Delete an exam
router.delete("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body if needed
  }
  try {
    const deleted = await Exam.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Exam not found" });
    }
    res.json({ message: "Exam deleted successfully", exam: deleted });
  } catch (error) {
    console.error("Error deleting exam (MongoDB):", error);
    res.status(500).json({ error: "Failed to delete exam" });
  }
});

module.exports = router;
