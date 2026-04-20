import { Check, X, RotateCcw, Lock, Unlock } from 'lucide-react';
import '../../../styles/teachers/TeacherTable.css';

const TeacherTable = ({ teachers, onToggleStatus, onResetPassword, onApproveUser, onRejectUser, getStatusBadgeClass, actionLoading }) => {

  const handleStatusToggle = (teacher) => {
    const action = teacher.account_status === 'approved' ? 'deactivate' : 'activate';
    const message = `Are you sure you want to ${action} the account "${teacher.first_name} ${teacher.last_name}"?`;
    
    if (window.confirm(message)) {
      onToggleStatus(teacher);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActionButtons = (teacher) => {
    if (teacher.account_status === 'pending') {
      return (
        <div className="icon-action-buttons">
          <button 
            className="icon-btn approve"
            onClick={() => onApproveUser(teacher)}
            disabled={actionLoading === teacher.id}
            title="Approve registration"
          >
            <Check size={18} />
          </button>
          <button 
            className="icon-btn reject"
            onClick={() => onRejectUser(teacher)}
            disabled={actionLoading === teacher.id}
            title="Reject registration"
          >
            <X size={18} />
          </button>
        </div>
      );
    }
    
    return (
      <div className="icon-action-buttons">
        {teacher.account_status === 'approved' && (
          <button 
            className="icon-btn deactivate"
            onClick={() => handleStatusToggle(teacher)}
            disabled={actionLoading === teacher.id}
            title="Deactivate account"
          >
            <Lock size={18} />
          </button>
        )}
        
        {teacher.account_status === 'inactive' && (
          <button 
            className="icon-btn activate"
            onClick={() => handleStatusToggle(teacher)}
            disabled={actionLoading === teacher.id}
            title="Activate account"
          >
            <Unlock size={18} />
          </button>
        )}
        
        {teacher.account_status === 'rejected' && (
          <button 
            className="icon-btn approve"
            onClick={() => handleStatusToggle(teacher)}
            disabled={actionLoading === teacher.id}
            title="Approve this account"
          >
            <Check size={18} />
          </button>
        )}
        
        {teacher.account_status !== 'pending' && teacher.account_status !== 'rejected' && teacher.account_status !== 'inactive' && (
          <button 
            className="icon-btn reset-password"
            onClick={() => onResetPassword(teacher)}
            disabled={actionLoading === teacher.id}
            title="Reset password"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="teachers-table-container">
      <table className="teachers-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Role</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.length > 0 ? (
            teachers.map(teacher => (
              <tr key={teacher.id}>
                <td className="username-cell">
                  {teacher.first_name} {teacher.last_name}
                </td>
                <td>{teacher.email}</td>
                <td>
                  <span className={getStatusBadgeClass(teacher.account_status)}>
                    {teacher.account_status}
                  </span>
                </td>
                <td>{teacher.role || 'teacher'}</td>
                <td>{formatDate(teacher.created_at)}</td>
                <td className="action-cell">
                  <div className="action-buttons-container">
                    {getActionButtons(teacher)}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-results">No teacher accounts found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TeacherTable;