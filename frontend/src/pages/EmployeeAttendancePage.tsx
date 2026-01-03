import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProfileDropdown from '../components/ProfileDropdown';
import Loader from '../components/Loader';
import ScrollAnimate from '../components/ScrollAnimate';

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: string;
  extraHours: string;
  status: string;
}

interface AttendanceSummary {
  presentDays: number;
  leaveDays: number;
  totalWorkingDays: number;
}

export default function EmployeeAttendancePage() {
  const navigate = useNavigate();
  const { user, company, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({ presentDays: 0, leaveDays: 0, totalWorkingDays: 0 });
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [displayDate, setDisplayDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    // Set current month on mount
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(month);
    fetchAttendance(month);
  }, []);

  const fetchAttendance = async (month: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/attendance/employee/${month}`);
      setAttendance(response.data.data.attendance);
      setSummary(response.data.data.summary);
      setDisplayDate(response.data.data.date);
    } catch (error: any) {
      console.error('Failed to fetch attendance:', error);
      alert(error.response?.data?.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      newMonth = month === 1 ? 12 : month - 1;
      newYear = month === 1 ? year - 1 : year;
    } else {
      newMonth = month === 12 ? 1 : month + 1;
      newYear = month === 12 ? year + 1 : year;
    }

    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setCurrentMonth(newMonthStr);
    fetchAttendance(newMonthStr);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      const date = new Date(selectedDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      setCurrentMonth(month);
      fetchAttendance(month);
    }
  };

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
          <h2 className="text-3xl font-heading font-bold mb-2 text-gradient">Attendance</h2>
          
          {/* Month Navigation and Summary */}
          <ScrollAnimate animation="slide-right" delay={100}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleMonthChange('prev')}
                variant="outline"
                size="sm"
                className="hover:scale-105"
              >
                ←
              </Button>
              <input
                type="month"
                value={currentMonth}
                onChange={handleMonthSelect}
                className="px-4 py-2.5 border-2 border-input rounded-lg bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-sans"
              />
              <Button
                onClick={() => handleMonthChange('next')}
                variant="outline"
                size="sm"
                className="hover:scale-105"
              >
                →
              </Button>
            </div>
            
            {/* Summary Statistics */}
            <div className="flex flex-wrap gap-3 sm:gap-4 w-full lg:w-auto">
              <Card className="px-5 py-4 flex-1 sm:flex-none min-w-[140px] hover:scale-105 transition-transform duration-200">
                <CardContent className="p-0">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Count of days present</div>
                  <div className="text-2xl font-heading font-bold text-primary">{summary.presentDays}</div>
                </CardContent>
              </Card>
              <Card className="px-5 py-4 flex-1 sm:flex-none min-w-[140px] hover:scale-105 transition-transform duration-200">
                <CardContent className="p-0">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Leaves count</div>
                  <div className="text-2xl font-heading font-bold text-accent">{summary.leaveDays}</div>
                </CardContent>
              </Card>
              <Card className="px-5 py-4 flex-1 sm:flex-none min-w-[140px] hover:scale-105 transition-transform duration-200">
                <CardContent className="p-0">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total working days</div>
                  <div className="text-2xl font-heading font-bold text-secondary">{summary.totalWorkingDays}</div>
                </CardContent>
              </Card>
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
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Date</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Check In</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Check Out</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Work Hours</th>
                    <th className="text-left py-4 px-4 sm:px-6 font-heading font-semibold text-sm">Extra hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        No attendance records found for this month
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-border/50 hover:bg-primary/5 transition-colors duration-200"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <td className="py-4 px-4 sm:px-6 font-medium">
                          {new Date(record.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-sm">{record.checkIn || '-'}</td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-sm">{record.checkOut || '-'}</td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-sm font-semibold text-primary">{record.workHours || '00:00'}</td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-sm font-semibold text-accent">{record.extraHours || '00:00'}</td>
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

