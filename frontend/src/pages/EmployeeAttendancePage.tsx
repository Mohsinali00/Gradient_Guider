import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ProfileDropdown from '../components/ProfileDropdown';

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
  const { user, logout } = useAuth();
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

  const getMonthName = (month: string) => {
    const [year, monthNum] = month.split('-').map(Number);
    return new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

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
          <h2 className="text-2xl font-bold mb-4">Attendance</h2>
          
          {/* Month Navigation and Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => handleMonthChange('prev')}
                variant="outline"
                size="sm"
              >
                ←
              </Button>
              <input
                type="month"
                value={currentMonth}
                onChange={handleMonthSelect}
                className="px-3 py-2 border rounded-md"
              />
              <Button
                onClick={() => handleMonthChange('next')}
                variant="outline"
                size="sm"
              >
                →
              </Button>
            </div>
            
            {/* Summary Statistics */}
            <div className="flex gap-4">
              <Card className="px-4 py-2">
                <CardContent className="p-0">
                  <div className="text-sm text-gray-600">Count of days present</div>
                  <div className="text-xl font-bold">{summary.presentDays}</div>
                </CardContent>
              </Card>
              <Card className="px-4 py-2">
                <CardContent className="p-0">
                  <div className="text-sm text-gray-600">Leaves count</div>
                  <div className="text-xl font-bold">{summary.leaveDays}</div>
                </CardContent>
              </Card>
              <Card className="px-4 py-2">
                <CardContent className="p-0">
                  <div className="text-sm text-gray-600">Total working days</div>
                  <div className="text-xl font-bold">{summary.totalWorkingDays}</div>
                </CardContent>
              </Card>
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
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Check In</th>
                    <th className="text-left py-3 px-4 font-semibold">Check Out</th>
                    <th className="text-left py-3 px-4 font-semibold">Work Hours</th>
                    <th className="text-left py-3 px-4 font-semibold">Extra hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No attendance records found for this month
                      </td>
                    </tr>
                  ) : (
                    attendance.map((record, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(record.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">{record.checkIn || '-'}</td>
                        <td className="py-3 px-4">{record.checkOut || '-'}</td>
                        <td className="py-3 px-4">{record.workHours || '00:00'}</td>
                        <td className="py-3 px-4">{record.extraHours || '00:00'}</td>
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

