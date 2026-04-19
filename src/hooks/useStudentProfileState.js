import { useState, useEffect } from 'react';
import { studentApi, enrollmentApi, gradeLevelApi, sectionApi, schoolYearApi } from '../services/api.js';
import PrintStudentProfile from '../components/modules/students/PrintStudentProfile';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'pace', label: 'PACE Progress' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'risk', label: 'Risk Details' },
];

export default function useStudentProfileState(studentId) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For the edit modal dropdowns
  const [gradeLevels, setGradeLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);

  useEffect(() => {
    if (!studentId) return;
    setActiveTab('overview');
    setShowEditModal(false);
    setLoading(true);
    setError(null);

    const fetchStudent = async () => {
      try {
        const [student, enrollments, gradeLevelsRes, sectionsRes, schoolYearsRes] = await Promise.all([
          studentApi.get(studentId),
          enrollmentApi.list({ student_id: studentId }),
          gradeLevelApi.list(),
          sectionApi.list(),
          schoolYearApi.list(),
        ]);

        setGradeLevels(gradeLevelsRes);
        setSections(sectionsRes);
        setSchoolYears(schoolYearsRes);

        const active = enrollments.find(e => e.is_active) || enrollments[0] || null;
        const gradeLevel = active ? gradeLevelsRes.find(gl => gl.grade_level_id === active.grade_level_id) : null;
        const section = active ? sectionsRes.find(s => s.section_id === active.section_id) : null;
        const schoolYear = active ? schoolYearsRes.find(sy => sy.school_year_id === active.school_year_id) : null;

        setStudentData({
          ...student,
          enrollment: active,
          gradeLevelDisplay: gradeLevel?.level || '—',
          sectionDisplay: section?.name || '—',
          schoolYearDisplay: schoolYear?.year || '—',
          isActive: active?.is_active ?? false,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  const handleSaveEdit = async (formData) => {
    try {
      // Update student fields
      await studentApi.update(studentData.student_id, {
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        gender: formData.gender,
        address: formData.address,
        guardian_first_name: formData.guardian_first_name,
        guardian_mid_name: formData.guardian_mid_name || null,
        guardian_last_name: formData.guardian_last_name,
        guardian_contact: formData.guardian_contact,
        guardian_relationship: formData.guardian_relationship,
      });

      // Update enrollment fields if enrollment exists and fields changed
      if (studentData.enrollment && (formData.grade_level_id || formData.section_id || formData.school_year_id)) {
        const enrollmentPayload = {};
        if (formData.grade_level_id) enrollmentPayload.grade_level_id = Number(formData.grade_level_id);
        if (formData.section_id) enrollmentPayload.section_id = Number(formData.section_id);
        if (formData.school_year_id) enrollmentPayload.school_year_id = Number(formData.school_year_id);
        await enrollmentApi.update(studentData.enrollment.enrollment_id, enrollmentPayload);
      }

      // Re-fetch updated student data
      const [updated, enrollments] = await Promise.all([
        studentApi.get(studentData.student_id),
        enrollmentApi.list({ student_id: studentData.student_id }),
      ]);
      const active = enrollments.find(e => e.is_active) || enrollments[0] || null;
      const gradeLevel = active ? gradeLevels.find(gl => gl.grade_level_id === active.grade_level_id) : null;
      const section = active ? sections.find(s => s.section_id === active.section_id) : null;
      const schoolYear = active ? schoolYears.find(sy => sy.school_year_id === active.school_year_id) : null;

      setStudentData({
        ...updated,
        enrollment: active,
        gradeLevelDisplay: gradeLevel?.level || '—',
        sectionDisplay: section?.name || '—',
        schoolYearDisplay: schoolYear?.year || '—',
        isActive: active?.is_active ?? false,
      });
      setShowEditModal(false);
    } catch (err) {
      alert(`Failed to update student: ${err.message}`);
    }
  };

  const getFullName = (student) => {
    const mid = student?.middle_name ? ` ${student.middle_name.charAt(0)}.` : '';
    return `${student?.last_name}, ${student?.first_name}${mid}`;
  };

  const getGuardianFullName = (student) => {
    const mid = student?.guardian_mid_name ? ` ${student.guardian_mid_name.charAt(0)}.` : '';
    return `${student?.guardian_last_name}, ${student?.guardian_first_name}${mid}`;
  };

  const handlePrint = () => {
    if (!studentData) return;
    const printWindow = window.open('', '_blank');
    const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const printContent = PrintStudentProfile(studentData, getFullName, getGuardianFullName, printDate);
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return {
    TABS,
    activeTab,
    setActiveTab,
    showEditModal,
    setShowEditModal,
    student: studentData,
    loading,
    error,
    gradeLevels,
    sections,
    schoolYears,
    handleSaveEdit,
    handlePrint,
  };
}
