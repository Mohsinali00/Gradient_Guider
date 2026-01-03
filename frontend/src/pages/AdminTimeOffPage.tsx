import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ProfileDropdown from '../components/ProfileDropdown';

interface LeaveRequest {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    loginId: string;
    avatar: string;
    department?: string;
    designation?: string;
  };
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

export default function AdminTimeOffPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  useEffect(() => {
    // Filter leaves by search query
    if (searchQuery) {
      fetchLeaves();
    } else {
      fetchLeaves();
    }
  }, [searchQuery]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get('/api/leave/admin', { params });
      setLeaves(response.data.data.leaves);
    } catch (error: any) {
      console.error('Failed to fetch leaves:', error);
      alert(error.response?.data?.message || 'Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setActionType('approve');
    setAdminComment('');
    setShowActionModal(true);
  };

  const handleReject = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setActionType('reject');
    setAdminComment('');
    setShowActionModal(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedLeave || !actionType) return;

    setProcessing(true);
    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      await axios.put(`/api/leave/${selectedLeave.id}/${endpoint}`, {
        adminComment: adminComment || undefined
      });
      alert(`Leave request ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowActionModal(false);
      setSelectedLeave(null);
      setActionType(null);
      setAdminComment('');
      fetchLeaves();
    } catch (error: any) {
      alert(error.response?.data?.message || `Failed to ${actionType} leave request`);
    } finally {
      setProcessing(false);
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

  const filteredLeaves = leaves.filter(leave => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        leave.employee.name.toLowerCase().includes(query) ||
        leave.employee.email.toLowerCase().includes(query) ||
        leave.employee.loginId.toLowerCase().includes(query)
      );
    }
    return true;
  });

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
          <h2 className="text-2xl font-bold mb-2">Time Off</h2>
          <p className="text-sm text-gray-600 mb-4">For Admin & HR Officer</p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
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
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No leave requests found
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((leave) => (
                      <tr key={leave.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={leave.employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.employee.name)}&background=random`}
                              alt={leave.employee.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium">{leave.employee.name}</div>
                              <div className="text-sm text-gray-500">{leave.employee.department || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
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
                        <td className="py-3 px-4">
                          {leave.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(leave)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(leave)}
                                size="sm"
                                variant="destructive"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {leave.status !== 'pending' && leave.adminComment && (
                            <div className="text-xs text-gray-500">
                              {leave.adminComment}
                            </div>
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

      {/* Approve/Reject Modal */}
      {showActionModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowActionModal(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Request
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Employee:</p>
                  <p className="font-medium">{selectedLeave.employee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Leave Type:</p>
                  <p className="font-medium">{getLeaveTypeLabel(selectedLeave.leaveType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Period:</p>
                  <p className="font-medium">
                    {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedLeave.reason && (
                  <div>
                    <p className="text-sm text-gray-600">Reason:</p>
                    <p className="text-sm">{selectedLeave.reason}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full min-h-[80px] p-2 border rounded-md"
                    placeholder="Add a comment..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitAction}
                    disabled={processing}
                    className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => setShowActionModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

