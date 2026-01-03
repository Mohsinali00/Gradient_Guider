import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Company from '../models/Company.model.js';
import Admin from '../models/Admin.model.js';
import { generateLoginId } from '../utils/loginIdGenerator.js';
import { generateTemporaryPassword } from '../utils/passwordGenerator.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { createEmployeeSchema } from '../validators/auth.validator.js';

const router = express.Router();

router.use(authenticate);
// Allow both super_admin and admin to access these routes
router.use((req, res, next) => {
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
});

// Create Employee (accessible by super_admin and admin)
router.post('/employees', async (req, res) => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);
    
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    if (validatedData.email) {
      const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }
    
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
 
    const yearOfJoining = validatedData.yearOfJoining || new Date().getFullYear();
    const loginId = await generateLoginId(
      company.code,
      validatedData.firstName,
      validatedData.lastName,
      yearOfJoining,
      company._id
    );
    
    const existingLoginId = await User.findOne({ loginId });
    if (existingLoginId) {
      return res.status(500).json({
        success: false,
        message: 'Login ID collision detected. Please try again.'
      });
    }
   
    const employee = new User({
      companyId: company._id,
      role: 'employee',
      loginId,
      email: validatedData.email?.toLowerCase(),
      phone: validatedData.phone,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      department: validatedData.department,
      designation: validatedData.designation,
      yearOfJoining,
      password: hashedPassword,
      forcePasswordReset: true, 
      isActive: true,
      createdBy: req.user.userId
    });
    
    await employee.save();
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        employee: {
          id: employee._id,
          loginId: employee.loginId,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          yearOfJoining: employee.yearOfJoining,
          forcePasswordReset: employee.forcePasswordReset
        },
        credentials: {
          loginId: employee.loginId,
          temporaryPassword: temporaryPassword, 
          message: 'Share these credentials with the employee. They must change password on first login.'
        }
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or Login ID already exists'
      });
    }
    
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create Admin (only super_admin can create admins)
router.post('/admins', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create other admins'
      });
    }

    const { email, firstName, lastName, phone, password } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, last name, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      companyId: company._id,
      role: 'admin',
      email: email.toLowerCase(),
      phone: phone || '',
      firstName,
      lastName,
      yearOfJoining: new Date().getFullYear(),
      password: hashedPassword,
      forcePasswordReset: false,
      isActive: true,
      createdBy: req.user.userId
    });
    await admin.save();

    // Track admin creation in Admin model
    const adminRecord = new Admin({
      adminId: admin._id,
      companyId: company._id,
      superAdminId: req.user.userId,
      createdBy: req.user.userId,
      isActive: true
    });
    await adminRecord.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all admins (super_admin only)
router.get('/admins', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can view admin list'
      });
    }

    const admins = await Admin.find({
      companyId: req.user.companyId,
      superAdminId: req.user.userId,
      isActive: true
    })
      .populate('adminId', 'email firstName lastName role isActive createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        admins: admins.map(a => ({
          id: a.adminId._id,
          email: a.adminId.email,
          firstName: a.adminId.firstName,
          lastName: a.adminId.lastName,
          role: a.adminId.role,
          isActive: a.adminId.isActive,
          createdAt: a.createdAt
        })),
        count: admins.length
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete Admin (super_admin only)
router.delete('/admins/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can delete admins'
      });
    }

    const admin = await User.findById(req.params.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin from different company'
      });
    }

    // Deactivate instead of delete
    admin.isActive = false;
    await admin.save();

    // Update Admin record
    await Admin.updateOne(
      { adminId: admin._id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Admin deactivated successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/employees', async (req, res) => {
  try {
    const employees = await User.find({
      companyId: req.user.companyId,
      role: 'employee'
    }).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        employees,
        count: employees.length
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

export default router;
