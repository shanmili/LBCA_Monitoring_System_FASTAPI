import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../../styles/setup/SetupModal.css';

const TeacherAssignmentModal = ({ isOpen, onClose, onSave, teachers = [], sections = [] }) => {
  const [formData, setFormData] = useState({ teacher_id: '', section_id: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({ teacher_id: '', section_id: '' });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.teacher_id) newErrors.teacher_id = 'Please select a teacher';
    if (!formData.section_id) newErrors.section_id = 'Please select a section';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSave({
      teacher_id: formData.teacher_id,
      section_id: Number(formData.section_id),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="setup-modal-overlay" onClick={onClose}>
      <div className="setup-modal-content" onClick={e => e.stopPropagation()}>
        <div className="setup-modal-header">
          <h3>Assign Teacher to Section</h3>
          <button className="setup-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="setup-modal-form">
          <div className="setup-form-section">
            <h4 className="setup-form-section-title">Teacher Assignment</h4>

            <div className="setup-form-group">
              <label>Teacher <span className="required">*</span></label>
              <select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
                className={errors.teacher_id ? 'error' : ''}
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>
              {errors.teacher_id && <span className="setup-error-text">{errors.teacher_id}</span>}
            </div>

            <div className="setup-form-group">
              <label>Section <span className="required">*</span></label>
              <select
                name="section_id"
                value={formData.section_id}
                onChange={handleChange}
                className={errors.section_id ? 'error' : ''}
              >
                <option value="">-- Select Section --</option>
                {sections.map(section => (
                  <option key={section.section_id} value={section.section_id}>
                    {section.section_code} - {section.name}
                  </option>
                ))}
              </select>
              {errors.section_id && <span className="setup-error-text">{errors.section_id}</span>}
            </div>
          </div>

          <div className="setup-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn">Assign Teacher</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherAssignmentModal;
