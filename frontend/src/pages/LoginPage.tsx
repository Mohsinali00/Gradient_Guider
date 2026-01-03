import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

const loginSchema = z.object({
  loginIdOrEmail: z.string().min(1, 'Login ID or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, changePassword } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordResetError, setPasswordResetError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });


  useEffect(() => {
    if (user?.forcePasswordReset) {
      setShowPasswordReset(true);
    } else if (user && !user.forcePasswordReset) {
      navigate('/employees');
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setLoading(true);
    try {
      await login(data.loginIdOrEmail, data.password);
     
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResetError('');

    if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
      setPasswordResetError("Passwords don't match");
      return;
    }

    try {
      await changePassword(
        passwordResetData.currentPassword,
        passwordResetData.newPassword,
        passwordResetData.confirmPassword
      );
      setShowPasswordReset(false);
      navigate('/employees');
    } catch (err: any) {
      setPasswordResetError(err.message || 'Password change failed');
    }
  };

  if (showPasswordReset && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Change Password</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              You must change your password before continuing
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              {passwordResetError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {passwordResetError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordResetData.currentPassword}
                  onChange={(e) =>
                    setPasswordResetData({ ...passwordResetData, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordResetData.newPassword}
                  onChange={(e) =>
                    setPasswordResetData({ ...passwordResetData, newPassword: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must contain uppercase, lowercase, number, and special character
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password *</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={passwordResetData.confirmPassword}
                  onChange={(e) =>
                    setPasswordResetData({ ...passwordResetData, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-primary">DayFlow</h1>
            <p className="text-sm text-muted-foreground mt-1">HRMS Authentication</p>
          </div>
          <CardTitle>Sign In</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your credentials to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="loginIdOrEmail">Login ID or Email *</Label>
              <Input
                id="loginIdOrEmail"
                type="text"
                placeholder="Enter Login ID or Email"
                {...register('loginIdOrEmail')}
              />
              {errors.loginIdOrEmail && (
                <p className="text-sm text-red-600">{errors.loginIdOrEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline">
                Signup
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

