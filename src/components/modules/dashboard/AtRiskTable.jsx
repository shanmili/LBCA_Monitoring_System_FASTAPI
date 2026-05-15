import RiskBadge from '../../../components/common/RiskBadge';
import '../../../styles/dashboard/AtRiskTable.css';

const AtRiskTable = ({ students, onNavigate }) => {
  const getFullName = (student) => {
    if (student.last_name && student.first_name) {
      const mid = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
      return `${student.last_name}, ${student.first_name}${mid}`;
    }
    return student.name || String(student.id);
  };

  if (!students || students.length === 0) {
    return (
      <div className="table-card">
        <div className="table-header">
          <h3 className="table-title">At-Risk Students</h3>
        </div>
        <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No at-risk students found for the current filters. 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="table-title">At-Risk Students</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          AI-powered · {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-wrapper">
        <table className="risk-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Section</th>
              <th>PACE %</th>
              <th>Risk</th>
              <th>AI Risk %</th>
              <th>Primary Factor</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className="student-name">{getFullName(student)}</td>
                <td>{student.section || '—'}</td>
                <td className="pace-cell">{student.pacePercent ?? 0}%</td>
                <td>
                  <RiskBadge level={student.riskLevel} />
                </td>
                <td style={{ fontSize: '0.8rem', color: student.isAiProbability ? '#1D4ED8' : '#6B7280' }}>
                  {student.riskProbability != null
                    ? `${student.riskProbability}%`
                    : '—'}
                </td>
                <td className="factor-cell">{student.factor || '—'}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => onNavigate('student-profile', student.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AtRiskTable;