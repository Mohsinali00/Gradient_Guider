import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInOut: () => void;
}

interface TodayAttendance {
  attendance: {
    checkInTime: string;
    checkOutTime?: string;
  } | null;
  onLeave: boolean;
}

export default function AttendanceModal({ isOpen, onClose, onCheckInOut }: AttendanceModalProps) {
  const [attendance, setAttendance] = useState<TodayAttendance | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTodayAttendance();
    }
  }, [isOpen]);

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/attendance/today');
      setAttendance(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      await axios.post('/api/attendance/check-in');
      await fetchTodayAttendance();
      onCheckInOut();
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to check out');
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const canCheckIn = !attendance?.onLeave && (!attendance?.attendance || !attendance.attendance.checkInTime);
  const canCheckOut = attendance?.attendance?.checkInTime && !attendance?.attendance?.checkOutTime;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fade-in p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md mx-4 animate-scale-in glass-effect"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-4">Loading...</div>
          ) : attendance?.onLeave ? (
            <div className="text-center p-4 bg-blue-50 rounded-md">
              <p className="text-blue-700 font-medium">✈️ On Leave</p>
              <p className="text-sm text-blue-600 mt-1">You are on approved leave today</p>
            </div>
          ) : (
            <>
              {attendance?.attendance?.checkInTime && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Check In</p>
                    <p className="text-lg font-semibold">
                      {new Date(attendance.attendance.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {attendance.attendance.checkOutTime && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Check Out</p>
                      <p className="text-lg font-semibold">
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
                {!canCheckIn && !canCheckOut && attendance?.attendance?.checkOutTime && (
                  <p className="text-center text-sm text-gray-500">
                    You have completed your attendance for today
                  </p>
                )}
              </div>
            </>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-4"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

