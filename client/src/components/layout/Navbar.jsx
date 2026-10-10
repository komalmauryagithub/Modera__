import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Image, Clock, LogOut, Menu, X, Sparkles } from 'lucide-react';
import '../../styles/navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-logo-icon">
            <Calendar size={20} />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">MEMORA</span>
            <span className="brand-sub">Every Date Has a Story</span>
          </div>
        </NavLink>

        {isAuthenticated && (
          <>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <ul className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`}>
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar size={16} />
                  <span>Calendar</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/gallery"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Image size={16} />
                  <span>Gallery</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/upcoming"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Clock size={16} />
                  <span>Upcoming</span>
                </NavLink>
              </li>

              {/* Mobile user row */}
              <li className="mobile-user-row" style={{ display: mobileMenuOpen ? 'flex' : 'none' }}>
                <div className="user-badge">
                  <div className="user-avatar">{getInitials(user?.name)}</div>
                  <span className="user-name">{user?.name}</span>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>

            <div className="navbar-user-actions">
              <div className="user-badge" title={user?.email}>
                <div className="user-avatar">{getInitials(user?.name)}</div>
                <span className="user-name">{user?.name}</span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
