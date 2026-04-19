import { useState, useEffect, useCallback } from 'react';
import { studentApi, enrollmentApi, gradeLevelApi, sectionApi, schoolYearApi } from '../services/api.js';

export default function useStudentsPageState(teacher = null) {
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    schoolYear: 'All',
    gradeLevel: 'All',
    section: 'All',
    status: 'All',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, enrollmentsRes, gradeLevelsRes, sectionsRes, schoolYearsRes] = await Promise.all([
        studentApi.list(),
        enrollmentApi.list(),
        gradeLevelApi.list(),
        sectionApi.list(),
        schoolYearApi.list(),
      ]);
      setStudents(studentsRes);
      setEnrollments(enrollmentsRes);
      setGradeLevels(gradeLevelsRes);
      setSections(sectionsRes);
      setSchoolYears(schoolYearsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Set default school year filter to current school year once loaded
  useEffect(() => {
    if (schoolYears.length > 0 && filters.schoolYear === 'All') {
      const current = schoolYears.find(sy => sy.is_current);
      if (current) {
        setFilters(prev => ({ ...prev, schoolYear: String(current.school_year_id) }));
      }
    }
  }, [schoolYears]);

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  // Build a map of student_id -> enrollment(s) for quick lookup
  const enrollmentsByStudent = enrollments.reduce((acc, e) => {
    if (!acc[e.student_id]) acc[e.student_id] = [];
    acc[e.student_id].push(e);
    return acc;
  }, {});

  // Merge student data with their most recent enrollment
  const studentsWithEnrollment = students.map(student => {
    const studentEnrollments = enrollmentsByStudent[student.student_id] || [];
    // Prefer active enrollment, fallback to most recent
    const active = studentEnrollments.find(e => e.is_active) || studentEnrollments[0] || null;

    const gradeLevel = active
      ? gradeLevels.find(gl => gl.grade_level_id === active.grade_level_id)
      : null;
    const section = active
      ? sections.find(s => s.section_id === active.section_id)
      : null;
    const schoolYear = active
      ? schoolYears.find(sy => sy.school_year_id === active.school_year_id)
      : null;

    return {
      ...student,
      enrollment: active,
      gradeLevelDisplay: gradeLevel?.level || '—',
      gradeLevelId: active?.grade_level_id || null,
      sectionDisplay: section?.name || '—',
      sectionId: active?.section_id || null,
      schoolYearId: active?.school_year_id || null,
      schoolYearDisplay: schoolYear?.year || '—',
      isActive: active?.is_active ?? false,
    };
  });

  const getFilteredStudents = () => {
    let filtered = studentsWithEnrollment;

    // Teacher scope filter
    if (teacher) {
      filtered = filtered.filter(student => {
        const gradeMatch = teacher.assignedGrades?.includes(student.gradeLevelDisplay);
        const sectionMatch = teacher.assignedSections?.includes(student.sectionDisplay);
        return gradeMatch || sectionMatch;
      });
    }

    return filtered.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(student.student_id).includes(searchTerm);

      const matchesYear =
        filters.schoolYear === 'All' ||
        String(student.schoolYearId) === filters.schoolYear;

      const matchesGrade =
        filters.gradeLevel === 'All' ||
        String(student.gradeLevelId) === filters.gradeLevel;

      const matchesSection =
        filters.section === 'All' ||
        String(student.sectionId) === filters.section;

      // Status based on enrollment active flag
      const studentStatus = student.isActive ? 'Active' : 'Inactive';
      const matchesStatus =
        filters.status === 'All' || studentStatus === filters.status;

      return matchesSearch && matchesYear && matchesGrade && matchesSection && matchesStatus;
    });
  };

  const filteredStudents = getFilteredStudents();

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'status-badge on-track' : 'status-badge at-risk';
  };

  const handleAddStudent = async (formData) => {
    try {
      // Build the with-student payload matching StudentEnrollmentWithStudentCreate schema
      const payload = {
        // Student fields
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
        // Enrollment fields
        grade_level_id: Number(formData.grade_level_id),
        section_id: Number(formData.section_id),
        school_year_id: Number(formData.school_year_id),
        enrollment_date: formData.enrollment_date || null,
        is_active: true,
      };
      const result = await enrollmentApi.createWithStudent(payload);
      // Show the auto-generated login credentials
      if (result.student_login_id) {
        alert(
          `Student created successfully!\n\nLogin ID: ${result.student_login_id}\nDefault Password: ${result.student_login_password}\n\nPlease share these credentials with the student.`
        );
      }
      await fetchAll();
      return result;
    } catch (err) {
      alert(`Failed to add student: ${err.message}`);
      throw err;
    }
  };

  return {
    students: studentsWithEnrollment,
    filteredStudents,
    enrollments,
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
    refetch: fetchAll,
  };
}
