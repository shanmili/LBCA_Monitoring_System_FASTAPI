import React, { useEffect, useCallback, useState } from 'react';
import SidebarItem from './SidebarItem';
import Logo from '../common/Logo';
import '../../styles/layout/Sidebar.css';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  AlertTriangle,
  Menu,
  BookOpen,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

function getToken() {
  return sessionStorage.getItem('access_token');
}

async function fetchAdminProfile() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/users/admin-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load admin profile');
  return res.json();
}

const Sidebar = ({ isOpen, activeTab, onNavigate, onToggle, userRole = 'teacher' }) => {
  const isAdmin   = userRole === 'admin';
  const isTeacher = userRole === 'teacher';

  const [adminPhoto,     setAdminPhoto]     = useState(null);
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName,  setAdminLastName]  = useState('');

  // ── Always fetch the admin's profile for the sidebar logo ──────────────────
  const loadAdminProfile = useCallback(() => {
    fetchAdminProfile()
      .then((data) => {
        setAdminFirstName(data.first_name ?? '');
        setAdminLastName(data.last_name   ?? '');
        const pic = data.profile_pic ?? null;
        setAdminPhoto(pic ? (pic.startsWith('/') ? `${API_BASE}${pic}` : pic) : null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadAdminProfile(); }, [loadAdminProfile]);

  // Re-fetch when window regains focus (e.g. admin just updated their photo)
  useEffect(() => {
    window.addEventListener('focus', loadAdminProfile);
    return () => window.removeEventListener('focus', loadAdminProfile);
  }, [loadAdminProfile]);

  const adminInitials = (
    (adminFirstName[0] ?? '') + (adminLastName[0] ?? '')
  ).toUpperCase() || 'AD';

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle-btn" onClick={onToggle}>
          <Menu size={20} />
        </button>
        <Logo
          adminPhoto={adminPhoto}
          adminInitials={adminInitials}
          showText={isOpen}
        />
      </div>

      <nav className="sidebar-menu">
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
          collapsed={!isOpen}
        />
        <SidebarItem
          icon={Users}
          label="Students"
          active={activeTab === 'students'}
          onClick={() => onNavigate('students')}
          collapsed={!isOpen}
        />

        {isAdmin && (
          <SidebarItem
            icon={Users}
            label="Teachers"
            active={activeTab === 'teachers'}
            onClick={() => onNavigate('teachers')}
            collapsed={!isOpen}
          />
        )}

        {isTeacher && (
          <SidebarItem
            icon={GraduationCap}
            label="PACE Progress"
            active={activeTab === 'pace'}
            onClick={() => onNavigate('pace')}
            collapsed={!isOpen}
          />
        )}

        <SidebarItem
          icon={AlertTriangle}
          label="Early Warning"
          active={activeTab === 'risk'}
          onClick={() => onNavigate('risk')}
          collapsed={!isOpen}
        />

        {isAdmin && (
          <>
            <div className="sidebar-divider" />
            <SidebarItem
              icon={BookOpen}
              label="Class Management"
              active={activeTab === 'setup'}
              onClick={() => onNavigate('class-management')}
              collapsed={!isOpen}
            />
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;