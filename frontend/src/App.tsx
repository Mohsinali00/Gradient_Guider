import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeInfoPage from './pages/EmployeeInfoPage';
import ProfilePage from './pages/ProfilePage';
import EmployeeAttendancePage from './pages/EmployeeAttendancePage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import EmployeeTimeOffPage from './pages/EmployeeTimeOffPage';
import AdminTimeOffPage from './pages/AdminTimeOffPage';
import ProtectedRoute from './components/ProtectedRoute';

// Component to render attendance page based on user role
function AttendancePage() {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminAttendancePage />;
  }
  
  return <EmployeeAttendancePage />;
}

// Component to render time-off page based on user role
function TimeOffPage() {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminTimeOffPage />;
  }
  
  return <EmployeeTimeOffPage />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute>
              <EmployeeInfoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/time-off"
          element={
            <ProtectedRoute>
              <TimeOffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

