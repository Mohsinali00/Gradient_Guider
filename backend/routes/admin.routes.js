import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Company from '../models/Company.model.js';
import { generateLoginId } from '../utils/loginIdGenerator.js';
import { generateTemporaryPassword } from '../utils/passwordGenerator.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { createEmployeeSchema } from '../validators/auth.validator.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));


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
      isActive: true
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

