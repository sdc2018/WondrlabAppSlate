import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Import context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Clients from './pages/Clients';
import Opportunities from './pages/Opportunities';
import Matrix from './pages/Matrix';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';
import BusinessUnits from './pages/BusinessUnits';
import Users from './pages/Users';
import Profile from './pages/Profile';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
        <Route path="services" element={<Services />} />
        <Route path="clients" element={<Clients />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="matrix" element={<Matrix />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        
        {/* Admin routes */}
        <Route path="admin">
          <Route path="users" element={<Users />} />
          <Route path="business-units" element={<BusinessUnits />} />
        </Route>
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;