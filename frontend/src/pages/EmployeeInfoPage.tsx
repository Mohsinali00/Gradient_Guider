import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/Loader';
import BackButton from '../components/BackButton';

interface EmployeeDetails {
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
  yearOfJoining: number;
  isActive: boolean;
}

export default function EmployeeInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
    }
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      const response = await axios.get(`/api/employees/${id}`);
      setEmployee(response.data.data.employee);
    } catch (error: any) {
      console.error('Failed to fetch employee details:', error);
      alert('Failed to load employee information');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Employee not found</p>
            <div className="flex items-center gap-3 mt-4">
              <BackButton to="/employees" />
              <span className="text-sm text-muted-foreground">Back to Employees</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BackButton to="/employees" />
            <span className="text-sm text-muted-foreground">Back to Employees</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <img
                src={employee.avatar}
                alt={employee.fullName}
                className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover"
              />
              <div>
                <CardTitle className="text-2xl">{employee.fullName}</CardTitle>
                {employee.designation && (
                  <p className="text-gray-600 mt-1">{employee.designation}</p>
                )}
                {employee.department && (
                  <p className="text-sm text-gray-500">{employee.department}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Login ID</h3>
                <p className="font-mono text-sm">{employee.loginId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-sm">{employee.email || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                <p className="text-sm">{employee.phone || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Year of Joining</h3>
                <p className="text-sm">{employee.yearOfJoining}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    employee.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t">
              <Button onClick={() => navigate(`/profile/${employee.id}`)}>
                View Full Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

