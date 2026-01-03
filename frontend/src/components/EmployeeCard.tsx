import { Card } from './ui/Card';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  department?: string;
  designation?: string;
  workStatus: 'present' | 'absent' | 'on_leave';
}

interface EmployeeCardProps {
  employee: Employee;
  onClick: () => void;
}

export default function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const getStatusIndicator = () => {
    switch (employee.workStatus) {
      case 'on_leave':
        return (
          <div className="absolute top-2 right-2 text-lg" title="On Leave">
            ✈️
          </div>
        );
      case 'present':
        return (
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full" title="Present"></div>
        );
      case 'absent':
        return (
          <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-500 rounded-full" title="Absent"></div>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (employee.workStatus) {
      case 'on_leave':
        return 'On Leave';
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      default:
        return '';
    }
  };

  return (
    <Card
      className="relative cursor-pointer hover:shadow-glow-primary hover:scale-105 hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300 -z-0"></div>
      
      <div className="p-5 relative z-10">
        {/* Status Indicator */}
        <div className="absolute top-3 right-3 z-20">
          {getStatusIndicator()}
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            <img
              src={employee.avatar}
              alt={employee.fullName}
              className="w-24 h-24 rounded-full border-[3px] border-primary/20 object-cover relative z-10 group-hover:border-primary/40 transition-all duration-300 shadow-md group-hover:shadow-lg"
            />
          </div>
        </div>

        {/* Name */}
        <h3 className="text-center font-heading font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors duration-200">
          {employee.fullName}
        </h3>

        {/* Designation/Department */}
        {((employee.designation && employee.designation.trim()) || (employee.department && employee.department.trim())) && (
          <p className="text-center text-sm text-muted-foreground mb-3 line-clamp-2">
            {employee.designation?.trim() && employee.department?.trim()
              ? `${employee.designation.trim()} • ${employee.department.trim()}`
              : (employee.designation?.trim() || employee.department?.trim())}
          </p>
        )}

        {/* Status Badge */}
        <div className="flex justify-center mt-4">
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${
              employee.workStatus === 'present'
                ? 'bg-green-100 text-green-700 group-hover:bg-green-200'
                : employee.workStatus === 'on_leave'
                ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                : 'bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200'
            }`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>
    </Card>
  );
}

