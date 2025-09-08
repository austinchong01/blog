import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Posts from './pages/Posts';
import NewPost from './pages/NewPost';
import EditPost from './pages/EditPost';
import Comments from './pages/Comments';
import Users from './pages/Users';
import Login from './pages/Login';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute - Authenticated, rendering children');
  return children;
};

// Admin Route component (only for admins)
const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();

  console.log('AppContent - isAuthenticated:', isAuthenticated, 'loading:', loading, 'user:', user);

  return (
    <div className="App">
      {isAuthenticated && <Navbar />}
      <main className={isAuthenticated ? "main-content" : ""}>
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <>
                  {console.log('Login route - Already authenticated, redirecting to dashboard')}
                  <Navigate to="/dashboard" replace />
                </>
              ) : (
                <>
                  {console.log('Login route - Not authenticated, showing login')}
                  <Login />
                </>
              )
            } 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts"
            element={
              <ProtectedRoute>
                <Posts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/new"
            element={
              <ProtectedRoute>
                <NewPost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/edit/:id"
            element={
              <ProtectedRoute>
                <EditPost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comments"
            element={
              <ProtectedRoute>
                <Comments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;