import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import StudentTable from './students/StudentTable';
import StudentFilter from './students/StudentFilter';
import StudentFormModal from './students/StudentFormModal';
import useStudentsPageState from '../../hooks/useStudentsPageState';
import '../../styles/students/StudentsPage.css';

const StudentsPage = ({ onNavigate, teacher = null }) => {
  const {
    students,
    filteredStudents,
    gradeLevels,
    sections,
    schoolYears,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    getStatusBadgeClass,
    handleAddStudent,
    refetch,
  } = useStudentsPageState(teacher);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="students-page">
      <div className="students-header-row">
        <div className="header-title">
          <div className="title-wrapper">
            <h2>Students List</h2>
          </div>
          <p className="header-subtitle">Manage and view all enrolled students</p>
        </div>

        <div className="students-filters">
          <StudentFilter
            filters={filters}
            onFilterChange={updateFilter}
            gradeLevels={gradeLevels}
            sections={sections}
            schoolYears={schoolYears}
            teacher={teacher}
          />
          <button className="add-student-btn" onClick={() => setIsModalOpen(true)}>
            + Add Student
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 0 12px 0' }}>
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db',
            width: 280, fontSize: 13,
          }}
        />
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', marginBottom: 12,
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
          color: '#b91c1c', fontSize: 13,
        }}>
          <AlertCircle size={15} />
          <span style={{ flex: 1 }}>Failed to load students: {error}</span>
          <button onClick={refetch} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: '1px solid #f87171', borderRadius: 4,
            padding: '2px 8px', color: '#b91c1c', cursor: 'pointer', fontSize: 12,
          }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
          Loading students…
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          getStatusBadgeClass={getStatusBadgeClass}
          onNavigate={onNavigate}
        />
      )}

      <div className="students-footer">
        <p>Showing {filteredStudents.length} of {students.length} students</p>
      </div>

      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (formData) => {
          try {
            await handleAddStudent(formData);
            setIsModalOpen(false);
          } catch {
            // error already alerted inside handleAddStudent
          }
        }}
        student={null}
        gradeLevels={gradeLevels}
        sections={sections}
        schoolYears={schoolYears}
      />
    </div>
  );
};

export default StudentsPage;
