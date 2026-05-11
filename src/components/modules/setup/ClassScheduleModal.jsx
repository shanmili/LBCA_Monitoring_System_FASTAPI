import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../../styles/setup/SetupModal.css';

const ClassScheduleModal = ({ isOpen, onClose, onSave, editingItem, schoolYears, sections, subjects, teachers, gradeLevels, days, saving }) => {
  const [formData, setFormData] = useState({
    school_year_id: '',
    grade_level_id: '',
    section_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
    room: '',
  });
  const [errors, setErrors] = useState({});
  const [filteredSections, setFilteredSections] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const currentYear = schoolYears.find(sy => sy.is_current);
      setFormData({
        school_year_id: currentYear?.school_year_id || (schoolYears[0]?.school_year_id || ''),
        grade_level_id: '',
        section_id: '',
        subject_id: '',
        teacher_id: '',
        day_of_week: 'Monday',
        start_time: '08:00',
        end_time: '09:00',
        room: '',
      });
      setErrors({});
      setFilteredSections([]);
      setFilteredSubjects([]);
    }
  }, [isOpen, schoolYears]);

  // Filter sections when grade level changes
  useEffect(() => {
    if (formData.grade_level_id) {
      const filtered = sections.filter(s => s.grade_level === parseInt(formData.grade_level_id));
      setFilteredSections(filtered);
      if (!filtered.find(s => s.section_id === parseInt(formData.section_id))) {
        setFormData(prev => ({ ...prev, section_id: '' }));
      }
    } else {
      setFilteredSections([]);
    }
  }, [formData.grade_level_id, sections]);

  // Filter subjects when section changes
  useEffect(() => {
    if (formData.section_id) {
      const selectedSection = sections.find(s => s.section_id === parseInt(formData.section_id));
      if (selectedSection) {
        const gradeSubjects = subjects.filter(s => s.grade_level_id === selectedSection.grade_level);
        setFilteredSubjects(gradeSubjects);
      } else {
        setFilteredSubjects([]);
      }
    } else {
      setFilteredSubjects([]);
    }
  }, [formData.section_id, sections, subjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.school_year_id) newErrors.school_year_id = 'Please select a school year';
    if (!formData.grade_level_id) newErrors.grade_level_id = 'Please select a grade level';
    if (!formData.section_id) newErrors.section_id = 'Please select a section';
    if (!formData.subject_id) newErrors.subject_id = 'Please select a subject';
    if (!formData.teacher_id) newErrors.teacher_id = 'Please select a teacher';
    if (!formData.room.trim()) newErrors.room = 'Room is required';
    if (formData.end_time <= formData.start_time) newErrors.end_time = 'End time must be after start time';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave({
      school_year_id: parseInt(formData.school_year_id),
      section_id: parseInt(formData.section_id),
      subject_id: parseInt(formData.subject_id),
      teacher_id: formData.teacher_id,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      room: formData.room,
    });
  };

  // Time slots from 6 AM to 6 PM (30-minute intervals)
  const timeSlots = [];
  for (let hour = 6; hour <= 18; hour++) {
    for (let minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      if (hour === 18 && minute === '30') continue;
      timeSlots.push(time);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="setup-modal-overlay" onClick={onClose}>
      <div className="setup-modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="setup-modal-header">
          <h3>{editingItem ? 'Edit Class Schedule' : 'Add Class Schedule'}</h3>
          <button className="setup-modal-close" onClick={onClose} disabled={saving}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="setup-modal-form">
          <div className="setup-form-section">
            <h4 className="setup-form-section-title">Schedule Details</h4>

            <div className="setup-form-group">
              <label>School Year <span className="required">*</span></label>
              <select name="school_year_id" value={formData.school_year_id} onChange={handleChange} className={errors.school_year_id ? 'error' : ''} disabled={saving}>
                <option value="">-- Select School Year --</option>
                {schoolYears.map(sy => (
                  <option key={sy.school_year_id} value={sy.school_year_id}>{sy.year} {sy.is_current ? '(Current)' : ''}</option>
                ))}
              </select>
              {errors.school_year_id && <span className="setup-error-text">{errors.school_year_id}</span>}
            </div>

            <div className="setup-form-group">
              <label>Grade Level <span className="required">*</span></label>
              <select name="grade_level_id" value={formData.grade_level_id} onChange={handleChange} className={errors.grade_level_id ? 'error' : ''} disabled={saving}>
                <option value="">-- Select Grade Level --</option>
                {gradeLevels.map(gl => (
                  <option key={gl.grade_level_id} value={gl.grade_level_id}>{gl.level} - {gl.name}</option>
                ))}
              </select>
              {errors.grade_level_id && <span className="setup-error-text">{errors.grade_level_id}</span>}
            </div>

            <div className="setup-form-group">
              <label>Section <span className="required">*</span></label>
              <select name="section_id" value={formData.section_id} onChange={handleChange} className={errors.section_id ? 'error' : ''} disabled={saving || !formData.grade_level_id}>
                <option value="">-- Select Section --</option>
                {filteredSections.map(section => (
                  <option key={section.section_id} value={section.section_id}>{section.section_code} - {section.name}</option>
                ))}
              </select>
              {errors.section_id && <span className="setup-error-text">{errors.section_id}</span>}
              {formData.grade_level_id && filteredSections.length === 0 && <span className="setup-error-text">No sections available for this grade level</span>}
            </div>

            <div className="setup-form-group">
              <label>Subject <span className="required">*</span></label>
              <select name="subject_id" value={formData.subject_id} onChange={handleChange} className={errors.subject_id ? 'error' : ''} disabled={saving || !formData.section_id}>
                <option value="">-- Select Subject --</option>
                {filteredSubjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>{subject.subject_name} ({subject.subject_code})</option>
                ))}
              </select>
              {errors.subject_id && <span className="setup-error-text">{errors.subject_id}</span>}
              {formData.section_id && filteredSubjects.length === 0 && <span className="setup-error-text">No subjects available for this grade level</span>}
            </div>

            <div className="setup-form-group">
              <label>Teacher <span className="required">*</span></label>
              <select name="teacher_id" value={formData.teacher_id} onChange={handleChange} className={errors.teacher_id ? 'error' : ''} disabled={saving}>
                <option value="">-- Select Teacher --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name}</option>
                ))}
              </select>
              {errors.teacher_id && <span className="setup-error-text">{errors.teacher_id}</span>}
            </div>

            <div className="setup-form-grid">
              <div className="setup-form-group">
                <label>Day of Week <span className="required">*</span></label>
                <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} disabled={saving}>
                  {days.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div className="setup-form-group">
                <label>Room <span className="required">*</span></label>
                <input type="text" name="room" value={formData.room} onChange={handleChange} placeholder="e.g., Room 101" className={errors.room ? 'error' : ''} disabled={saving} />
                {errors.room && <span className="setup-error-text">{errors.room}</span>}
              </div>
            </div>

            <div className="setup-form-grid">
              <div className="setup-form-group">
                <label>Start Time <span className="required">*</span></label>
                <select name="start_time" value={formData.start_time} onChange={handleChange} disabled={saving}>
                  {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
              <div className="setup-form-group">
                <label>End Time <span className="required">*</span></label>
                <select name="end_time" value={formData.end_time} onChange={handleChange} disabled={saving}>
                  {timeSlots.map(time => {
                    const timeValue = time;
                    if (timeValue > formData.start_time || (formData.start_time && timeValue > formData.start_time)) {
                      return <option key={time} value={time}>{time}</option>;
                    }
                    return null;
                  }).filter(Boolean)}
                </select>
                {errors.end_time && <span className="setup-error-text">{errors.end_time}</span>}
              </div>
            </div>
          </div>

          <div className="setup-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={saving}>{saving ? 'Saving...' : 'Add Schedule'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassScheduleModal;