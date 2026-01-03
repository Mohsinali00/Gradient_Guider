import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Label from '../components/ui/Label';
import ProfileDropdown from '../components/ProfileDropdown';

interface LeaveRequest {
  id: string;
  leaveType: 'paid_time_off' | 'sick_leave' | 'unpaid_leave';
  startDate: string;
  endDate: string;
  allocation: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  remarks?: string;
  attachment?: string;
  adminComment?: string;
  reviewedBy?: { name: string };
  reviewedAt?: string;
  createdAt: string;
}

interface LeaveAllocation {
  paidTimeOff: { total: number; used: number; available: number };
  sickLeave: { total: number; used: number; available: number };
  unpaidLeave: { total: number; used: number; available: number };
}

export default function EmployeeTimeOffPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [allocation, setAllocation] = useState<LeaveAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewLeaveModal, setShowNewLeaveModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    leaveType: 'paid_time_off' as 'paid_time_off' | 'sick_leave' | 'unpaid_leave',
    startDate: '',
    endDate: '',
    reason: '',
    remarks: '',
    attachment: ''
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/leave/employee');
      setLeaves(response.data.data.leaves);
      setAllocation(response.data.data.allocation);
    } catch (error: any) {
      console.error('Failed to fetch leaves:', error);
      alert(error.response?.data?.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('Please select start and end dates');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/leave/apply', formData);
      alert('Leave request submitted successfully!');
      setShowNewLeaveModal(false);
      setFormData({
        leaveType: 'paid_time_off',
        startDate: '',
        endDate: '',
        reason: '',
        remarks: '',
        attachment: ''
      });
      fetchLeaves();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, attachment: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'paid_time_off': return 'Paid time Off';
      case 'sick_leave': return 'Sick time off';
      case 'unpaid_leave': return 'Unpaid Leaves';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
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
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Attendance
                </button>
                <button
                  onClick={() => navigate('/time-off')}
                  className="text-primary font-medium border-b-2 border-primary pb-1"
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
          <h2 className="text-2xl font-bold mb-4">Time Off</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={() => setShowNewLeaveModal(true)}>
              NEW
            </Button>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search..."
                className="w-full"
              />
            </div>
          </div>

          {/* Leave Allocation Summary */}
          {allocation && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Paid time Off</div>
                  <div className="text-2xl font-bold">{allocation.paidTimeOff.available} Days Available</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Sick time off</div>
                  <div className="text-2xl font-bold">{allocation.sickLeave.available} Days Available</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Leave Requests Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold">End Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Time off Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user?.firstName} {user?.lastName}</td>
                        <td className="py-3 px-4">
                          {new Date(leave.startDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(leave.endDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">{getLeaveTypeLabel(leave.leaveType)}</td>
                        <td className="py-3 px-4">
                          <span className={getStatusColor(leave.status)}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Time Off Types Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>TimeOff Types:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              <li>Paid Time off</li>
              <li>Sick Leave</li>
              <li>Unpaid Leaves</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* New Leave Request Modal */}
      {showNewLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowNewLeaveModal(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Time off Type Request</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNewLeaveModal(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Employee</Label>
                <Input
                  value={`${user?.firstName} ${user?.lastName}`}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label>Time off Type</Label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="paid_time_off">Paid time off</option>
                  <option value="sick_leave">Sick Leave</option>
                  <option value="unpaid_leave">Unpaid Leaves</option>
                </select>
              </div>
              <div>
                <Label>Validity Period</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <span className="self-center">To</span>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Allocation</Label>
                <Input
                  value={`${calculateDays().toFixed(2)} Days`}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              {formData.leaveType === 'sick_leave' && (
                <div>
                  <Label>Attachment (For sick leave certificate)</Label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="w-full"
                  />
                </div>
              )}
              <div>
                <Label>Reason</Label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  placeholder="Enter reason for leave..."
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  placeholder="Additional remarks..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmitLeave} disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
                <Button onClick={() => setShowNewLeaveModal(false)} variant="outline" className="flex-1">
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

