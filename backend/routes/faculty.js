const express = require("express");
const router = express.Router();

const Faculty = require("../models/Faculty"); // Mongoose model

// Authorization Middleware: Verify user has Admin role
const verifyAdmin = require("../middleware/verifyAdmin");

// Apply verifyAdmin middleware to all faculty endpoints
router.use(verifyAdmin);

// 1. GET /faculty - Get all faculty members
// GET /faculty - Get all faculty members (MongoDB)
router.get("/", async (req, res) => {
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
// GET /faculty/:id - Get single faculty member by ID (MongoDB)
router.get("/:id", async (req, res) => {
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
// POST /faculty - Add a faculty member (MongoDB)
router.post("/", async (req, res) => {
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
// PUT /faculty/:id - Update a faculty member (MongoDB)
router.put("/:id", async (req, res) => {
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
// DELETE /faculty/:id - Delete a faculty member (MongoDB)
router.delete("/:id", async (req, res) => {
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
    res.json({ message: "Faculty member deleted successfully", faculty: mapped });
  } catch (error) {
    console.error("Error deleting faculty (MongoDB):", error);
    res.status(500).json({ error: "Failed to delete faculty member" });
  }
});

module.exports = router;
