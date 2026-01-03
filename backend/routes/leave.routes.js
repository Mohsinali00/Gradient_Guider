import express from 'express';
import Leave from '../models/Leave.model.js';
import LeaveAllocation from '../models/LeaveAllocation.model.js';
import User from '../models/User.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Helper function to calculate days between two dates
 */
function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  return diffDays;
}

/**
 * POST /api/leave/apply
 * Employee applies for leave
 */
router.post('/apply', async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const { leaveType, startDate, endDate, reason, remarks, attachment } = req.body;

    // Validate required fields
    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, and end date are required'
      });
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Calculate allocation (number of days)
    const allocation = calculateDays(startDate, endDate);

    // Check leave allocation availability (only for paid and sick leave)
    if (leaveType === 'paid_time_off' || leaveType === 'sick_leave') {
      let allocationDoc = await LeaveAllocation.findOne({ employeeId });
      
      if (!allocationDoc) {
        // Create default allocation if doesn't exist
        allocationDoc = new LeaveAllocation({ employeeId });
        await allocationDoc.save();
      }

      const leaveTypeKey = leaveType === 'paid_time_off' ? 'paidTimeOff' : 'sickLeave';
      
      if (allocationDoc[leaveTypeKey].available < allocation) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType === 'paid_time_off' ? 'paid time off' : 'sick leave'} balance. Available: ${allocationDoc[leaveTypeKey].available} days`
        });
      }
    }

    // Create leave request
    const leave = new Leave({
      employeeId,
      leaveType,
      startDate,
      endDate,
      allocation,
      reason,
      remarks,
      attachment: leaveType === 'sick_leave' ? attachment : null
    });

    await leave.save();

    res.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        leave: {
          id: leave._id,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          allocation: leave.allocation,
          status: leave.status,
          reason: leave.reason,
          remarks: leave.remarks
        }
      }
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/leave/employee
 * Get employee's own leave requests
 */
router.get('/employee', async (req, res) => {
  try {
    const employeeId = req.user.userId;

    const leaves = await Leave.find({ employeeId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'firstName lastName');

    // Get leave allocation
    let allocation = await LeaveAllocation.findOne({ employeeId });
    if (!allocation) {
      allocation = new LeaveAllocation({ employeeId });
      await allocation.save();
    }

    res.json({
      success: true,
      data: {
        leaves: leaves.map(leave => ({
          id: leave._id,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          allocation: leave.allocation,
          status: leave.status,
          reason: leave.reason,
          remarks: leave.remarks,
          attachment: leave.attachment,
          adminComment: leave.adminComment,
          reviewedBy: leave.reviewedBy ? {
            name: `${leave.reviewedBy.firstName} ${leave.reviewedBy.lastName}`
          } : null,
          reviewedAt: leave.reviewedAt,
          createdAt: leave.createdAt
        })),
        allocation: {
          paidTimeOff: {
            total: allocation.paidTimeOff.total,
            used: allocation.paidTimeOff.used,
            available: allocation.paidTimeOff.available
          },
          sickLeave: {
            total: allocation.sickLeave.total,
            used: allocation.sickLeave.used,
            available: allocation.sickLeave.available
          },
          unpaidLeave: {
            total: allocation.unpaidLeave.total,
            used: allocation.unpaidLeave.used,
            available: allocation.unpaidLeave.available
          }
        }
      }
    });
  } catch (error) {
    console.error('Get employee leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/leave/admin
 * Get all leave requests (Admin/HR only)
 */
router.get('/admin', authorize('admin'), async (req, res) => {
  try {
    const { status, search } = req.query;

    // Build filter
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Get leaves with employee info
    let leaves = await Leave.find(filter)
      .populate('employeeId', 'firstName lastName email loginId avatar department designation')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      leaves = leaves.filter(leave => {
        const employee = leave.employeeId;
        const searchLower = search.toLowerCase();
        return (
          employee.firstName?.toLowerCase().includes(searchLower) ||
          employee.lastName?.toLowerCase().includes(searchLower) ||
          employee.email?.toLowerCase().includes(searchLower) ||
          employee.loginId?.toLowerCase().includes(searchLower)
        );
      });
    }

    res.json({
      success: true,
      data: {
        leaves: leaves.map(leave => ({
          id: leave._id,
          employee: {
            id: leave.employeeId._id,
            name: `${leave.employeeId.firstName} ${leave.employeeId.lastName}`,
            email: leave.employeeId.email,
            loginId: leave.employeeId.loginId,
            avatar: leave.employeeId.avatar,
            department: leave.employeeId.department,
            designation: leave.employeeId.designation
          },
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          allocation: leave.allocation,
          status: leave.status,
          reason: leave.reason,
          remarks: leave.remarks,
          attachment: leave.attachment,
          adminComment: leave.adminComment,
          reviewedBy: leave.reviewedBy ? {
            name: `${leave.reviewedBy.firstName} ${leave.reviewedBy.lastName}`
          } : null,
          reviewedAt: leave.reviewedAt,
          createdAt: leave.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get admin leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/leave/:id/approve
 * Approve leave request (Admin/HR only)
 */
router.put('/:id/approve', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const adminId = req.user.userId;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}`
      });
    }

    // Update leave status
    leave.status = 'approved';
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    if (adminComment) {
      leave.adminComment = adminComment;
    }

    await leave.save();

    // Update leave allocation (deduct from available balance)
    if (leave.leaveType === 'paid_time_off' || leave.leaveType === 'sick_leave') {
      let allocation = await LeaveAllocation.findOne({ employeeId: leave.employeeId });
      
      if (!allocation) {
        allocation = new LeaveAllocation({ employeeId: leave.employeeId });
      }

      const leaveTypeKey = leave.leaveType === 'paid_time_off' ? 'paidTimeOff' : 'sickLeave';
      allocation[leaveTypeKey].used += leave.allocation;
      allocation.calculateAvailable();
      await allocation.save();
    }

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: {
        leave: {
          id: leave._id,
          status: leave.status,
          adminComment: leave.adminComment,
          reviewedAt: leave.reviewedAt
        }
      }
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/leave/:id/reject
 * Reject leave request (Admin/HR only)
 */
router.put('/:id/reject', authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;
    const adminId = req.user.userId;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}`
      });
    }

    // Update leave status
    leave.status = 'rejected';
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    if (adminComment) {
      leave.adminComment = adminComment;
    }

    await leave.save();

    res.json({
      success: true,
      message: 'Leave request rejected successfully',
      data: {
        leave: {
          id: leave._id,
          status: leave.status,
          adminComment: leave.adminComment,
          reviewedAt: leave.reviewedAt
        }
      }
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/leave/allocation/:employeeId
 * Get leave allocation for an employee (Admin only)
 */
router.get('/allocation/:employeeId', authorize('admin'), async (req, res) => {
  try {
    const { employeeId } = req.params;

    let allocation = await LeaveAllocation.findOne({ employeeId });
    if (!allocation) {
      allocation = new LeaveAllocation({ employeeId });
      await allocation.save();
    }

    res.json({
      success: true,
      data: {
        allocation: {
          paidTimeOff: {
            total: allocation.paidTimeOff.total,
            used: allocation.paidTimeOff.used,
            available: allocation.paidTimeOff.available
          },
          sickLeave: {
            total: allocation.sickLeave.total,
            used: allocation.sickLeave.used,
            available: allocation.sickLeave.available
          },
          unpaidLeave: {
            total: allocation.unpaidLeave.total,
            used: allocation.unpaidLeave.used,
            available: allocation.unpaidLeave.available
          }
        }
      }
    });
  } catch (error) {
    console.error('Get allocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

