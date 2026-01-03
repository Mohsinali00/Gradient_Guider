import mongoose from 'mongoose';

const SalarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  wageType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  monthlyWage: {
    type: Number,
    default: 0
  },
  yearlyWage: {
    type: Number,
    default: 0
  },
  workingDaysPerWeek: {
    type: Number,
    default: 5
  },
  breakTimeHours: {
    type: Number,
    default: 1
  },
  // Salary Components
  components: {
    basicSalary: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 50 },
      computationType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      description: { type: String, default: 'Define Basic salary from company cost compute is based on monthly Wages' }
    },
    houseRentAllowance: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 50 },
      computationType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      description: { type: String, default: 'HRA provided to employees 50% of the basic salary' }
    },
    standardAllowance: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 16.67 },
      computationType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
      fixedAmount: { type: Number, default: 4167 },
      description: { type: String, default: 'A standard allowance is a predetermined, Fixed amount provided to employee as part of their salary' }
    },
    performanceBonus: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 8.33 },
      computationType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      description: { type: String, default: 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary' }
    },
    leaveTravelAllowance: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 8.33 },
      computationType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      description: { type: String, default: 'LTA is paid by the company to employees to cover their travel expenses and calculated as a % of the basic salary' }
    },
    fixedAllowance: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      computationType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
      description: { type: String, default: 'Fixed allowance portion of wages is determined after calculating all salary components' }
    }
  },
  // Provident Fund
  providentFund: {
    employeeContribution: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 12 },
      description: { type: String, default: 'PF is calculated based on the basic salary' }
    },
    employerContribution: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 12 },
      description: { type: String, default: 'PF is calculated based on the basic salary' }
    }
  },
  // Tax Deductions
  professionalTax: {
    amount: { type: Number, default: 200 },
    description: { type: String, default: 'Professional Tax deducted from the Gross salary' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to calculate salary components
SalarySchema.methods.calculateComponents = function() {
  const monthlyWage = this.monthlyWage;
  const components = this.components;
  
  // Calculate Basic Salary
  if (components.basicSalary.computationType === 'percentage') {
    components.basicSalary.amount = (monthlyWage * components.basicSalary.percentage) / 100;
  }
  
  // Calculate HRA (50% of Basic)
  if (components.houseRentAllowance.computationType === 'percentage') {
    components.houseRentAllowance.amount = (components.basicSalary.amount * components.houseRentAllowance.percentage) / 100;
  }
  
  // Standard Allowance (fixed or percentage)
  if (components.standardAllowance.computationType === 'fixed') {
    components.standardAllowance.amount = components.standardAllowance.fixedAmount || 4167;
  } else {
    components.standardAllowance.amount = (monthlyWage * components.standardAllowance.percentage) / 100;
  }
  
  // Performance Bonus (percentage of basic)
  if (components.performanceBonus.computationType === 'percentage') {
    components.performanceBonus.amount = (components.basicSalary.amount * components.performanceBonus.percentage) / 100;
  }
  
  // Leave Travel Allowance (percentage of basic)
  if (components.leaveTravelAllowance.computationType === 'percentage') {
    components.leaveTravelAllowance.amount = (components.basicSalary.amount * components.leaveTravelAllowance.percentage) / 100;
  }
  
  // Calculate total of other components
  const totalOtherComponents = 
    components.basicSalary.amount +
    components.houseRentAllowance.amount +
    components.standardAllowance.amount +
    components.performanceBonus.amount +
    components.leaveTravelAllowance.amount;
  
  // Fixed Allowance = Wage - Total of all other components
  components.fixedAllowance.amount = monthlyWage - totalOtherComponents;
  if (components.fixedAllowance.amount < 0) {
    components.fixedAllowance.amount = 0;
  }
  components.fixedAllowance.percentage = monthlyWage > 0 ? (components.fixedAllowance.amount / monthlyWage) * 100 : 0;
  
  // Calculate PF (12% of basic salary)
  this.providentFund.employeeContribution.amount = (components.basicSalary.amount * this.providentFund.employeeContribution.percentage) / 100;
  this.providentFund.employerContribution.amount = (components.basicSalary.amount * this.providentFund.employerContribution.percentage) / 100;
  
  this.updatedAt = new Date();
  return this;
};

export default mongoose.model('Salary', SalarySchema);

