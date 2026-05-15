import { Bell } from 'lucide-react';
import RiskBadge from '../../../components/common/RiskBadge';

const WarningTable = ({ students, onNavigate }) => {
  const getFullName = (student) => {
    if (student.lastName && student.firstName) {
      const mid = student.middleName ? ` ${student.middleName.charAt(0)}.` : '';
      return `${student.lastName}, ${student.firstName}${mid}`;
    }
    if (student.last_name && student.first_name) {
      const mid = student.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
      return `${student.last_name}, ${student.first_name}${mid}`;
    }
    return student.name || String(student.id);
  };

  if (!students || students.length === 0) {
    return (
      <div className="no-alerts">
        <Bell size={48} />
        <p>No students found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="warning-table-container">
      <table className="warning-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Section</th>
            <th>PACE %</th>
            <th>Risk Level</th>
            <th>AI Risk %</th>
            <th>Primary Factor</th>
            <th>Suggested Action</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className={`risk-row ${(student.riskLevel || 'low').toLowerCase()}`}
            >
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
              <td
                className="factor-cell"
                style={{ maxWidth: 200, fontSize: '0.78rem', color: '#4B5563' }}
              >
                {student.suggestedAction || '—'}
              </td>
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
  );
};

export default WarningTable;