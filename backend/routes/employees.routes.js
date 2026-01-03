import express from 'express';
import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import Leave from '../models/Leave.model.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/employees
 * Get all employees with today's attendance status
 */
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all active employees from the same company
    const employees = await User.find({
      companyId: req.user.companyId,
      role: 'employee',
      isActive: true
    }).select('-password').sort({ firstName: 1, lastName: 1 });

    // Get today's attendance records
    const attendanceRecords = await Attendance.find({
      employeeId: { $in: employees.map(e => e._id) },
      date: today
    });

    // Get today's approved leaves
    const leaves = await Leave.find({
      employeeId: { $in: employees.map(e => e._id) },
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // Create maps for quick lookup
    const attendanceMap = new Map();
    attendanceRecords.forEach(att => {
      attendanceMap.set(att.employeeId.toString(), att);
    });

    const leaveMap = new Map();
    leaves.forEach(leave => {
      leaveMap.set(leave.employeeId.toString(), leave);
    });

    // Build response with work status
    const employeesWithStatus = employees.map(employee => {
      const empId = employee._id.toString();
      
      // Priority: On Leave > Present > Absent
      let workStatus = 'absent';
      
      if (leaveMap.has(empId)) {
        workStatus = 'on_leave';
      } else if (attendanceMap.has(empId)) {
        const att = attendanceMap.get(empId);
        if (att.checkInTime) {
          workStatus = 'present';
        }
      }

      return {
        id: employee._id,
        loginId: employee.loginId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        phone: employee.phone,
        avatar: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.firstName + ' ' + employee.lastName)}&background=random`,
        department: employee.department || '',
        designation: employee.designation || '',
        workStatus,
        checkInTime: attendanceMap.get(empId)?.checkInTime || null,
        checkOutTime: attendanceMap.get(empId)?.checkOutTime || null
      };
    });

    res.json({
      success: true,
      data: {
        employees: employeesWithStatus,
        count: employeesWithStatus.length
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/employees/:id
 * Get single employee details
 */
router.get('/:id', async (req, res) => {
  try {
    const employee = await User.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      role: 'employee'
    }).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          loginId: employee.loginId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          fullName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          phone: employee.phone,
          avatar: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.firstName + ' ' + employee.lastName)}&background=random`,
          department: employee.department || '',
          designation: employee.designation || '',
          yearOfJoining: employee.yearOfJoining,
          isActive: employee.isActive
        }
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

