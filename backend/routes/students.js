const express = require("express");
const router = express.Router();
const logActivity = require('../utils/activityLogger');
const verifyAdmin = require("../middleware/verifyAdmin");
const Student = require("../models/Student"); // Mongoose model
router.use(verifyAdmin);

// GET /students - Get all students (MongoDB)
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ _id: 1 });
    const mapped = students.map(s => ({
      id: s._id,
      register_number: s.register_number,
      name: s.name,
      department: s.department,
      year: s.year,
      section: s.section,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching students (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});


// GET /students/:id - Get single student by ID (MongoDB)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    const mapped = {
      id: student._id,
      register_number: student.register_number,
      name: student.name,
      department: student.department,
      year: student.year,
      section: student.section,
    };
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching student (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});


// POST /students - Add a student (MongoDB)
router.post("/", async (req, res) => {
  const { register_number, name, department, year, section } = req.body;

  if (!register_number || !name || !department || !year) {
    return res.status(400).json({ error: "Register number, name, department, and year are required" });
  }

  try {
    const newStudent = new Student({
      register_number: register_number.trim(),
      name: name.trim(),
      department: department.trim(),
      year: parseInt(year, 10),
      section: section ? section.trim() : "",
    });
    const saved = await newStudent.save();
    const mapped = {
      id: saved._id,
      register_number: saved.register_number,
      name: saved.name,
      department: saved.department,
      year: saved.year,
      section: saved.section,
    };
    await logActivity({ action: 'Add', entityType: 'Student', entityName: saved.name, message: `New student ${saved.name} added` });
res.status(201).json(mapped);
  } catch (error) {
    console.error("Error adding student (MongoDB):", error);
    if (error.code === 11000) { // duplicate key
      return res.status(400).json({ error: "Register number already exists" });
    }
    res.status(500).json({ error: "Failed to add student" });
  }
});


// PUT /students/:id - Update a student (MongoDB)
router.put("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body
  }
  const { register_number, name, department, year, section } = req.body;

  if (!register_number || !name || !department || !year) {
    return res.status(400).json({ error: "Register number, name, department, and year are required" });
  }

  try {
    const updated = await Student.findByIdAndUpdate(
      id,
      {
        register_number: register_number.trim(),
        name: name.trim(),
        department: department.trim(),
        year: parseInt(year, 10),
        section: section ? section.trim() : "",
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Student not found" });
    }
    const mapped = {
      id: updated._id,
      register_number: updated.register_number,
      name: updated.name,
      department: updated.department,
      year: updated.year,
      section: updated.section,
    };
    await logActivity({ action: 'Update', entityType: 'Student', entityName: updated.name, message: `Student ${updated.name} updated` });
res.json(mapped);
  } catch (error) {
    console.error("Error updating student (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Register number already exists" });
    }
    res.status(500).json({ error: "Failed to update student" });
  }
});


// DELETE /students/:id - Delete a student (MongoDB)
router.delete("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body if needed
  }
  try {
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Student not found" });
    }
    const mapped = {
      id: deleted._id,
      register_number: deleted.register_number,
      name: deleted.name,
      department: deleted.department,
      year: deleted.year,
      section: deleted.section,
    };
    await logActivity({ action: 'Delete', entityType: 'Student', entityName: deleted.name, message: `Student ${deleted.name} deleted` });
res.json({ message: "Student deleted successfully", student: mapped });
  } catch (error) {
    console.error("Error deleting student (MongoDB):", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});


module.exports = router;
