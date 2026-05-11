import '../../../styles/teachers/TeacherTable.css';
import { Check, X, RotateCcw, Power, Key, Trash2, RefreshCw } from 'lucide-react';

const TeacherTable = ({ 
  teachers, 
  onApproveUser, 
  onRejectUser, 
  onReacceptUser, 
  onDeactivateUser, 
  onResetPassword, 
  getStatusBadgeClass, 
  getDisplayStatus,
  formatRole,
  actionLoading 
}) => {

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderActions = (teacher) => {
    const isLoading = actionLoading === teacher.id;
    
    // Pending approval - show Accept/Reject
    if (teacher.account_status === 'pending') {
      return (
        <div className="action-buttons-container">
          <button 
            className="action-icon-btn approve"
            onClick={() => onApproveUser(teacher)}
            disabled={isLoading}
            title="Approve"
          >
            <Check size={18} />
          </button>
          <button 
            className="action-icon-btn reject"
            onClick={() => onRejectUser(teacher)}
            disabled={isLoading}
            title="Reject"
          >
            <X size={18} />
          </button>
        </div>
      );
    }
    
    // Rejected - show Re-accept button only
    if (teacher.account_status === 'rejected') {
      return (
        <div className="action-buttons-container">
          <button 
            className="action-icon-btn reaccept"
            onClick={() => onReacceptUser(teacher)}
            disabled={isLoading}
            title="Re-accept"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      );
    }
    
    // Inactive - show Reactivate button only
    if (teacher.account_status === 'inactive') {
      return (
        <div className="action-buttons-container">
          <button 
            className="action-icon-btn reactivate"
            onClick={() => onReacceptUser(teacher)}
            disabled={isLoading}
            title="Reactivate"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      );
    }
    
    // Approved/Active - show Reset Password and Trash/Deactivate
    if (teacher.account_status === 'approved') {
      return (
        <div className="action-buttons-container">
          <button 
            className="action-icon-btn reset-password"
            onClick={() => onResetPassword(teacher)}
            disabled={isLoading}
            title="Reset Password"
          >
            <Key size={18} />
          </button>
          <button 
            className="action-icon-btn deactivate"
            onClick={() => onDeactivateUser(teacher)}
            disabled={isLoading}
            title="Deactivate"
          >
            <Trash2 size={18} />
          </button>
        </div>
      );
    }
    
    return null;
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
                    {getDisplayStatus(teacher.account_status)}
                  </span>
                </td>
                <td>{formatRole(teacher.role)}</td>
                <td>{formatDate(teacher.created_at)}</td>
                <td className="action-cell">
                  {renderActions(teacher)}
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