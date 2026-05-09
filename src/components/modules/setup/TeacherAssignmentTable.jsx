import { Pencil, Trash2, Users } from 'lucide-react';

const TeacherAssignmentTable = ({ assignments = [], onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="us-sections-empty">
        <span>Loading assignments…</span>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="us-sections-empty">
        <Users size={14} />
        <span>No teacher assignments yet.</span>
      </div>
    );
  }

  return (
    <table className="setup-table us-sections-table">
      <thead>
        <tr>
          <th>Teacher Name</th>
          <th>Section Code</th>
          <th>Section Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {assignments.map(assignment => (
          <tr key={assignment.assignment_id}>
            <td className="setup-td-bold">{assignment.teacher_name || 'Unknown'}</td>
            <td>{assignment.section_code || 'N/A'}</td>
            <td>{assignment.section_name || 'N/A'}</td>
            <td>
              <div className="setup-actions">
                <button
                  className="setup-action-btn delete"
                  onClick={() => onDelete(assignment.assignment_id)}
                  title="Delete assignment"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TeacherAssignmentTable;
