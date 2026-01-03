import mongoose from 'mongoose';

const LeaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['paid_time_off', 'sick_leave', 'unpaid_leave'],
    required: true
  },
  startDate: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  endDate: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  allocation: {
    type: Number, // Number of days
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  attachment: {
    type: String, // URL or base64 for sick leave certificate
    default: null
  },
  adminComment: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Leave', LeaveSchema);

