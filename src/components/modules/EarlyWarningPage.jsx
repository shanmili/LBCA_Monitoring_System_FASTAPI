// ============================================================
// EarlyWarningPage.jsx — live data version
// ============================================================

import React from 'react';
import RiskSummary from './earlyWarning/RiskSummary';
import WarningFilter from './earlyWarning/WarningFilter';
import WarningTable from './earlyWarning/WarningTable';
import useEarlyWarningState from '../../hooks/useEarlyWarningState';
import '../../styles/earlyWarning/EarlyWarningPage.css';

const EarlyWarningPage = ({ onNavigate, teacher = null }) => {
  const {
    filters,
    updateFilter,
    filteredStudents,
    allStudents,
    riskCounts,
    sectionOptions,
    schoolYearOptions,
    loading,
    aiLoading,
    error,
  } = useEarlyWarningState(teacher);

  return (
    <div className="warning-page">
      <div className="warning-header-row">
        <div className="header-title">
          <h2>Early Warning Alerts</h2>
          <p className="header-subtitle">
            Monitor and manage at-risk students based on PACE progress
            {aiLoading && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ⏳ AI analysing…
              </span>
            )}
          </p>
        </div>

        <WarningFilter
          filters={filters}
          onFilterChange={updateFilter}
          teacher={teacher}
          sectionOptions={sectionOptions}
          schoolYearOptions={schoolYearOptions}
        />
      </div>

      {error && (
        <div style={{ color: '#EF4444', padding: '1rem 0', fontSize: '0.875rem' }}>
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading early warning data…
        </div>
      ) : (
        <>
          <RiskSummary counts={riskCounts} />
          <WarningTable students={filteredStudents} onNavigate={onNavigate} />
          <div className="warning-footer">
            <p>
              Showing {filteredStudents.length} of {allStudents.length} students
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default EarlyWarningPage;