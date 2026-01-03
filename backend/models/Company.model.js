import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  code: { 
    type: String, 
    required: true,
    uppercase: true,
    unique: true
  },
  logo: {
    type: String, // Base64 encoded logo or URL
    default: ''
  },
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Will be set after super admin creation
    unique: true,
    sparse: true // Allows multiple null values
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model('Company', CompanySchema);

