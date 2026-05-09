import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, User, Sun, LogOut } from 'lucide-react';
import Theme from '../common/Theme.jsx';
import '../../styles/layout/UserMenu.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return sessionStorage.getItem('access_token');
}

async function fetchMe() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

const UserMenu = ({ onLogout, onNavigate }) => {
  const [isOpen,    setIsOpen]    = useState(false);
  const [photo,     setPhoto]     = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [role,      setRole]      = useState('');
  const menuRef = useRef(null);

  // ── Fetch own profile ───────────────────────────────────────────────────────
  const loadProfile = useCallback(() => {
    fetchMe()
      .then((data) => {
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name   ?? '');
        setRole(data.role            ?? '');
        const pic = data.profile_pic ?? null;
        setPhoto(pic ? (pic.startsWith('/') ? `${API_BASE}${pic}` : pic) : null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Re-fetch when the window regains focus (user comes back from profile page)
  useEffect(() => {
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, [loadProfile]);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => setIsOpen((o) => !o);
  const closeMenu  = () => setIsOpen(false);

  const handleProfileClick = () => {
    closeMenu();
    if (onNavigate) onNavigate('account-settings');
  };

  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || (role === 'admin' ? 'Admin User' : 'Teacher User');
  const initials  = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || (role === 'admin' ? 'AD' : 'TC');
  const roleLabel = role === 'admin' ? 'Administrator' : 'Teacher';

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-trigger" onClick={toggleMenu}>
        <div className="avatar">
          {photo
            ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div className="user-info">
          <span className="user-name">{fullName}</span>
          <span className="user-role">{roleLabel}</span>
        </div>
        <ChevronDown size={18} className={`dropdown-icon ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <p>Signed in as <strong>{fullName}</strong></p>
          </div>

          <div className="dropdown-divider" />

          <button className="dropdown-item" onClick={handleProfileClick}>
            <User size={16} />
            <span>Profile Settings</span>
          </button>

          <div className="dropdown-item" style={{ pointerEvents: 'auto' }}>
            <Sun size={16} />
            <span>Theme</span>
            <Theme />
          </div>

          <div className="dropdown-divider" />

          <button
            className="dropdown-item logout"
            onClick={() => { closeMenu(); if (onLogout) onLogout(); }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;