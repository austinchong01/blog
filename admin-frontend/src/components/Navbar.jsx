import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          Blog Admin
        </Link>
        
        <div className="navbar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          
          <Link 
            to="/posts" 
            className={`nav-link ${isActive('/posts') ? 'active' : ''}`}
          >
            Posts
          </Link>
          
          <Link 
            to="/comments" 
            className={`nav-link ${isActive('/comments') ? 'active' : ''}`}
          >
            Comments
          </Link>
          
          <Link 
            to="/users" 
            className={`nav-link ${isActive('/users') ? 'active' : ''}`}
          >
            Users
          </Link>
          
          <span className="nav-link" style={{ color: '#adb5bd' }}>
            {user?.username} ({user?.role})
          </span>
          
          <button 
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ color: '#adb5bd', borderColor: '#adb5bd' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;