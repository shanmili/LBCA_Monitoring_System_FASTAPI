import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import TeacherTable from './teachers/TeacherTable';
import TeacherFilter from './teachers/TeacherFilter';
import '../../styles/teachers/TeachersPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

const TeachersPage = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const token = localStorage.getItem('access_token');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all users for stats
      const allRes = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!allRes.ok) throw new Error('Failed to fetch users');
      const allData = await allRes.json();
      setAllUsers(allData);

      // Fetch filtered users for table
      const params = filter !== 'all' ? `?account_status=${filter}` : '';
      const filteredRes = await fetch(`${API_BASE}/api/users${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!filteredRes.ok) throw new Error('Failed to fetch filtered users');
      const filteredData = await filteredRes.json();
      setUsers(filteredData);
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
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dateStr = `${month}${day}`;
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
      const data = await res.json();
      if (!res.ok) throw new Error(String(data.detail) || 'Failed to reset password');
      showToast(`Password reset for ${user.email}. New password: ${tempPassword}`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    try {
      if (user.account_status === 'approved') {
        const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(String(data.detail) || 'Failed to deactivate');
        showToast(`${user.email} deactivated successfully.`);
      } else if (user.account_status === 'inactive') {
        const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ account_status: 'active' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(String(data.detail) || 'Failed to reactivate');
        showToast(`${user.email} reactivated successfully.`);
      } else if (user.account_status === 'rejected') {
        const res = await fetch(`${API_BASE}/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ account_status: 'approved' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(String(data.detail) || 'Failed to approve');
        showToast(`${user.email} approved successfully.`);
      }
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveUser = async (user) => {
    if (!window.confirm(`Approve registration for ${user.first_name} ${user.last_name}?`)) {
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
        body: JSON.stringify({ account_status: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data.detail) || 'Failed to approve');
      showToast(`${user.email} approved successfully.`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (user) => {
    setRejectingUser(user);
    setRejectModal(true);
    setRejectionReason('');
  };

  const confirmRejectUser = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason.');
      return;
    }
    setRejectModal(false);
    setActionLoading(rejectingUser.id);
    try {
      const res = await fetch(`${API_BASE}/api/users/${rejectingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_status: 'rejected', rejection_reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data.detail) || 'Failed to reject');
      showToast(`${rejectingUser.email} rejected.`);
      fetchUsers();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
      setRejectingUser(null);
    }
  };

  const cancelRejectUser = () => {
    setRejectModal(false);
    setRejectingUser(null);
    setRejectionReason('');
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

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'status-badge pending',
      approved: 'status-badge active',
      rejected: 'status-badge rejected',
      inactive: 'status-badge inactive'
    };
    return classes[status] || 'status-badge';
  };

  const stats = {
    total: allUsers.length,
    approved: allUsers.filter(u => u.account_status === 'approved').length,
    pending: allUsers.filter(u => u.account_status === 'pending').length,
    rejected: allUsers.filter(u => u.account_status === 'rejected').length,
    inactive: allUsers.filter(u => u.account_status === 'inactive').length,
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) return true;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const idText = String(user.id || '').toLowerCase();
    const emailText = String(user.email || '').toLowerCase();
    const statusText = String(user.account_status || '').toLowerCase();

    return (
      fullName.includes(normalizedSearch) ||
      idText.includes(normalizedSearch) ||
      emailText.includes(normalizedSearch) ||
      statusText.includes(normalizedSearch)
    );
  });

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

      <div className="teachers-search-row">
        <input
          type="text"
          className="teachers-search-input"
          placeholder="Search by name, email, ID, or status"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
        teachers={filteredUsers}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        getStatusBadgeClass={getStatusBadgeClass}
        actionLoading={actionLoading}
      />

      <div className="teachers-footer">
        <p>Showing {filteredUsers.length} of {users.length} teacher accounts</p>
      </div>

      {rejectModal && rejectingUser && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Reject Registration</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reject the registration for <strong>{rejectingUser.first_name} {rejectingUser.last_name}</strong>?</p>
              <textarea
                className="modal-textarea"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={cancelRejectUser}>
                Cancel
              </button>
              <button className="modal-btn reject" onClick={confirmRejectUser} disabled={!rejectionReason.trim()}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
};

export default TeachersPage;