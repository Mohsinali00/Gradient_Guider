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
import Loader from '../components/Loader';
import ScrollAnimate from '../components/ScrollAnimate';

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
  const { user, company, logout } = useAuth();
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
    return <Loader />;
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08),transparent_50%)] -z-10"></div>
      
      {/* Top Navigation */}
      <nav className="glass-effect border-b border-border/50 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
            <div className="flex items-center space-x-6 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                {company?.logo && (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-primary/30 shadow-md"
                  />
                )}
                <h1 className="text-2xl font-heading font-bold text-gradient">DayFlow HRMS</h1>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-3 flex-wrap gap-2">
                <button
                  onClick={() => navigate('/employees')}
                  className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 bg-primary/10 text-primary border-b-2 border-primary cursor-pointer"
                >
                  Employees
                </button>
                <button
                  onClick={() => navigate('/attendance')}
                  className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer"
                >
                  Attendance
                </button>
                <button
                  onClick={() => navigate('/time-off')}
                  className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer"
                >
                  Time Off
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/welcome')}
                    className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer"
                  >
                    Manage Employees
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {user?.role === 'employee' && (
                <Button
                  onClick={() => setShowAttendanceModal(true)}
                  size="sm"
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Check In / Out
                </Button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 focus:outline-none rounded-full hover:ring-2 ring-primary/20 transition-all duration-200 p-1"
                >
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((user?.firstName || '') + ' ' + (user?.lastName || ''))}&background=random`}
                    alt="Profile"
                    className="w-9 h-9 rounded-full border-2 border-primary/30 shadow-md hover:shadow-lg transition-all duration-200"
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
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Employee Button and Search Bar */}
        <ScrollAnimate animation="fade-in" delay={0}>
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {user?.role === 'admin' && (
              <Button
                onClick={() => navigate('/welcome')}
                size="sm"
                className="whitespace-nowrap"
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
        </ScrollAnimate>

        {/* Employee Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <ScrollAnimate animation="fade-in">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {searchQuery ? 'No employees found matching your search.' : 'No employees found.'}
                </p>
              </CardContent>
            </Card>
          </ScrollAnimate>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredEmployees.map((employee, index) => (
              <ScrollAnimate
                key={employee.id}
                animation="scale"
                delay={index * 50}
                threshold={0.1}
              >
                <EmployeeCard
                  employee={employee}
                  onClick={() => handleEmployeeClick(employee.id)}
                />
              </ScrollAnimate>
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

