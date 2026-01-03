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
import PasswordInput from '../components/ui/PasswordInput';

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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
        <Card className="w-full max-w-md animate-scale-in">
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
                <PasswordInput
                  id="currentPassword"
                  value={passwordResetData.currentPassword}
                  onChange={(e) =>
                    setPasswordResetData({ ...passwordResetData, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <PasswordInput
                  id="newPassword"
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
                <PasswordInput
                  id="confirmNewPassword"
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.1),transparent_50%)]"></div>
      
      <Card className="w-full max-w-md relative z-10 animate-scale-in glass-effect">
        <CardHeader className="text-center">
          <div className="mb-6 animate-fade-in">
            <h1 className="text-4xl font-heading font-bold text-gradient mb-2">DayFlow</h1>
            <p className="text-sm text-muted-foreground">HRMS Authentication</p>
          </div>
          <CardTitle className="animate-slide-up stagger-1">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground mt-2 animate-slide-up stagger-2">
            Enter your credentials to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 border-2 border-destructive/20 rounded-lg animate-scale-in">
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
              <PasswordInput
                id="password"
                placeholder="Enter password"
                register={register('password')}
                error={errors.password?.message}
              />
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

