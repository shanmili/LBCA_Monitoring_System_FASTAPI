import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import TeacherTable from './teachers/TeacherTable';
import TeacherFilter from './teachers/TeacherFilter';
import '../../styles/teachers/TeachersPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const TeachersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  const token = localStorage.getItem('access_token');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter !== 'all' ? `?account_status=${filter}` : '';
      const res = await fetch(`${API_BASE}/api/users${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
  };

  const generateTempPassword = (lastName) => {
    const year = new Date().getFullYear();
    return `${lastName}${year}!`;
  };

  const handleResetPassword = async (user) => {
    const tempPassword = generateTempPassword(user.last_name);
    
    if (!window.confirm(`Reset password for ${user.first_name} ${user.last_name}?\n\nNew password will be: ${tempPassword}\n\nUser will be required to change password on next login.`)) {
      return;
    }
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          password: tempPassword,
          requires_password_change: true 
        }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      showToast(`Password reset for ${user.email}. New password: ${tempPassword}`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveUser = async (user) => {
    if (!window.confirm(`Approve ${user.first_name} ${user.last_name}?`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve user');
      showToast(`${user.email} approved successfully.`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (user) => {
    if (!window.confirm(`Reject ${user.first_name} ${user.last_name}?`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_status: 'rejected', rejection_reason: 'Rejected by administrator' }),
      });
      if (!res.ok) throw new Error('Failed to reject user');
      showToast(`${user.email} rejected successfully.`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReacceptUser = async (user) => {
    if (!window.confirm(`Re-accept ${user.first_name} ${user.last_name}?`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to re-accept user');
      showToast(`${user.email} has been re-accepted successfully.`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (user) => {
    if (!window.confirm(`Deactivate ${user.first_name} ${user.last_name}?`)) return;
    
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to deactivate');
      showToast(`${user.email} deactivated successfully.`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayStatus = (status) => {
    if (status === 'approved') return 'Active';
    if (status === 'inactive') return 'Inactive';
    if (status === 'rejected') return 'Rejected';
    if (status === 'pending') return 'Pending';
    return status;
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'status-badge pending',
      approved: 'status-badge active',
      rejected: 'status-badge rejected',
      inactive: 'status-badge inactive'
    };
    return classes[status] || 'status-badge';
  };

  const formatRole = (role) => {
    if (!role) return 'Teacher';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const stats = {
    total: users.length,
    approved: users.filter(u => u.account_status === 'approved').length,
    pending: users.filter(u => u.account_status === 'pending').length,
    rejected: users.filter(u => u.account_status === 'rejected').length,
    inactive: users.filter(u => u.account_status === 'inactive').length,
  };

  const updateFilter = (filterKey, value) => {
    if (filterKey === 'status') {
      setFilter(value);
    }
  };

  const filters = {
    status: filter,
    customized: 'all'
  };

  if (loading) {
    return <div className="teachers-page"><div className="loading-state">Loading...</div></div>;
  }

  return (
    <div className="teachers-page">
      <div className="teachers-header-row">
        <div className="header-title">
          <div className="title-wrapper">
            <Users size={24} />
            <h2>Teacher Accounts</h2>
          </div>
          <p className="header-subtitle">Approve, reject, or manage teacher accounts</p>
        </div>
        
        <div className="teachers-filters">
          <TeacherFilter 
            filters={filters}
            onFilterChange={updateFilter}
          />
        </div>
      </div>

      <div className="teacher-stats">
        <div className="stat-card">
          <Users size={24} className="stat-icon total" />
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Accounts</span>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle size={24} className="stat-icon active" />
          <div className="stat-content">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card">
          <XCircle size={24} className="stat-icon inactive" />
          <div className="stat-content">
            <span className="stat-value">{stats.inactive}</span>
            <span className="stat-label">Inactive</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={24} className="stat-icon pending" />
          <div className="stat-content">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {error && <div className="approvals-error">{error}</div>}

      <TeacherTable 
        teachers={users}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        onReacceptUser={handleReacceptUser}
        onDeactivateUser={handleDeactivateUser}
        onResetPassword={handleResetPassword}
        getStatusBadgeClass={getStatusBadgeClass}
        getDisplayStatus={getDisplayStatus}
        formatRole={formatRole}
        actionLoading={actionLoading}
      />

      <div className="teachers-footer">
        <p>Showing {users.length} teacher accounts</p>
      </div>

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
};

export default TeachersPage;