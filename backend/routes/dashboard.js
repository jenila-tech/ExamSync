const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const verifyAdmin = require('../middleware/verifyAdmin');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Venue = require('../models/Venue');
const Exam = require('../models/Exam');
const SeatingAssignment = require('../models/SeatingAssignment');
const InvigilationAssignment = require('../models/InvigilationAssignment');
const StudentSubject = require('../models/StudentSubject');
router.use(verifyAdmin);
router.get('/stats', async (req, res) => {
  try {
    const [students, faculty, subjects, venues, exams, seating, invigilation] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Subject.countDocuments(),
      Venue.countDocuments(),
      Exam.countDocuments(),
      SeatingAssignment.countDocuments(),
      InvigilationAssignment.countDocuments()
    ]);
    res.json({students, faculty, subjects, venues, exams, seatingAssignments: seating, invigilationAssignments: invigilation});
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({error: 'Failed to fetch dashboard statistics'});
  }
});

// Upcoming exams route
router.get('/upcoming-exams', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const exams = await Exam.find({ exam_date: { $gte: today } })
      .populate('subject')
      .sort({ exam_date: 1, start_time: 1 })
      .exec();
    res.json({ upcomingExams: exams });
  } catch (err) {
    console.error('Error fetching upcoming exams:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming exams' });
  }
});

// Recent activity route
router.get('/recent-activity', async (req, res) => {
  try {
    const limit = 10;
    
    // Fetch up to 10 most recent from each collection
    const [students, faculty, subjects, venues, exams, seating, invigilation, activitiesFromLog] = await Promise.all([
      Student.find().sort({ _id: -1 }).limit(limit).exec(),
      Faculty.find().sort({ _id: -1 }).limit(limit).exec(),
      Subject.find().sort({ _id: -1 }).limit(limit).exec(),
      Venue.find().sort({ _id: -1 }).limit(limit).exec(),
      Exam.find().sort({ _id: -1 }).populate('subject').limit(limit).exec(),
      SeatingAssignment.find().sort({ createdAt: -1 }).populate({ path: 'exam', populate: { path: 'subject' } }).limit(limit).exec(),
      InvigilationAssignment.find().sort({ createdAt: -1 }).populate('faculty venue').populate({ path: 'exam', populate: { path: 'subject' } }).limit(limit).exec(),
      Activity.find().sort({ createdAt: -1 }).limit(limit).exec()
    ]);

    let activities = [];

    students.forEach(s => activities.push({
      id: s._id,
      type: 'Student',
      description: `New student ${s.name} added`,
      timestamp: s._id.getTimestamp()
    }));

    faculty.forEach(f => activities.push({
      id: f._id,
      type: 'Faculty',
      description: `New faculty ${f.name} registered`,
      timestamp: f._id.getTimestamp()
    }));

    subjects.forEach(s => activities.push({
      id: s._id,
      type: 'Subject',
      description: `New subject ${s.subject_name} added`,
      timestamp: s._id.getTimestamp()
    }));

    venues.forEach(v => activities.push({
      id: v._id,
      type: 'Venue',
      description: `New venue ${v.venue_name} added`,
      timestamp: v._id.getTimestamp()
    }));

    exams.forEach(e => activities.push({
      id: e._id,
      type: 'Exam',
      description: `New exam scheduled for ${e.subject?.subject_name || 'Unknown Subject'}`,
      timestamp: e._id.getTimestamp()
    }));

    seating.forEach(s => activities.push({
      id: s._id,
      type: 'SeatingAssignment',
      description: `Seating plan generated for exam ${s.exam?.subject?.subject_name || s.exam?._id || 'Unknown'}`,
      timestamp: s.createdAt || s._id.getTimestamp()
    }));

    invigilation.forEach(i => activities.push({
      id: i._id,
      type: 'InvigilationAssignment',
      description: `Invigilator ${i.faculty?.name || 'Faculty'} assigned to ${i.venue?.venue_name || 'Venue'}`,
      timestamp: i.createdAt || i._id.getTimestamp()
    }));

    // Include activity logs for updates and deletes only
    activitiesFromLog
      .filter(a => a.action !== 'Add')
      .forEach(a => activities.push({
        id: a._id,
        type: a.entityType,
        description: a.message,
        timestamp: a.createdAt
      }));

    // Sort combined by timestamp descending and take top 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activities.slice(0, limit);

    res.json({ recentActivity });
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Exam status route
router.get('/exam-status', async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('subject')
      .sort({ exam_date: 1, start_time: 1 })
      .exec();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const now = new Date();

    const examStatuses = await Promise.all(exams.map(async (exam) => {
      // Check if seating/invigilation assignments exist for this exam
      const [seatingCount, invigilationCount] = await Promise.all([
        SeatingAssignment.countDocuments({
          $or: [{ exam: exam._id }, { exam: String(exam._id) }]
        }),
        InvigilationAssignment.countDocuments({
          $or: [{ exam: exam._id }, { exam: String(exam._id) }]
        })
      ]);

      // Determine status according to agreed rules:
      // - Completed: exam date is in the past
      // - Invigilation Assigned: invigilation exists
      // - Seating Generated: seating exists but invigilation does not
      // - Upcoming: future exam date with no seating/invigilation
      const examDate = new Date(exam.exam_date);
      const examDateMidnight = new Date(examDate);
      examDateMidnight.setUTCHours(0, 0, 0, 0);

      let isPast = false;
      if (examDateMidnight < today) {
        isPast = true;
      } else if (examDateMidnight.getTime() === today.getTime()) {
        const [endH, endM] = (exam.end_time || '23:59').split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = (endH || 0) * 60 + (endM || 0);
        if (currentMinutes >= endMinutes) {
          isPast = true;
        }
      }

      let status = 'Upcoming';
      if (isPast) {
        status = 'Completed';
      } else if (invigilationCount > 0) {
        status = 'Invigilation Assigned';
      } else if (seatingCount > 0) {
        status = 'Seating Generated';
      }

      return {
        _id: exam._id,
        id: exam._id,
        subject: exam.subject,
        subject_name: exam.subject?.subject_name || 'Unknown Subject',
        subject_code: exam.subject?.subject_code || '',
        exam_date: exam.exam_date,
        start_time: exam.start_time,
        end_time: exam.end_time,
        status,
        seatingCount,
        invigilationCount
      };
    }));

    res.json({ examStatuses, exams: examStatuses });
  } catch (err) {
    console.error('Error fetching exam status:', err);
    res.status(500).json({ error: 'Failed to fetch exam status' });
  }
});

// Alerts & Conflicts route
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const now = new Date();

    // Fetch exams, venues, and faculty
    const [exams, venues, facultyList] = await Promise.all([
      Exam.find().populate('subject').sort({ exam_date: 1, start_time: 1 }).exec(),
      Venue.find().sort({ _id: 1 }).exec(),
      Faculty.find().sort({ _id: 1 }).exec()
    ]);

    // 1. Direct Exam Schedule Overlaps (same date, overlapping time windows)
    for (let i = 0; i < exams.length; i++) {
      for (let j = i + 1; j < exams.length; j++) {
        const e1 = exams[i];
        const e2 = exams[j];
        const d1 = new Date(e1.exam_date).toISOString().split('T')[0];
        const d2 = new Date(e2.exam_date).toISOString().split('T')[0];
        if (d1 === d2) {
          if (e1.start_time < e2.end_time && e1.end_time > e2.start_time) {
            alerts.push({
              id: `conflict-exam-${e1._id}-${e2._id}`,
              type: 'conflict',
              severity: 'high',
              title: 'Exam Schedule Overlap',
              message: `Schedule conflict on ${new Date(e1.exam_date).toLocaleDateString()}: "${e1.subject?.subject_name || 'Exam 1'}" (${e1.start_time} - ${e1.end_time}) overlaps with "${e2.subject?.subject_name || 'Exam 2'}" (${e2.start_time} - ${e2.end_time}).`,
              exam_id: e1._id
            });
          }
        }
      }
    }

    // 2. Per-Exam Status and Allocation Checks
    for (const exam of exams) {
      const examDate = new Date(exam.exam_date);
      const examDateMidnight = new Date(examDate);
      examDateMidnight.setUTCHours(0, 0, 0, 0);

      let isPast = false;
      if (examDateMidnight < today) {
        isPast = true;
      } else if (examDateMidnight.getTime() === today.getTime()) {
        const [endH, endM] = (exam.end_time || '23:59').split(':').map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = (endH || 0) * 60 + (endM || 0);
        if (currentMinutes >= endMinutes) {
          isPast = true;
        }
      }

      const [seatingAssignments, invigilationAssignments, studentMappings] = await Promise.all([
        SeatingAssignment.find({ $or: [{ exam: exam._id }, { exam: String(exam._id) }] }).populate('venue').exec(),
        InvigilationAssignment.find({ $or: [{ exam: exam._id }, { exam: String(exam._id) }] }).populate('venue faculty').exec(),
        exam.subject ? StudentSubject.find({ subject: exam.subject._id }).exec() : []
      ]);

      const seatingCount = seatingAssignments.length;
      const invigilationCount = invigilationAssignments.length;
      const mappedStudentsCount = studentMappings.length;
      const subjectName = exam.subject?.subject_name || 'Unknown Subject';
      const formattedDate = exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'N/A';

      // Check for issues on upcoming and ongoing exams
      if (!isPast) {
        // Enrolled students check
        if (mappedStudentsCount === 0) {
          alerts.push({
            id: `missing-students-${exam._id}`,
            type: 'warning',
            severity: 'medium',
            title: 'No Students Enrolled',
            message: `No students are mapped to "${subjectName}" for the upcoming exam on ${formattedDate}.`,
            exam_id: exam._id,
            subject_name: subjectName
          });
        }

        // Missing Seating Plan
        if (seatingCount === 0) {
          alerts.push({
            id: `missing-seating-${exam._id}`,
            type: 'warning',
            severity: 'high',
            title: 'Missing Seating Plan',
            message: `"${subjectName}" on ${formattedDate} (${exam.start_time} - ${exam.end_time}) does not have a seating plan generated.`,
            exam_id: exam._id,
            subject_name: subjectName
          });

          // Check venue capacity sufficiency
          if (mappedStudentsCount > 0) {
            const totalCapacity = venues.reduce((sum, v) => sum + (v.capacity || 0), 0);
            if (totalCapacity < mappedStudentsCount) {
              alerts.push({
                id: `insufficient-capacity-${exam._id}`,
                type: 'danger',
                severity: 'high',
                title: 'Insufficient Venue Capacity',
                message: `Capacity shortage for "${subjectName}": ${mappedStudentsCount} students enrolled, but total venue capacity is ${totalCapacity} (${mappedStudentsCount - totalCapacity} more seats needed).`,
                exam_id: exam._id,
                subject_name: subjectName
              });
            }
          }
        } else {
          // Incomplete seating (fewer seats assigned than enrolled students)
          if (mappedStudentsCount > 0 && seatingCount < mappedStudentsCount) {
            alerts.push({
              id: `incomplete-seating-${exam._id}`,
              type: 'warning',
              severity: 'medium',
              title: 'Incomplete Seating Allocation',
              message: `Incomplete seating for "${subjectName}": only ${seatingCount} of ${mappedStudentsCount} enrolled students have seat allocations.`,
              exam_id: exam._id,
              subject_name: subjectName
            });
          }
        }

        // Missing Invigilation
        if (invigilationCount === 0) {
          alerts.push({
            id: `missing-invigilation-${exam._id}`,
            type: 'warning',
            severity: seatingCount > 0 ? 'high' : 'medium',
            title: 'Missing Invigilation Assignment',
            message: `"${subjectName}" on ${formattedDate} has no invigilators assigned.`,
            exam_id: exam._id,
            subject_name: subjectName
          });
        } else if (seatingCount > 0) {
          // Check if all venues used in seating have assigned invigilators
          const seatingVenueIds = new Set(
            seatingAssignments.map(sa => sa.venue?._id?.toString() || (sa.venue && sa.venue.toString())).filter(Boolean)
          );
          const invigVenueIds = new Set(
            invigilationAssignments.map(ia => ia.venue?._id?.toString() || (ia.venue && ia.venue.toString())).filter(Boolean)
          );

          let unassignedVenuesCount = 0;
          for (const vId of seatingVenueIds) {
            if (!invigVenueIds.has(vId)) unassignedVenuesCount++;
          }

          if (unassignedVenuesCount > 0) {
            alerts.push({
              id: `unassigned-venues-${exam._id}`,
              type: 'danger',
              severity: 'high',
              title: 'Venues Without Invigilators',
              message: `${unassignedVenuesCount} venue(s) used in seating for "${subjectName}" do not have an invigilator assigned.`,
              exam_id: exam._id,
              subject_name: subjectName
            });
          }
        }
      }
    }

    // 3. Faculty Double-Booking (same faculty assigned to overlapping exams)
    const allInvig = await InvigilationAssignment.find()
      .populate({ path: 'exam', populate: { path: 'subject' } })
      .populate('faculty venue')
      .exec();

    for (let i = 0; i < allInvig.length; i++) {
      for (let j = i + 1; j < allInvig.length; j++) {
        const a1 = allInvig[i];
        const a2 = allInvig[j];
        if (a1.faculty && a2.faculty && a1.faculty._id.toString() === a2.faculty._id.toString()) {
          const e1 = a1.exam;
          const e2 = a2.exam;
          if (e1 && e2 && e1._id.toString() !== e2._id.toString()) {
            const d1 = new Date(e1.exam_date).toISOString().split('T')[0];
            const d2 = new Date(e2.exam_date).toISOString().split('T')[0];
            if (d1 === d2 && e1.start_time < e2.end_time && e1.end_time > e2.start_time) {
              alerts.push({
                id: `faculty-overlap-${a1._id}-${a2._id}`,
                type: 'conflict',
                severity: 'high',
                title: 'Faculty Schedule Conflict',
                message: `Faculty member "${a1.faculty.name}" is assigned to two overlapping exams on ${d1}: "${e1.subject?.subject_name || 'Exam 1'}" (${e1.start_time}-${e1.end_time}) and "${e2.subject?.subject_name || 'Exam 2'}" (${e2.start_time}-${e2.end_time}).`
              });
            }
          }
        }
      }
    }

    // 4. Venue Double-Booking (same venue used in seating for overlapping exams)
    const allSeating = await SeatingAssignment.find()
      .populate({ path: 'exam', populate: { path: 'subject' } })
      .populate('venue')
      .exec();

    const venueExamMap = new Map();
    for (const sa of allSeating) {
      if (!sa.venue || !sa.exam) continue;
      const vId = sa.venue._id.toString();
      const eId = sa.exam._id.toString();
      const key = `${vId}_${eId}`;
      if (!venueExamMap.has(key)) {
        venueExamMap.set(key, { venue: sa.venue, exam: sa.exam });
      }
    }
    const venueExamList = Array.from(venueExamMap.values());
    for (let i = 0; i < venueExamList.length; i++) {
      for (let j = i + 1; j < venueExamList.length; j++) {
        const item1 = venueExamList[i];
        const item2 = venueExamList[j];
        if (item1.venue._id.toString() === item2.venue._id.toString() && item1.exam._id.toString() !== item2.exam._id.toString()) {
          const e1 = item1.exam;
          const e2 = item2.exam;
          const d1 = new Date(e1.exam_date).toISOString().split('T')[0];
          const d2 = new Date(e2.exam_date).toISOString().split('T')[0];
          if (d1 === d2 && e1.start_time < e2.end_time && e1.end_time > e2.start_time) {
            alerts.push({
              id: `venue-overlap-${item1.venue._id}-${e1._id}-${e2._id}`,
              type: 'conflict',
              severity: 'high',
              title: 'Venue Double-Booking Conflict',
              message: `Venue "${item1.venue.venue_name}" is assigned to two overlapping exams on ${d1}: "${e1.subject?.subject_name || 'Exam 1'}" and "${e2.subject?.subject_name || 'Exam 2'}".`
            });
          }
        }
      }
    }

    res.json({ alerts, count: alerts.length });
  } catch (err) {
    console.error('Error fetching dashboard alerts:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard alerts' });
  }
});

// Reports & Export route
router.get('/reports', async (req, res) => {
  try {
    const { type } = req.query;

    const [students, exams, seatingAssignments, invigilationAssignments] = await Promise.all([
      (!type || type === 'students')
        ? Student.find().sort({ register_number: 1 }).lean().exec()
        : [],
      (!type || type === 'exams')
        ? Exam.find().populate('subject').sort({ exam_date: 1, start_time: 1 }).lean().exec()
        : [],
      (!type || type === 'seating')
        ? SeatingAssignment.find()
            .populate('student')
            .populate('venue')
            .populate({ path: 'exam', populate: { path: 'subject' } })
            .sort({ createdAt: -1 })
            .lean()
            .exec()
        : [],
      (!type || type === 'invigilation')
        ? InvigilationAssignment.find()
            .populate('faculty')
            .populate('venue')
            .populate({ path: 'exam', populate: { path: 'subject' } })
            .sort({ createdAt: -1 })
            .lean()
            .exec()
        : []
    ]);

    // Format students report
    const formattedStudents = students.map(s => ({
      id: s._id,
      register_number: s.register_number || '',
      name: s.name || '',
      department: s.department || '',
      year: s.year || '',
      section: s.section || ''
    }));

    // Format exams report
    const formattedExams = exams.map(e => ({
      id: e._id,
      subject_code: e.subject?.subject_code || '',
      subject_name: e.subject?.subject_name || '',
      department: e.subject?.department || '',
      exam_date: e.exam_date ? new Date(e.exam_date).toISOString().split('T')[0] : '',
      start_time: e.start_time || '',
      end_time: e.end_time || ''
    }));

    // Format seating assignments report
    const formattedSeating = seatingAssignments.map(sa => ({
      id: sa._id,
      student_register_number: sa.student?.register_number || '',
      student_name: sa.student?.name || '',
      student_department: sa.student?.department || '',
      student_year: sa.student?.year || '',
      subject_code: sa.exam?.subject?.subject_code || '',
      subject_name: sa.exam?.subject?.subject_name || '',
      exam_date: sa.exam?.exam_date ? new Date(sa.exam.exam_date).toISOString().split('T')[0] : '',
      start_time: sa.exam?.start_time || '',
      end_time: sa.exam?.end_time || '',
      venue_name: sa.venue?.venue_name || '',
      building: sa.venue?.building || '',
      seat_number: sa.seat_number != null ? sa.seat_number : ''
    }));

    // Format invigilation assignments report
    const formattedInvigilation = invigilationAssignments.map(ia => ({
      id: ia._id,
      faculty_name: ia.faculty?.name || '',
      faculty_email: ia.faculty?.email || '',
      faculty_department: ia.faculty?.department || '',
      subject_code: ia.exam?.subject?.subject_code || '',
      subject_name: ia.exam?.subject?.subject_name || '',
      exam_date: ia.exam?.exam_date ? new Date(ia.exam.exam_date).toISOString().split('T')[0] : '',
      start_time: ia.exam?.start_time || '',
      end_time: ia.exam?.end_time || '',
      venue_name: ia.venue?.venue_name || '',
      building: ia.venue?.building || ''
    }));

    res.json({
      students: formattedStudents,
      exams: formattedExams,
      seatingAssignments: formattedSeating,
      invigilationAssignments: formattedInvigilation,
      seating: formattedSeating,
      invigilation: formattedInvigilation,
      counts: {
        students: formattedStudents.length,
        exams: formattedExams.length,
        seating: formattedSeating.length,
        invigilation: formattedInvigilation.length
      }
    });
  } catch (err) {
    console.error('Error generating reports:', err);
    res.status(500).json({ error: 'Failed to generate reports' });
  }
});

module.exports = router;
