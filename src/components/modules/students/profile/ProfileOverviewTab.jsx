import { BookOpen, Calendar, Shield, User, Users, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const ProfileOverviewTab = ({ student }) => {
  const getGuardianFullName = () => {
    const mid = student.guardian_mid_name ? ` ${student.guardian_mid_name.charAt(0)}.` : '';
    return `${student.guardian_last_name}, ${student.guardian_first_name}${mid}`;
  };

  return (
    <div className="tab-content overview-tab">
      {/* Quick Stats — PACE/attendance not available yet from API; show enrollment info instead */}
      <div className="overview-stats-row">
        <div className="overview-stat-card pace-stat">
          <BookOpen size={20} />
          <div className="stat-content">
            <span className="stat-number">{student.gradeLevelDisplay}</span>
            <span className="stat-label">Grade Level</span>
          </div>
        </div>
        <div className="overview-stat-card attendance-stat">
          <Calendar size={20} />
          <div className="stat-content">
            <span className="stat-number">{student.sectionDisplay}</span>
            <span className="stat-label">Section</span>
          </div>
        </div>
        <div className="overview-stat-card risk-stat-card">
          <Shield size={20} />
          <div className="stat-content">
            <span className="stat-number" style={{ fontSize: 14 }}>
              {student.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="stat-label">Enrollment Status</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="overview-grid">
        {/* Column 1 - Student Information */}
        <div className="info-card">
          <h4><User size={16} /> Student Information</h4>

          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">
                {student.last_name}, {student.first_name}{student.middle_name ? ` ${student.middle_name}` : ''}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Date of Birth:</span>
              <span className="info-value">{student.birth_date}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Gender:</span>
              <span className="info-value">{student.gender}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Address:</span>
              <span className="info-value">{student.address}</span>
            </div>
            {student.login_id && (
              <div className="info-row">
                <span className="info-label">Login ID:</span>
                <span className="info-value"><strong>{student.login_id}</strong></span>
              </div>
            )}
          </div>

          <div className="info-subsection">
            <h5><Users size={14} /> Guardian Information</h5>
            <div className="info-row">
              <span className="info-label">Guardian:</span>
              <span className="info-value">{getGuardianFullName()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Contact:</span>
              <span className="info-value">{student.guardian_contact}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Relationship:</span>
              <span className="info-value">{student.guardian_relationship}</span>
            </div>
          </div>
        </div>

        {/* Column 2 - Enrollment Information */}
        <div className="info-card">
          <h4><CalendarIcon size={16} /> Enrollment Information</h4>

          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Student ID:</span>
              <span className="info-value">{student.student_id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Grade Level:</span>
              <span className="info-value">{student.gradeLevelDisplay}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Section:</span>
              <span className="info-value">{student.sectionDisplay}</span>
            </div>
            <div className="info-row">
              <span className="info-label">School Year:</span>
              <span className="info-value">{student.schoolYearDisplay}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Enrollment Date:</span>
              <span className="info-value">{student.enrollment?.enrollment_date || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value">
                <span className={`status-inline ${student.isActive ? 'on-track' : 'behind'}`}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </span>
              </span>
            </div>
            {student.enrollment?.end_of_year_status && (
              <div className="info-row">
                <span className="info-label">End of Year:</span>
                <span className="info-value">{student.enrollment.end_of_year_status}</span>
              </div>
            )}
          </div>

          <div className="info-subsection">
            <h5><AlertCircle size={14} /> PACE &amp; Attendance</h5>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0 0' }}>
              PACE and attendance data will be available once the subject backend is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverviewTab;
