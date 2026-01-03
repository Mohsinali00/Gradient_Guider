import express from 'express';
import bcrypt from 'bcrypt';
import Company from '../models/Company.model.js';
import User from '../models/User.model.js';
import Admin from '../models/Admin.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminSignupSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();


router.post('/admin/signup', async (req, res) => {
  try {
   
    const validatedData = adminSignupSchema.parse(req.body);
  
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
   
    const companyCode = validatedData.companyName.substring(0, 2).toUpperCase();
    
   
    const existingCompany = await Company.findOne({ code: companyCode });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with similar name already exists. Please use a more unique company name.'
      });
    }
    
  
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create Company first (without superAdminId initially)
    const company = new Company({
      name: validatedData.companyName,
      code: companyCode,
      logo: validatedData.logo || '',
      superAdminId: null // Will be set after super admin creation
    });
    await company.save();
    
    // Create Super Admin (Company Owner) with companyId
    const superAdmin = new User({
      companyId: company._id,
      role: 'super_admin',
      email: validatedData.email,
      phone: validatedData.phone,
      firstName: 'Super',
      lastName: 'Admin',
      yearOfJoining: new Date().getFullYear(),
      password: hashedPassword,
      forcePasswordReset: false,
      isActive: true,
      createdBy: null // Super admin has no creator
    });
    await superAdmin.save();
    
    // Update company with Super Admin reference
    company.superAdminId = superAdmin._id;
    await company.save();
    
    
    const tokenPayload = {
      userId: superAdmin._id.toString(),
      companyId: company._id.toString(),
      role: superAdmin.role,
      email: superAdmin.email,
      loginId: superAdmin.loginId
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    res.status(201).json({
      success: true,
      message: 'Company and Super Admin account created successfully',
      data: {
        user: {
          id: superAdmin._id,
          email: superAdmin.email,
          role: superAdmin.role,
          companyId: company._id,
          firstName: superAdmin.firstName,
          lastName: superAdmin.lastName
        },
        company: {
          id: company._id,
          name: company.name,
          code: company.code,
          logo: company.logo
        },
        tokens: {
          accessToken,
          refreshToken
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
        message: 'Email or company code already exists'
      });
    }
    
    console.error('Admin signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
   
    const user = await User.findOne({
      $or: [
        { loginId: validatedData.loginIdOrEmail.toUpperCase() },
        { email: validatedData.loginIdOrEmail.toLowerCase() }
      ]
    }).populate('companyId');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact your administrator.'
      });
    }
    
   
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    

    const tokenPayload = {
      userId: user._id.toString(),
      companyId: user.companyId._id.toString(),
      role: user.role,
      email: user.email,
      loginId: user.loginId
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          loginId: user.loginId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          forcePasswordReset: user.forcePasswordReset
        },
        company: {
          id: user.companyId._id,
          name: user.companyId.name,
          code: user.companyId.code,
          logo: user.companyId.logo || ''
        },
        tokens: {
          accessToken,
          refreshToken
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
    
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const tokenPayload = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
      email: decoded.email,
      loginId: decoded.loginId
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
   
    const isCurrentPasswordValid = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
  
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 10);
    
 
    user.password = hashedNewPassword;
    user.forcePasswordReset = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

