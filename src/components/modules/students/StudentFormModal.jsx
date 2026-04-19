import { X } from 'lucide-react';
import useStudentFormState from '../../../hooks/useStudentFormState';
import '../../../styles/students/StudentFormModal.css';

/**
 * StudentFormModal
 *
 * Props:
 *   isOpen        — boolean
 *   onClose       — fn
 *   onSave        — fn(formData) — called with the raw form payload
 *   student       — student object (null for add, object for edit)
 *   gradeLevels   — array from API: [{ grade_level_id, level, name }]
 *   sections      — array from API: [{ section_id, grade_level, name, section_code }]
 *   schoolYears   — array from API: [{ school_year_id, year, is_current }]
 */
const StudentFormModal = ({ isOpen, onClose, onSave, student, gradeLevels = [], sections = [], schoolYears = [] }) => {
  const {
    isEdit,
    formData,
    handleChange,
    handleSubmit,
  } = useStudentFormState({ isOpen, student, onSave });

  // Filter sections based on selected grade level
  const availableSections = formData.grade_level_id
    ? sections.filter(s => String(s.grade_level) === String(formData.grade_level_id))
    : sections;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Student' : 'Add New Student'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">

          {/* Student Personal Information */}
          <div className="form-section">
            <h4 className="form-section-title">Student Personal Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={e => handleChange('first_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  placeholder="Middle name (optional)"
                  value={formData.middle_name}
                  onChange={e => handleChange('middle_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={e => handleChange('last_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Date of Birth <span className="required">*</span></label>
                <input
                  type="date"
                  required
                  value={formData.birth_date}
                  onChange={e => handleChange('birth_date', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Gender <span className="required">*</span></label>
                <select
                  required
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="form-group field-full">
                <label>Address <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Complete address"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="form-section">
            <h4 className="form-section-title">Guardian Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Guardian First Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="First name"
                  value={formData.guardian_first_name}
                  onChange={e => handleChange('guardian_first_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Guardian Middle Name</label>
                <input
                  type="text"
                  placeholder="Middle name (optional)"
                  value={formData.guardian_mid_name}
                  onChange={e => handleChange('guardian_mid_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Guardian Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Last name"
                  value={formData.guardian_last_name}
                  onChange={e => handleChange('guardian_last_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Contact Number <span className="required">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="09XX XXX XXXX"
                  value={formData.guardian_contact}
                  onChange={e => handleChange('guardian_contact', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Relationship <span className="required">*</span></label>
                <select
                  required
                  value={formData.guardian_relationship}
                  onChange={e => handleChange('guardian_relationship', e.target.value)}
                >
                  <option value="">Select Relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enrollment Information */}
          <div className="form-section">
            <h4 className="form-section-title">Enrollment Information</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>School Year <span className="required">*</span></label>
                <select
                  required={!isEdit}
                  value={formData.school_year_id}
                  onChange={e => handleChange('school_year_id', e.target.value)}
                >
                  <option value="">Select School Year</option>
                  {schoolYears.map(sy => (
                    <option key={sy.school_year_id} value={sy.school_year_id}>
                      {sy.year}{sy.is_current ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Grade Level <span className="required">*</span></label>
                <select
                  required={!isEdit}
                  value={formData.grade_level_id}
                  onChange={e => {
                    handleChange('grade_level_id', e.target.value);
                    handleChange('section_id', ''); // reset section when grade changes
                  }}
                >
                  <option value="">Select Grade</option>
                  {gradeLevels.map(gl => (
                    <option key={gl.grade_level_id} value={gl.grade_level_id}>{gl.level}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section <span className="required">*</span></label>
                <select
                  required={!isEdit}
                  value={formData.section_id}
                  onChange={e => handleChange('section_id', e.target.value)}
                  disabled={!formData.grade_level_id}
                >
                  <option value="">
                    {formData.grade_level_id ? 'Select Section' : 'Select a grade first'}
                  </option>
                  {availableSections.map(s => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.section_code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Enrollment Date</label>
                <input
                  type="date"
                  value={formData.enrollment_date}
                  onChange={e => handleChange('enrollment_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn">{isEdit ? 'Save Changes' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormModal;
