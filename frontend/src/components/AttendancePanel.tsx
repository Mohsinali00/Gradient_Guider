import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';

interface AttendancePanelProps {
  onCheckInOut: () => void;
}

interface TodayAttendance {
  attendance: {
    checkInTime: string;
    checkOutTime?: string;
  } | null;
  onLeave: boolean;
}

export default function AttendancePanel({ onCheckInOut }: AttendancePanelProps) {
  const [attendance, setAttendance] = useState<TodayAttendance | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('/api/attendance/today');
      setAttendance(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await axios.post('/api/attendance/check-in');
      await fetchTodayAttendance();
      onCheckInOut();
      alert('Checked in successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check in');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    setChecking(true);
    try {
      await axios.post('/api/attendance/check-out');
      await fetchTodayAttendance();
      onCheckInOut();
      alert('Checked out successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out');
    } finally {
      setChecking(false);
    }
  };

  if (!attendance) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const canCheckIn = !attendance.onLeave && (!attendance.attendance || !attendance.attendance.checkInTime);
  const canCheckOut = attendance.attendance?.checkInTime && !attendance.attendance?.checkOutTime;

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendance.onLeave ? (
          <div className="text-center p-4 bg-blue-50 rounded-md">
            <p className="text-blue-700 font-medium">✈️ On Leave</p>
            <p className="text-sm text-blue-600 mt-1">You are on approved leave today</p>
          </div>
        ) : (
          <>
            {attendance.attendance?.checkInTime && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Check In</p>
                  <p className="font-medium">
                    {new Date(attendance.attendance.checkInTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {attendance.attendance.checkOutTime && (
                  <div>
                    <p className="text-sm text-gray-600">Check Out</p>
                    <p className="font-medium">
                      {new Date(attendance.attendance.checkOutTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {canCheckIn && (
                <Button
                  onClick={handleCheckIn}
                  disabled={checking}
                  className="w-full"
                >
                  {checking ? 'Checking In...' : 'Check In'}
                </Button>
              )}
              {canCheckOut && (
                <Button
                  onClick={handleCheckOut}
                  disabled={checking}
                  variant="outline"
                  className="w-full"
                >
                  {checking ? 'Checking Out...' : 'Check Out'}
                </Button>
              )}
              {!canCheckIn && !canCheckOut && attendance.attendance?.checkOutTime && (
                <p className="text-center text-sm text-gray-500">
                  You have completed your attendance for today
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

