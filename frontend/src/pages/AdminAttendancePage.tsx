import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ProfileDropdown from '../components/ProfileDropdown';
import Loader from '../components/Loader';
import ScrollAnimate from '../components/ScrollAnimate';

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
  const { user, company, logout } = useAuth();
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
    return <Loader />;
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08),transparent_50%)] -z-10"></div>
      
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
                  className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  Employees
                </button>
                <button
                  onClick={() => navigate('/attendance')}
                  className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 bg-primary/10 text-primary border-b-2 border-primary"
                >
                  Attendance
                </button>
                <button
                  onClick={() => navigate('/time-off')}
                  className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/5"
                >
                  Time Off
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/welcome')}
                    className="px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/5"
                  >
                    Manage Employees
                  </button>
                )}
              </div>
            </div>
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
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 animate-slide-up">
          <h2 className="text-3xl font-heading font-bold mb-2 text-gradient">Attendances List view</h2>
          <p className="text-sm text-muted-foreground">For Admin/HR Officer</p>
          
          {/* Date Navigation and Search */}
          <ScrollAnimate animation="slide-right" delay={100}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleDateChange('prev')}
                variant="outline"
                size="sm"
                className="hover:scale-105"
              >
                ←
              </Button>
              <input
                type="date"
                value={currentDate}
                onChange={handleDateSelect}
                className="px-4 py-2.5 border-2 border-input rounded-lg bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-sans"
              />
              <Button
                onClick={() => handleDateChange('next')}
                variant="outline"
                size="sm"
                className="hover:scale-105"
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
          </ScrollAnimate>

          {/* Current Date Display */}
          <ScrollAnimate animation="fade-in" delay={200}>
            <div className="mb-6 text-center">
              <p className="text-xl font-heading font-semibold text-foreground">{displayDate}</p>
            </div>
          </ScrollAnimate>
        </div>

        {/* Attendance Table */}
        <ScrollAnimate animation="fade-in" delay={300}>
          <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Emp</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Check In</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Check Out</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Work Hours</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Extra hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        No attendance records found for this date
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-border/50 hover:bg-primary/5 transition-colors duration-200"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.employee.name)}&background=random`}
                              alt={item.employee.name}
                              className="w-10 h-10 rounded-full border-2 border-primary/20 shadow-sm"
                            />
                            <div>
                              <div className="font-heading font-semibold">{item.employee.name}</div>
                              {item.employee.department?.trim() && (
                                <div className="text-xs text-muted-foreground">{item.employee.department.trim()}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {item.status === 'on_leave' ? (
                            <span className="text-accent font-medium">On Leave</span>
                          ) : (
                            <span className="font-mono text-sm">{item.checkIn || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {item.status === 'on_leave' ? (
                            <span className="text-accent font-medium">On Leave</span>
                          ) : (
                            <span className="font-mono text-sm">{item.checkOut || '-'}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {item.status === 'on_leave' ? (
                            <span className="text-accent font-medium">-</span>
                          ) : (
                            <span className="font-mono text-sm font-semibold text-primary">{item.workHours || '00:00'}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          {item.status === 'on_leave' ? (
                            <span className="text-accent font-medium">-</span>
                          ) : (
                            <span className="font-mono text-sm font-semibold text-accent">{item.extraHours || '00:00'}</span>
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
        </ScrollAnimate>
      </div>
    </div>
  );
}

