import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import ProfileDropdown from './ProfileDropdown';
import { useState } from 'react';

interface NavigationProps {
  activeTab?: 'employees' | 'attendance' | 'time-off' | 'manage';
}

export default function Navigation({ activeTab }: NavigationProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <nav className="glass-effect border-b border-border/50 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
          <div className="flex items-center space-x-6 w-full sm:w-auto">
            <h1 className="text-2xl font-heading font-bold text-gradient">DayFlow HRMS</h1>
            <div className="flex items-center space-x-1 sm:space-x-3 flex-wrap gap-2">
              <button
                onClick={() => navigate('/employees')}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === 'employees'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => navigate('/attendance')}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => navigate('/time-off')}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === 'time-off'
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                Time Off
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/welcome')}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === 'manage'
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  Manage Employees
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {user?.role === 'employee' && (
              <Button
                onClick={() => {/* Will be handled by parent */}}
                size="sm"
                variant="outline"
                className="whitespace-nowrap"
              >
                Check In / Out
              </Button>
            )}
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
      </div>
    </nav>
  );
}

