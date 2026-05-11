import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '../../../styles/setup/SetupModal.css';

const TeacherAvailabilityModal = ({ isOpen, onClose, onSave, editingItem, teachers, days, saving }) => {
  const [formData, setFormData] = useState({
    teacher_id: '',
    day: 'Monday',
    start_time: '08:00',
    end_time: '12:00',
    location: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          teacher_id: editingItem.teacher_id || '',
          day: editingItem.day || 'Monday',
          start_time: editingItem.start_time || '08:00',
          end_time: editingItem.end_time || '12:00',
          location: editingItem.location || '',
        });
      } else {
        setFormData({ teacher_id: '', day: 'Monday', start_time: '08:00', end_time: '12:00', location: '' });
      }
      setErrors({});
    }
  }, [isOpen, editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.teacher_id) newErrors.teacher_id = 'Please select a teacher';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
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
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="setup-modal-overlay" onClick={onClose}>
      <div className="setup-modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div className="setup-modal-header">
          <h3>{editingItem ? 'Edit Teacher Availability' : 'Add Teacher Availability'}</h3>
          <button className="setup-modal-close" onClick={onClose} disabled={saving}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="setup-modal-form">
          <div className="setup-form-section">
            <h4 className="setup-form-section-title">Availability Details</h4>

            <div className="setup-form-group">
              <label>Teacher <span className="required">*</span></label>
              <select name="teacher_id" value={formData.teacher_id} onChange={handleChange} className={errors.teacher_id ? 'error' : ''} disabled={saving}>
                <option value="">-- Select Teacher --</option>
                {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name}</option>)}
              </select>
              {errors.teacher_id && <span className="setup-error-text">{errors.teacher_id}</span>}
            </div>

            <div className="setup-form-group">
              <label>Day <span className="required">*</span></label>
              <select name="day" value={formData.day} onChange={handleChange} disabled={saving}>
                {days.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>

            <div className="setup-form-grid">
              <div className="setup-form-group">
                <label>Start Time <span className="required">*</span></label>
                <select name="start_time" value={formData.start_time} onChange={handleChange} disabled={saving}>
                  {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
              <div className="setup-form-group">
                <label>End Time <span className="required">*</span></label>
                <select name="end_time" value={formData.end_time} onChange={handleChange} disabled={saving}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => <option key={time} value={time}>{time}</option>)}
                </select>
                {errors.end_time && <span className="setup-error-text">{errors.end_time}</span>}
              </div>
            </div>

            <div className="setup-form-group">
              <label>Location <span className="required">*</span></label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Faculty Room, Lab 1" className={errors.location ? 'error' : ''} disabled={saving} />
              {errors.location && <span className="setup-error-text">{errors.location}</span>}
            </div>
          </div>

          <div className="setup-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Update Availability' : 'Add Availability'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherAvailabilityModal;