import mongoose from 'mongoose';

const LeaveAllocationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  paidTimeOff: {
    total: { type: Number, default: 24 }, // Total allocated days
    used: { type: Number, default: 0 }, // Used days
    available: { type: Number, default: 24 } // Available days (calculated)
  },
  sickLeave: {
    total: { type: Number, default: 7 }, // Total allocated days
    used: { type: Number, default: 0 }, // Used days
    available: { type: Number, default: 7 } // Available days (calculated)
  },
  unpaidLeave: {
    total: { type: Number, default: 0 }, // Unpaid leave is typically unlimited
    used: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate available days
LeaveAllocationSchema.methods.calculateAvailable = function() {
  this.paidTimeOff.available = Math.max(0, this.paidTimeOff.total - this.paidTimeOff.used);
  this.sickLeave.available = Math.max(0, this.sickLeave.total - this.sickLeave.used);
  this.unpaidLeave.available = Math.max(0, this.unpaidLeave.total - this.unpaidLeave.used);
  return this;
};

// Update available days before saving
LeaveAllocationSchema.pre('save', function(next) {
  this.calculateAvailable();
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('LeaveAllocation', LeaveAllocationSchema);

