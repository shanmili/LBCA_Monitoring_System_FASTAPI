const ProfilePaceTab = ({ student, paceRecords = [] }) => {
  if (!paceRecords || paceRecords.length === 0) {
    return (
      <div className="tab-content pace-tab">
        <div className="pace-summary-bar">
          <div className="pace-summary-item">
            <span className="summary-number">0</span>
            <span className="summary-label">PACEs Completed</span>
          </div>
          <div className="pace-summary-item">
            <span className="summary-number">0</span>
            <span className="summary-label">PACEs Remaining</span>
          </div>
          <div className="pace-summary-item">
            <span className="summary-number">0%</span>
            <span className="summary-label">Avg PACE %</span>
          </div>
        </div>
        <h4>PACE Progress by Subject</h4>
        <p className="no-data-message">No PACE progress data available.</p>
      </div>
    );
  }

  // Group pace records by subject
  const bySubject = {};
  paceRecords.forEach((p) => {
    const subj = p.subject || 'General';
    if (!bySubject[subj]) bySubject[subj] = [];
    bySubject[subj].push(p);
  });

  const subjects = Object.entries(bySubject).map(([name, records]) => {
    const avgPace = Math.round(
      records.reduce((sum, r) => sum + (r.pace_percent ?? 0), 0) / records.length
    );
    const completed = records.filter((r) => (r.pace_percent ?? 0) >= 100).length;
    const total = records.length;
    return { name, records, avgPace, completed, total };
  });

  const totalCompleted = subjects.reduce((s, subj) => s + subj.completed, 0);
  const totalRecords = paceRecords.length;
  const avgPaceAll = Math.round(
    paceRecords.reduce((s, r) => s + (r.pace_percent ?? 0), 0) / totalRecords
  );

  return (
    <div className="tab-content pace-tab">
      <div className="pace-summary-bar">
        <div className="pace-summary-item">
          <span className="summary-number">{totalCompleted}</span>
          <span className="summary-label">PACEs Completed</span>
        </div>
        <div className="pace-summary-item">
          <span className="summary-number">{totalRecords - totalCompleted}</span>
          <span className="summary-label">PACEs Remaining</span>
        </div>
        <div className="pace-summary-item">
          <span className="summary-number">{avgPaceAll}%</span>
          <span className="summary-label">Avg PACE %</span>
        </div>
      </div>

      <h4>PACE Progress by Subject</h4>
      <table className="pace-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Records</th>
            <th>Completed</th>
            <th>Avg PACE %</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subj) => (
            <tr key={subj.name}>
              <td className="subject-name">{subj.name}</td>
              <td>{subj.total}</td>
              <td>{subj.completed}</td>
              <td>{subj.avgPace}%</td>
              <td>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar ${subj.avgPace < 60 ? 'low' : subj.avgPace < 80 ? 'medium' : 'high'}`}
                      style={{ width: `${subj.avgPace}%` }}
                    />
                  </div>
                  <span className="progress-text">{subj.avgPace}%</span>
                </div>
              </td>
              <td>
                <span className={`subject-status ${subj.avgPace < 70 ? 'behind' : 'on-track'}`}>
                  {subj.avgPace < 70 ? 'Behind' : 'On Track'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Recent records */}
      <h4 style={{ marginTop: '1.5rem' }}>Recent PACE Records</h4>
      <table className="pace-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>PACE %</th>
            <th>Notes</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {[...paceRecords]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 10)
            .map((r) => (
              <tr key={r.pace_id || r.id}>
                <td className="subject-name">{r.subject || 'General'}</td>
                <td>
                  <span className={r.pace_percent >= 80 ? 'subject-status on-track' : 'subject-status behind'}>
                    {r.pace_percent ?? 0}%
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>{r.notes || '—'}</td>
                <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfilePaceTab;