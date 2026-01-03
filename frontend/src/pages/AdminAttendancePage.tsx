import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ProfileDropdown from '../components/ProfileDropdown';

interface EmployeeAttendance {
  employee: {
    id: string;
    name: string;
    email: string;
    loginId: string;
    avatar: string;
    department?: string;
    designation?: string;
  };
  checkIn: string | null;
  checkOut: string | null;
  workHours: string | null;
  extraHours: string | null;
  status: 'present' | 'absent' | 'on_leave';
}

export default function AdminAttendancePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<EmployeeAttendance[]>([]);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [displayDate, setDisplayDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    // Set current date on mount
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    fetchAttendance(today);
  }, []);

  useEffect(() => {
    if (currentDate) {
      fetchAttendance(currentDate);
    }
  }, [searchQuery]);

  const fetchAttendance = async (date: string) => {
    setLoading(true);
    try {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await axios.get(`/api/attendance/admin/${date}`, { params });
      setAttendance(response.data.data.attendance);
      setDisplayDate(response.data.data.formattedDate);
    } catch (error: any) {
      console.error('Failed to fetch attendance:', error);
      alert(error.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const date = new Date(currentDate);
    if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    const newDate = date.toISOString().split('T')[0];
    setCurrentDate(newDate);
    fetchAttendance(newDate);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentDate(e.target.value);
      fetchAttendance(e.target.value);
    }
  };

  const filteredAttendance = attendance.filter(item =>
    item.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employee.loginId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-primary">DayFlow HRMS</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/employees')}
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Employees
                </button>
                <button
                  onClick={() => navigate('/attendance')}
                  className="text-primary font-medium border-b-2 border-primary pb-1"
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Attendances List view</h2>
          <p className="text-sm text-gray-600 mb-4">For Admin/HR Officer</p>
          
          {/* Date Navigation and Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDateChange('prev')}
                variant="outline"
                size="sm"
              >
                ←
              </Button>
              <input
                type="date"
                value={currentDate}
                onChange={handleDateSelect}
                className="px-3 py-2 border rounded-md"
              />
              <Button
                onClick={() => handleDateChange('next')}
                variant="outline"
                size="sm"
              >
                →
              </Button>
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Current Date Display */}
          <div className="mb-4 text-center">
            <p className="text-lg font-semibold">{displayDate}</p>
          </div>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Emp</th>
                    <th className="text-left py-3 px-4 font-semibold">Check In</th>
                    <th className="text-left py-3 px-4 font-semibold">Check Out</th>
                    <th className="text-left py-3 px-4 font-semibold">Work Hours</th>
                    <th className="text-left py-3 px-4 font-semibold">Extra hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No attendance records found for this date
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={item.employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.employee.name)}&background=random`}
                              alt={item.employee.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{item.employee.name}</div>
                              <div className="text-sm text-gray-500">{item.employee.department || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'on_leave' ? (
                            <span className="text-orange-600 font-medium">On Leave</span>
                          ) : (
                            item.checkIn || '-'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'on_leave' ? (
                            <span className="text-orange-600 font-medium">On Leave</span>
                          ) : (
                            item.checkOut || '-'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'on_leave' ? (
                            <span className="text-orange-600 font-medium">-</span>
                          ) : (
                            item.workHours || '00:00'
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'on_leave' ? (
                            <span className="text-orange-600 font-medium">-</span>
                          ) : (
                            item.extraHours || '00:00'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

