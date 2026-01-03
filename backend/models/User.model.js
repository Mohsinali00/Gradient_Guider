import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company',
    required: function() {
      // companyId is required for admin and employee, but optional for super_admin during creation
      return this.role !== 'super_admin';
    }
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'employee'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for super_admin (company owner)
  },
  loginId: { 
    type: String, 
    unique: true, 
    sparse: true,
    uppercase: true
  },
  email: { 
    type: String, 
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String, // Profile image URL
    default: ''
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  manager: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  dateOfJoining: {
    type: Date
  },
  yearOfJoining: {
    type: Number,
    required: true
  },
  // Personal Information
  dateOfBirth: {
    type: Date
  },
  residingAddress: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    trim: true
  },
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', ''],
    default: ''
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', ''],
    default: ''
  },
  // Bank Details
  bankAccountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  uanNumber: {
    type: String,
    trim: true
  },
  employeeCode: {
    type: String,
    trim: true
  },
  // Additional Information
  about: {
    type: String,
    trim: true
  },
  jobDescription: {
    type: String,
    trim: true
  },
  interests: {
    type: String,
    trim: true
  },
  skills: [{
    name: { type: String, trim: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' }
  }],
  certifications: [{
    name: { type: String, trim: true },
    issuer: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    certificateNumber: { type: String, trim: true }
  }],
  password: { 
    type: String, 
    required: true 
  },
  forcePasswordReset: { 
    type: Boolean, 
    default: false 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('User', UserSchema);

