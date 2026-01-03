import express from 'express';
import Attendance from '../models/Attendance.model.js';
import Leave from '../models/Leave.model.js';
import User from '../models/User.model.js';
import Salary from '../models/Salary.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

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

    // Update check-out time and calculate work hours
    attendance.checkOutTime = new Date();
    
    // Calculate work hours (excluding break time)
    const checkInTime = new Date(attendance.checkInTime);
    const checkOutTime = new Date();
    const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
    
    // Get employee's salary info for break time
    const salary = await Salary.findOne({ employeeId });
    const breakTimeHours = salary?.breakTimeHours || 1; // Default 1 hour break
    const standardWorkHours = 8; // Standard 8 hours work day
    
    // Calculate work hours (total - break)
    attendance.workHours = Math.max(0, totalHours - breakTimeHours);
    
    // Calculate extra hours (work hours beyond standard 8 hours)
    attendance.extraHours = Math.max(0, attendance.workHours - standardWorkHours);
    
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

/**
 * GET /api/attendance/employee/:month
 * Get employee's monthly attendance (for employees viewing their own attendance)
 * month format: YYYY-MM
 */
router.get('/employee/:month', async (req, res) => {
  try {
    const { month } = req.params; // YYYY-MM format
    const employeeId = req.user.userId;
    
    // Get start and end dates of the month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // Get all attendance records for the month
    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    // Get approved leaves for the month
    const leaves = await Leave.find({
      employeeId,
      status: 'approved',
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    });
    
    // Get salary info for break time
    const salary = await Salary.findOne({ employeeId });
    const breakTimeHours = salary?.breakTimeHours || 1;
    
    // Format attendance data
    const formattedRecords = attendanceRecords.map(record => {
      const checkIn = record.checkInTime ? new Date(record.checkInTime) : null;
      const checkOut = record.checkOutTime ? new Date(record.checkOutTime) : null;
      
      return {
        date: record.date,
        checkIn: checkIn ? checkIn.toTimeString().slice(0, 5) : null,
        checkOut: checkOut ? checkOut.toTimeString().slice(0, 5) : null,
        workHours: formatHours(record.workHours || 0),
        extraHours: formatHours(record.extraHours || 0),
        status: record.status
      };
    });
    
    // Calculate summary statistics
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const leaveDays = leaves.reduce((total, leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const monthStart = new Date(startDate);
      const monthEnd = new Date(endDate);
      
      const actualStart = leaveStart < monthStart ? monthStart : leaveStart;
      const actualEnd = leaveEnd > monthEnd ? monthEnd : leaveEnd;
      
      if (actualStart <= actualEnd) {
        const days = Math.ceil((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
      }
      return total;
    }, 0);
    
    const totalWorkingDays = new Date(year, monthNum, 0).getDate(); // Total days in month
    
    res.json({
      success: true,
      data: {
        month,
        date: `${new Date().getDate()},${new Date(year, monthNum - 1).toLocaleString('default', { month: 'long' })} ${year}`,
        attendance: formattedRecords,
        summary: {
          presentDays,
          leaveDays,
          totalWorkingDays
        }
      }
    });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/attendance/admin/:date
 * Get all employees' attendance for a specific date (Admin only)
 * date format: YYYY-MM-DD
 */
router.get('/admin/:date', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { date } = req.params; // YYYY-MM-DD format
    const searchQuery = req.query.search || '';
    
    // Build employee filter
    const employeeFilter = {};
    if (searchQuery) {
      employeeFilter.$or = [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { loginId: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Get all employees
    const employees = await User.find({
      role: 'employee',
      isActive: true,
      ...employeeFilter
    }).select('firstName lastName email loginId avatar department designation');
    
    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      date,
      employeeId: { $in: employees.map(e => e._id) }
    });
    
    // Get leaves for the date
    const leaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: date },
      endDate: { $gte: date },
      employeeId: { $in: employees.map(e => e._id) }
    });
    
    // Create a map of employee attendance
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.employeeId.toString()] = record;
    });
    
    const leaveMap = {};
    leaves.forEach(leave => {
      leaveMap[leave.employeeId.toString()] = leave;
    });
    
    // Format response
    const formattedData = employees.map(employee => {
      const attendance = attendanceMap[employee._id.toString()];
      const onLeave = !!leaveMap[employee._id.toString()];
      
      const checkIn = attendance?.checkInTime ? new Date(attendance.checkInTime) : null;
      const checkOut = attendance?.checkOutTime ? new Date(attendance.checkOutTime) : null;
      
      return {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          loginId: employee.loginId,
          avatar: employee.avatar,
          department: employee.department,
          designation: employee.designation
        },
        checkIn: checkIn ? checkIn.toTimeString().slice(0, 5) : null,
        checkOut: checkOut ? checkOut.toTimeString().slice(0, 5) : null,
        workHours: attendance ? formatHours(attendance.workHours || 0) : null,
        extraHours: attendance ? formatHours(attendance.extraHours || 0) : null,
        status: onLeave ? 'on_leave' : (attendance?.status || 'absent')
      };
    });
    
    // Format date for display
    const dateObj = new Date(date);
    const formattedDate = `${dateObj.getDate()},${dateObj.toLocaleString('default', { month: 'long' })} ${dateObj.getFullYear()}`;
    
    res.json({
      success: true,
      data: {
        date,
        formattedDate,
        attendance: formattedData
      }
    });
  } catch (error) {
    console.error('Get admin attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to format hours
function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default router;

