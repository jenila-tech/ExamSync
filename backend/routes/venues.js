const express = require("express");
const router = express.Router();
const logActivity = require('../utils/activityLogger');
const Venue = require("../models/Venue"); // Mongoose model
const Exam = require("../models/Exam");
const SeatingAssignment = require("../models/SeatingAssignment");
// Authorization Middleware: Verify user has Admin role
const verifyAdmin = require("../middleware/verifyAdmin");

// Apply verifyAdmin middleware to all venue endpoints
router.use(verifyAdmin);

// 1. GET /venues - Get all venues (optional ?exam_id=... to include schedule conflict status)
router.get("/", async (req, res) => {
  const { exam_id } = req.query;
  try {
    // Fetch venues from MongoDB
    const venuesRaw = await Venue.find().sort({ _id: 1 }).lean();
    // Map MongoDB _id to id for frontend compatibility
    const venues = venuesRaw.map(v => ({
      id: v._id,
      venue_name: v.venue_name,
      building: v.building,
      capacity: v.capacity,
      // conflict fields will be added later if needed
    }));

    // If exam_id is provided, augment venues with conflict info using MongoDB
    if (exam_id) {
      // Load the target exam
      const targetExam = await Exam.findById(exam_id).lean();
      if (!targetExam) {
        // Exam not found – skip conflict augmentation (mirrors original behaviour when no rows)
        // Continue with regular venue list
      } else {
        // Helper to convert "HH:MM" to minutes since midnight
        const toMinutes = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const targetStart = toMinutes(targetExam.start_time);
        const targetEnd = toMinutes(targetExam.end_time);
        const targetDateStr = targetExam.exam_date.toISOString().split('T')[0]; // YYYY-MM-DD

        // Find all seating assignments whose exams are on the same date and overlap in time
        const assignments = await SeatingAssignment.find()
          .populate({
            path: 'exam',
            select: 'exam_date start_time end_time subject',
          })
          .populate({
            path: 'exam.subject',
            select: 'subject_code subject_name',
          })
          .lean();

        const conflictMap = new Map();
        assignments.forEach((a) => {
          const exam = a.exam;
          if (!exam) return;
          // Skip the same exam
          if (exam._id.toString() === exam_id) return;
          // Date must match
          const examDateStr = exam.exam_date.toISOString().split('T')[0];
          if (examDateStr !== targetDateStr) return;
          // Time overlap check
          const start = toMinutes(exam.start_time);
          const end = toMinutes(exam.end_time);
          if (targetStart < end && targetEnd > start) {
            const venueId = a.venue.toString();
            conflictMap.set(venueId, {
              subject_code: exam.subject?.subject_code,
              subject_name: exam.subject?.subject_name,
              start_time: exam.start_time,
              end_time: exam.end_time,
            });
          }
        });

        // Add conflict fields to each venue
        venues.forEach((v) => {
          const conflict = conflictMap.get(v.id.toString());
          v.is_conflicting = !!conflict;
          v.conflicting_exam = conflict
            ? `${conflict.subject_code} - ${conflict.subject_name} (${conflict.start_time}-${conflict.end_time})`
            : null;
        });
      }
    }
    res.json(venues);
  } catch (error) {
    console.error("Error fetching venues (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch venues" });
  }
});

// 2. GET /venues/:id - Get single venue by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const venue = await Venue.findById(id).lean();
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    const mapped = {
      id: venue._id,
      venue_name: venue.venue_name,
      building: venue.building,
      capacity: venue.capacity,
    };
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching venue (MongoDB):", error);
    res.status(500).json({ error: "Failed to fetch venue" });
  }
});

// 3. POST /venues - Add a venue
router.post("/", async (req, res) => {
  const { venue_name, building, capacity } = req.body;

  if (!venue_name || capacity === undefined || capacity === null || capacity === "") {
    return res.status(400).json({ error: "Venue name and capacity are required" });
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ error: "Capacity must be a positive number greater than 0" });
  }

  try {
    const newVenue = new Venue({
      venue_name: venue_name.trim(),
      building: building ? building.trim() : "",
      capacity: parsedCapacity,
    });
    const saved = await newVenue.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error adding venue (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Venue name already exists" });
    }
    res.status(500).json({ error: "Failed to add venue" });
  }
});

// 4. PUT /venues/:id - Update a venue
router.put("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body
  }
  const { venue_name, building, capacity } = req.body;

  if (!venue_name || capacity === undefined || capacity === null || capacity === "") {
    return res.status(400).json({ error: "Venue name and capacity are required" });
  }

  const parsedCapacity = parseInt(capacity, 10);
  if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
    return res.status(400).json({ error: "Capacity must be a positive number greater than 0" });
  }

  try {
    const updated = await Venue.findByIdAndUpdate(
      id,
      {
        venue_name: venue_name.trim(),
        building: building ? building.trim() : "",
        capacity: parsedCapacity,
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return res.status(404).json({ error: "Venue not found" });
    }
    // Map MongoDB _id to id for frontend compatibility
    const response = {
      id: updated._id,
      venue_name: updated.venue_name,
      building: updated.building,
      capacity: updated.capacity,
    };
await logActivity({ action: 'Update', entityType: 'Venue', entityName: updated.venue_name, message: `Venue ${updated.venue_name} updated` });
    res.json(response);
  } catch (error) {
    console.error("Error updating venue (MongoDB):", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Venue name already exists" });
    }
    res.status(500).json({ error: "Failed to update venue" });
  }
});

// 5. DELETE /venues/:id - Delete a venue
router.delete("/:id", async (req, res) => {
  let id = req.params.id;
  if (!id || id === "undefined") {
    id = req.body.id; // fallback from body if needed
  }
  try {
    const deleted = await Venue.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ error: "Venue not found" });
    }
    // Map MongoDB _id to id for frontend compatibility
    const response = {
      id: deleted._id,
      venue_name: deleted.venue_name,
      building: deleted.building,
      capacity: deleted.capacity,
    };
await logActivity({ action: 'Delete', entityType: 'Venue', entityName: deleted.venue_name, message: `Venue ${deleted.venue_name} deleted` });
    res.json({ message: "Venue deleted successfully", venue: response });
  } catch (error) {
    console.error("Error deleting venue (MongoDB):", error);
    // Preserve foreign key constraint handling if needed (unlikely in MongoDB)
    if (error.code === "23503") {
      return res.status(400).json({
        error: "Cannot delete venue because it is assigned to seating arrangements",
      });
    }
    res.status(500).json({ error: "Failed to delete venue" });
  }
});

module.exports = router;
