import '../../../styles/teachers/TeacherTable.css';

const TeacherTable = ({ teachers, onToggleStatus, onResetPassword, getStatusBadgeClass, actionLoading }) => {

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
        <>
          <button 
            className="reset-password-btn"
            onClick={() => onResetPassword(teacher)}
            disabled={actionLoading === teacher.id}
            title="Reset password"
          >
            Reset PW
          </button>
          <span className="no-action">Awaiting Approval</span>
        </>
      );
    }
    
    return (
      <>
        {teacher.account_status === 'approved' && (
          <button 
            className="status-toggle active"
            onClick={() => handleStatusToggle(teacher)}
            disabled={actionLoading === teacher.id}
            title="Deactivate account"
          >
            Deactivate
          </button>
        )}
        
        {teacher.account_status === 'inactive' && (
          <button 
            className="status-toggle inactive"
            onClick={() => handleStatusToggle(teacher)}
            disabled={actionLoading === teacher.id}
            title="Reactivate account"
          >
            Activate
          </button>
        )}
        
        {teacher.account_status === 'rejected' && (
          <button 
            className="status-toggle reactivate"
            onClick={() => handleStatusToggle(teacher)}
            disabled={actionLoading === teacher.id}
            title="Approve this account"
          >
            Approve
          </button>
        )}
        
        <button 
          className="reset-password-btn"
          onClick={() => onResetPassword(teacher)}
          disabled={actionLoading === teacher.id}
          title="Reset password"
        >
          Reset PW
        </button>
      </>
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