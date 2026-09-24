const express = require("express");
const router = express.Router();
const logActivity = require('../utils/activityLogger');



const Subject = require("../models/Subject"); // Mongoose model
const verifyAdmin = require("../middleware/verifyAdmin");
// Authorization Middleware: Verify user has Admin role


// Apply verifyAdmin middleware to all subjects endpoints
router.use(verifyAdmin);

// 1. GET /subjects - Get all subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ _id: 1 });
    const mapped = subjects.map(s => ({
      id: s._id,
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      department: s.department,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching subjects (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// 2. GET /subjects/:id - Get single subject by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    const mapped = {
      id: subject._id,
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      department: subject.department,
    };
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching subject (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch subject" });
  }
});

// 3. POST /subjects - Add a subject
router.post("/", async (req, res) => {
  const { subject_code, subject_name, department } = req.body;

  if (!subject_code || !subject_name || !department) {
    return res.status(400).json({ error: "Subject code, subject name, and department are required" });
  }

  try {
    const newSubject = new Subject({
      subject_code: subject_code.trim().toUpperCase(),
      subject_name: subject_name.trim(),
      department: department.trim(),
    });
    const saved = await newSubject.save();
    const mapped = {
      id: saved._id,
      subject_code: saved.subject_code,
      subject_name: saved.subject_name,
      department: saved.department,
    };
    await logActivity({ action: 'Add', entityType: 'Subject', entityName: saved.subject_name, message: `New subject ${saved.subject_name} added` });
res.status(201).json(mapped);
  } catch (error) {
    console.error("Error adding subject (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Subject code already exists" });
    }
    res.status(500).json({ error: "Failed to add subject" });
  }
});

// 4. PUT /subjects/:id - Update a subject
router.put("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body
  }
  const { subject_code, subject_name, department } = req.body;

  if (!subject_code || !subject_name || !department) {
    return res.status(400).json({ error: "Subject code, subject name, and department are required" });
  }

  try {
    const updated = await Subject.findByIdAndUpdate(
      id,
      {
        subject_code: subject_code.trim().toUpperCase(),
        subject_name: subject_name.trim(),
        department: department.trim(),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Subject not found" });
    }
    const mapped = {
      id: updated._id,
      subject_code: updated.subject_code,
      subject_name: updated.subject_name,
      department: updated.department,
    };
    await logActivity({ action: 'Update', entityType: 'Subject', entityName: updated.subject_name, message: `Subject ${updated.subject_name} updated` });
    res.json(mapped);
  } catch (error) {
    console.error("Error updating subject (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Subject code already exists" });
    }
    res.status(500).json({ error: "Failed to update subject" });
  }
});

// 5. DELETE /subjects/:id - Delete a subject
router.delete("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body if needed
  }
  try {
    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Subject not found" });
    }
    const mapped = {
      id: deleted._id,
      subject_code: deleted.subject_code,
      subject_name: deleted.subject_name,
      department: deleted.department,
    };
    await logActivity({ action: 'Delete', entityType: 'Subject', entityName: deleted.subject_name, message: `Subject ${deleted.subject_name} deleted` });
res.json({ message: "Subject deleted successfully", subject: mapped });
  } catch (error) {
    console.error("Error deleting subject (MongoDB):", error);
    // Preserve foreign key constraint handling (unlikely in MongoDB, but keep for compatibility)
    if (error.code === "23503") {
      return res.status(400).json({
        error: "Cannot delete subject because it is assigned to existing exam schedules",
      });
    }
    res.status(500).json({ error: "Failed to delete subject" });
  }
});

module.exports = router;
