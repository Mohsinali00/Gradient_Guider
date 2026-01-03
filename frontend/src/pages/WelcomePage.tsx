import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

interface Employee {
  id: string;
  loginId: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  yearOfJoining: number;
  forcePasswordReset: boolean;
}

interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  yearOfJoining: number;
}

export default function WelcomePage() {
  const { user, company, logout } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string>('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginId: string;
    temporaryPassword: string;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [formData, setFormData] = useState<CreateEmployeeData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    yearOfJoining: new Date().getFullYear(),
  });

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchEmployees();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/admin/employees');
      setEmployees(response.data.data.employees);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/admin/employees', formData);
      const { employee, credentials } = response.data.data;

      setEmployees([...employees, employee]);
      setCreatedCredentials(credentials);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        yearOfJoining: new Date().getFullYear(),
      });
      setShowCreateForm(false);
    } catch (error: any) {
      setCreateError(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Welcome, {user?.firstName} {user?.lastName}!</p>
            <Button onClick={logout} className="w-full mt-4">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3">
              {company?.logo && (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-primary/30 shadow-md"
                />
              )}
              <h1 className="text-3xl font-bold text-primary">DayFlow HRMS</h1>
            </div>
            <p className="text-muted-foreground">
              Welcome, {user?.firstName} {user?.lastName} • {company?.name}
            </p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Credentials Display Modal */}
        {createdCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Employee Created Successfully!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-semibold text-yellow-800 mb-3">
                      ⚠️ Save these credentials now. They will not be shown again.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 block mb-1">Login ID:</span>
                          <span className="font-mono text-sm bg-white px-2 py-1 rounded border inline-block">
                            {createdCredentials.loginId}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(createdCredentials.loginId);
                              setCopyFeedback('Login ID copied!');
                              setTimeout(() => setCopyFeedback(''), 2000);
                            } catch (err) {
                              alert('Failed to copy. Please copy manually.');
                            }
                          }}
                          className="shrink-0"
                        >
                          📋 Copy
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-gray-600 block mb-1">Temporary Password:</span>
                          <span className="font-mono text-sm bg-white px-2 py-1 rounded border inline-block">
                            {createdCredentials.temporaryPassword}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(createdCredentials.temporaryPassword);
                              setCopyFeedback('Password copied!');
                              setTimeout(() => setCopyFeedback(''), 2000);
                            } catch (err) {
                              alert('Failed to copy. Please copy manually.');
                            }
                          }}
                          className="shrink-0"
                        >
                          📋 Copy
                        </Button>
                      </div>
                      {copyFeedback && (
                        <div className="text-sm text-green-600 font-medium text-center animate-pulse">
                          {copyFeedback}
                        </div>
                      )}
                      <div className="mt-3 pt-3 border-t border-yellow-300">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const credentials = `Login ID: ${createdCredentials.loginId}\nPassword: ${createdCredentials.temporaryPassword}`;
                              await navigator.clipboard.writeText(credentials);
                              setCopyFeedback('Both credentials copied!');
                              setTimeout(() => setCopyFeedback(''), 2000);
                            } catch (err) {
                              alert('Failed to copy. Please copy manually.');
                            }
                          }}
                          className="w-full"
                        >
                          📋 Copy Both
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCreatedCredentials(null)}
                    className="w-full"
                  >
                    Got it
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Employee Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                {createError && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department (Optional)</Label>
                    <Input
                      id="department"
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation (Optional)</Label>
                    <Input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({ ...formData, designation: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfJoining">Year of Joining</Label>
                  <Input
                    id="yearOfJoining"
                    type="number"
                    value={formData.yearOfJoining}
                    onChange={(e) =>
                      setFormData({ ...formData, yearOfJoining: parseInt(e.target.value) })
                    }
                    min="2000"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Employee'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Employees List */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Employees ({employees.length})</CardTitle>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : '+ Add Employee'}
            </Button>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No employees yet. Click "Add Employee" to create one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Login ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Year</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b">
                        <td className="p-2 font-mono text-sm">{employee.loginId}</td>
                        <td className="p-2">
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td className="p-2">{employee.email || '-'}</td>
                        <td className="p-2">{employee.phone || '-'}</td>
                        <td className="p-2">{employee.yearOfJoining}</td>
                        <td className="p-2">
                          {employee.forcePasswordReset ? (
                            <span className="text-yellow-600 text-sm">Password Reset Required</span>
                          ) : (
                            <span className="text-green-600 text-sm">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

