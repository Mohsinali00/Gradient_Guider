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
      className="relative cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="p-4">
        {/* Status Indicator */}
        {getStatusIndicator()}

        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <img
            src={employee.avatar}
            alt={employee.fullName}
            className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover"
          />
        </div>

        {/* Name */}
        <h3 className="text-center font-semibold text-lg mb-1">
          {employee.fullName}
        </h3>

        {/* Designation/Department */}
        {(employee.designation || employee.department) && (
          <p className="text-center text-sm text-gray-500 mb-2">
            {employee.designation && employee.department
              ? `${employee.designation} • ${employee.department}`
              : employee.designation || employee.department}
          </p>
        )}

        {/* Status Badge */}
        <div className="flex justify-center mt-3">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              employee.workStatus === 'present'
                ? 'bg-green-100 text-green-700'
                : employee.workStatus === 'on_leave'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {getStatusText()}
          </span>
        </div>
      </div>
    </Card>
  );
}

