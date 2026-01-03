import express from 'express';
import User from '../models/User.model.js';
import Salary from '../models/Salary.model.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/profile/:id
 * Get profile details (employees can view any employee's profile, admins can view any)
 */
router.get('/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // All authenticated users (employees and admins) can view any employee profile
    // Editing permissions are handled separately in the PUT route

    const user = await User.findById(profileId)
      .select('-password')
      .populate('companyId', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get salary information
    let salary = await Salary.findOne({ employeeId: profileId });
    if (!salary) {
      // Create default salary if doesn't exist
      salary = new Salary({
        employeeId: profileId,
        monthlyWage: 0,
        yearlyWage: 0
      });
      await salary.save();
    }

    res.json({
      success: true,
      data: {
        profile: {
          id: user._id,
          loginId: user.loginId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          designation: user.designation,
          department: user.department,
          manager: user.manager,
          location: user.location,
          dateOfJoining: user.dateOfJoining,
          yearOfJoining: user.yearOfJoining,
          // Personal Info
          dateOfBirth: user.dateOfBirth,
          residingAddress: user.residingAddress,
          nationality: user.nationality,
          personalEmail: user.personalEmail,
          gender: user.gender,
          maritalStatus: user.maritalStatus,
          // Bank Details
          bankAccountNumber: user.bankAccountNumber,
          bankName: user.bankName,
          ifscCode: user.ifscCode,
          panNumber: user.panNumber,
          uanNumber: user.uanNumber,
          employeeCode: user.employeeCode,
          // Additional Info
          about: user.about,
          jobDescription: user.jobDescription,
          interests: user.interests,
          skills: user.skills || [],
          certifications: user.certifications || [],
          company: user.companyId
        },
        salary: {
          wageType: salary.wageType,
          monthlyWage: salary.monthlyWage,
          yearlyWage: salary.yearlyWage,
          workingDaysPerWeek: salary.workingDaysPerWeek,
          breakTimeHours: salary.breakTimeHours,
          components: salary.components,
          providentFund: salary.providentFund,
          professionalTax: salary.professionalTax
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/:id
 * Update profile (employees can edit limited fields, admins can edit all)
 */
router.put('/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Employees can only edit their own profile, admins can edit any
    if (userRole === 'employee' && profileId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own profile'
      });
    }

    const user = await User.findById(profileId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Define allowed fields based on role
    // Employees can edit: name, email, phone, department, location, manager, avatar, about, interests
    const employeeEditableFields = ['firstName', 'lastName', 'email', 'phone', 'department', 'location', 'manager', 'avatar', 'about', 'interests'];
    
    // Admin can edit ALL fields
    if (userRole === 'admin') {
      // Update all fields that are provided in the request
      const allFields = [
        'firstName', 'lastName', 'email', 'phone', 'avatar',
        'designation', 'department', 'manager', 'location',
        'dateOfBirth', 'residingAddress', 'nationality', 'personalEmail',
        'gender', 'maritalStatus', 'dateOfJoining', 'yearOfJoining',
        'bankAccountNumber', 'bankName', 'ifscCode', 'panNumber',
        'uanNumber', 'employeeCode', 'about', 'jobDescription', 'interests',
        'skills', 'certifications', 'loginId'
      ];
      
      allFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
    } else {
      // Employees can only edit limited fields
      employeeEditableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/profile/:id/salary
 * Update salary (Admin only)
 */
router.put('/:id/salary', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const profileId = req.params.id;
    const { monthlyWage, yearlyWage, workingDaysPerWeek, breakTimeHours, components, providentFund, professionalTax } = req.body;

    let salary = await Salary.findOne({ employeeId: profileId });
    
    if (!salary) {
      salary = new Salary({ employeeId: profileId });
    }

    // Update wage
    if (monthlyWage !== undefined) {
      salary.monthlyWage = monthlyWage;
      salary.yearlyWage = monthlyWage * 12;
    }
    if (yearlyWage !== undefined) {
      salary.yearlyWage = yearlyWage;
      salary.monthlyWage = yearlyWage / 12;
    }
    if (workingDaysPerWeek !== undefined) salary.workingDaysPerWeek = workingDaysPerWeek;
    if (breakTimeHours !== undefined) salary.breakTimeHours = breakTimeHours;

    // Update components if provided
    if (components) {
      Object.keys(components).forEach(key => {
        if (salary.components[key] && components[key]) {
          Object.assign(salary.components[key], components[key]);
        }
      });
    }

    // Update PF and Tax
    if (providentFund) {
      if (providentFund.employeeContribution) {
        Object.assign(salary.providentFund.employeeContribution, providentFund.employeeContribution);
      }
      if (providentFund.employerContribution) {
        Object.assign(salary.providentFund.employerContribution, providentFund.employerContribution);
      }
    }
    if (professionalTax) {
      Object.assign(salary.professionalTax, professionalTax);
    }

    // Recalculate all components
    salary.calculateComponents();
    await salary.save();

    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: {
        salary: {
          wageType: salary.wageType,
          monthlyWage: salary.monthlyWage,
          yearlyWage: salary.yearlyWage,
          components: salary.components,
          providentFund: salary.providentFund,
          professionalTax: salary.professionalTax
        }
      }
    });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

