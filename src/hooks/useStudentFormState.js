import { useState, useEffect } from 'react';

const emptyForm = {
  first_name: '',
  middle_name: '',
  last_name: '',
  birth_date: '',
  gender: '',
  address: '',
  guardian_first_name: '',
  guardian_mid_name: '',
  guardian_last_name: '',
  guardian_contact: '',
  guardian_relationship: '',
  // Enrollment fields
  grade_level_id: '',
  section_id: '',
  school_year_id: '',
  enrollment_date: '',
};

export default function useStudentFormState({ isOpen, student, onSave }) {
  const isEdit = Boolean(student);

  const buildFormData = () => {
    if (student) {
      return {
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        birth_date: student.birth_date || '',
        gender: student.gender || '',
        address: student.address || '',
        guardian_first_name: student.guardian_first_name || '',
        guardian_mid_name: student.guardian_mid_name || '',
        guardian_last_name: student.guardian_last_name || '',
        guardian_contact: student.guardian_contact || '',
        guardian_relationship: student.guardian_relationship || '',
        // Enrollment fields from merged data
        grade_level_id: student.enrollment?.grade_level_id ? String(student.enrollment.grade_level_id) : '',
        section_id: student.enrollment?.section_id ? String(student.enrollment.section_id) : '',
        school_year_id: student.enrollment?.school_year_id ? String(student.enrollment.school_year_id) : '',
        enrollment_date: student.enrollment?.enrollment_date || '',
      };
    }
    return { ...emptyForm };
  };

  const [formData, setFormData] = useState(buildFormData);

  useEffect(() => {
    if (isOpen) setFormData(buildFormData());
  }, [isOpen, student]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return {
    isEdit,
    formData,
    handleChange,
    handleSubmit,
  };
}
