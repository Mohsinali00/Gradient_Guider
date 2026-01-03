import express from 'express';
import Attendance from '../models/Attendance.model.js';
import Leave from '../models/Leave.model.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/attendance/check-in
 * Employee checks in for the day
 */
router.post('/check-in', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const employeeId = req.user.userId;

    // Check if employee has approved leave for today
    const leave = await Leave.findOne({
      employeeId,
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    if (leave) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check in while on approved leave'
      });
    }

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today',
        data: {
          checkInTime: existingAttendance.checkInTime
        }
      });
    }

    // Create or update attendance record
    const attendance = await Attendance.findOneAndUpdate(
      { employeeId, date: today },
      {
        checkInTime: new Date(),
        status: 'present'
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({
      success: true,
      message: 'Checked in successfully',
      data: {
        attendance: {
          id: attendance._id,
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          status: attendance.status
        }
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/attendance/check-out
 * Employee checks out for the day
 */
router.post('/check-out', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const employeeId = req.user.userId;

    // Find today's attendance
    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first before checking out'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today',
        data: {
          checkOutTime: attendance.checkOutTime
        }
      });
    }

    // Update check-out time
    attendance.checkOutTime = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: {
        attendance: {
          id: attendance._id,
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          status: attendance.status
        }
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/attendance/today
 * Get today's attendance status for logged-in user
 */
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const employeeId = req.user.userId;

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    // Check for leave
    const leave = await Leave.findOne({
      employeeId,
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        attendance: attendance || null,
        onLeave: !!leave,
        leave: leave || null
      }
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

