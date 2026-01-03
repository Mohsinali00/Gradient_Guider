import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import EmployeeCard from '../components/EmployeeCard';
import AttendanceModal from '../components/AttendanceModal';
import ProfileDropdown from '../components/ProfileDropdown';
import Button from '../components/ui/Button';

interface Employee {
  id: string;
  loginId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar: string;
  department?: string;
  designation?: string;
  workStatus: 'present' | 'absent' | 'on_leave';
  checkInTime?: Date | string;
  checkOutTime?: Date | string;
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // Refresh every 30 seconds to update status
    const interval = setInterval(fetchEmployees, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter employees based on search query
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.loginId?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query)
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data.data.employees);
      setFilteredEmployees(response.data.data.employees);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    // Navigate to full profile page (admins can edit all, employees view their own)
    navigate(`/profile/${employeeId}`);
  };

  const handleCheckInOut = () => {
    fetchEmployees(); // Refresh after check-in/out
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-primary">DayFlow HRMS</h1>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-4">
                      <button
                        onClick={() => navigate('/employees')}
                        className="text-primary font-medium border-b-2 border-primary pb-1"
                      >
                        Employees
                      </button>
                      <button
                        onClick={() => navigate('/attendance')}
                        className="text-gray-600 hover:text-primary transition-colors"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate('/time-off')}
                        className="text-gray-600 hover:text-primary transition-colors"
                      >
                        Time Off
                      </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => navigate('/welcome')}
                      className="text-gray-600 hover:text-primary transition-colors"
                    >
                      Manage Employees
                    </button>
                  )}
                </div>
                {user?.role === 'employee' && (
                  <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                    <Button
                      onClick={() => setShowAttendanceModal(true)}
                      size="sm"
                      variant="outline"
                    >
                      Check In / Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.firstName || '') + ' ' + (user?.lastName || ''))}&background=random`}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                />
              </button>
              {showProfileDropdown && (
                <ProfileDropdown
                  onClose={() => setShowProfileDropdown(false)}
                  onProfileClick={() => navigate('/profile')}
                  onLogout={logout}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Employee Button and Search Bar */}
        <div className="mb-6 flex items-center gap-4">
          {user?.role === 'admin' && (
            <Button
              onClick={() => navigate('/welcome')}
              size="sm"
              variant="outline"
            >
              New
            </Button>
          )}
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search employees by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Employee Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                {searchQuery ? 'No employees found matching your search.' : 'No employees found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onClick={() => handleEmployeeClick(employee.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {user?.role === 'employee' && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          onCheckInOut={handleCheckInOut}
        />
      )}
    </div>
  );
}

