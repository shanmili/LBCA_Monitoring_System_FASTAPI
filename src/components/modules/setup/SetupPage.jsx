import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, CalendarDays, Layers, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, CheckCircle, Clock, Group, AlertCircle, RefreshCw,
  Calendar, MapPin, Save, X as XIcon
} from 'lucide-react';
import SchoolYearModal from './SchoolYearModal.jsx';
import GradeLevelModal from './GradeLevelModal.jsx';
import SectionModal from './SectionModal.jsx';
import SubjectTable from './SubjectTable.jsx';
import { gradeLevelApi, schoolYearApi, sectionApi, staffApi, subjectApi, classScheduleApi } from '../../../services/api.js';
import '../../../styles/setup/SetupPage.css';
import '../../../styles/setup/UnifiedSetup.css';

const ErrorBanner = ({ message, onRetry }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', marginBottom: 12,
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
    color: '#b91c1c', fontSize: 13,
  }}>
    <AlertCircle size={15} />
    <span style={{ flex: 1 }}>{message}</span>
    {onRetry && (
      <button onClick={onRetry} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'none', border: '1px solid #f87171', borderRadius: 4,
        padding: '2px 8px', color: '#b91c1c', cursor: 'pointer', fontSize: 12,
      }}>
        <RefreshCw size={12} /> Retry
      </button>
    )}
  </div>
);

// Schedule Row Component for each subject
const ScheduleRow = ({ subject, schedules, onSave, onDelete, teachers, days, saving, schoolYearId, sectionId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
    room: '',
    teacher_id: '',
  });

  const timeSlots = [];
  for (let hour = 7; hour <= 17; hour++) {
    for (let minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      timeSlots.push(time);
    }
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room,
      teacher_id: schedule.teacher_id,
    });
    setShowAddForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.room.trim()) {
      alert('Please enter a room');
      return;
    }
    if (!formData.teacher_id) {
      alert('Please select a teacher');
      return;
    }
    if (formData.end_time <= formData.start_time) {
      alert('End time must be after start time');
      return;
    }

    await onSave({
      schedule_id: editingSchedule?.class_schedule_id || null,
      subject_id: subject.subject_id,
      section_id: sectionId,
      school_year_id: schoolYearId,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      room: formData.room,
      teacher_id: formData.teacher_id,
    });

    setShowAddForm(false);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 'Monday',
      start_time: '08:00',
      end_time: '09:00',
      room: '',
      teacher_id: '',
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSchedule(null);
    setFormData({
      day_of_week: 'Monday',
      start_time: '08:00',
      end_time: '09:00',
      room: '',
      teacher_id: '',
    });
  };

  return (
    <div className="schedule-subject-row" style={{
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '8px'
    }}>
      {/* Subject Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <span style={{ fontWeight: 600, color: '#1f2937' }}>{subject.subject_name}</span>
          <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>({subject.subject_code})</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={saving}
          style={{
            padding: '4px 12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
        >
          <Plus size={14} /> Add Schedule
        </button>
      </div>

      {/* Existing Schedules */}
      {schedules.map(schedule => (
        <div key={schedule.class_schedule_id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          paddingLeft: '32px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#e0e7ff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 500 }}>
              {schedule.day_of_week}
            </span>
            <span style={{ fontSize: '13px' }}>{schedule.start_time} - {schedule.end_time}</span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Room: {schedule.room}</span>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Teacher: {schedule.teacher_name || 'Unknown'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleEdit(schedule)}
              disabled={saving}
              style={{
                padding: '4px 8px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDelete(schedule.class_schedule_id)}
              disabled={saving}
              style={{
                padding: '4px 8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          padding: '16px',
          paddingLeft: '32px',
          backgroundColor: '#fef3c7',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: '100px' }}
            >
              {days.map(day => <option key={day} value={day}>{day}</option>)}
            </select>

            <select
              value={formData.start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: '80px' }}
            >
              {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
            </select>

            <span>to</span>

            <select
              value={formData.end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: '80px' }}
            >
              {timeSlots.map(time => {
                if (time > formData.start_time) {
                  return <option key={time} value={time}>{time}</option>;
                }
                return null;
              }).filter(Boolean)}
            </select>

            <input
              type="text"
              placeholder="Room"
              value={formData.room}
              onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100px' }}
            />

            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: '150px' }}
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name}</option>
              ))}
            </select>

            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '6px 12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Save size={14} /> {editingSchedule ? 'Update' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '6px 12px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SetupPage = () => {
  const [schoolYears, setSchoolYears] = useState([]);
  const [syLoading, setSyLoading] = useState(true);
  const [syError, setSyError] = useState(null);
  const [syModalOpen, setSyModalOpen] = useState(false);
  const [editingSY, setEditingSY] = useState(null);
  const [syExpanded, setSyExpanded] = useState(true);

  const [gradeLevels, setGradeLevels] = useState([]);
  const [glLoading, setGlLoading] = useState(true);
  const [glError, setGlError] = useState(null);
  const [glModalOpen, setGlModalOpen] = useState(false);
  const [editingGL, setEditingGL] = useState(null);
  const [glExpanded, setGlExpanded] = useState(true);
  const [expandedGrades, setExpandedGrades] = useState({});

  const [sections, setSections] = useState([]);
  const [secLoading, setSecLoading] = useState(true);
  const [secError, setSecError] = useState(null);
  const [secModalOpen, setSecModalOpen] = useState(false);
  const [editingSec, setEditingSec] = useState(null);
  const [prefillGrade, setPrefillGrade] = useState(null);

  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Schedule Matrix State
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState(null);
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [subjectSchedules, setSubjectSchedules] = useState({});

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const fetchSchoolYears = useCallback(async () => {
    setSyLoading(true); setSyError(null);
    try { setSchoolYears(await schoolYearApi.list()); }
    catch (err) { setSyError(err.message); }
    finally { setSyLoading(false); }
  }, []);

  const fetchGradeLevels = useCallback(async () => {
    setGlLoading(true); setGlError(null);
    try { setGradeLevels(await gradeLevelApi.list()); }
    catch (err) { setGlError(err.message); }
    finally { setGlLoading(false); }
  }, []);

  const fetchSections = useCallback(async () => {
    setSecLoading(true); setSecError(null);
    try { setSections(await sectionApi.list()); }
    catch (err) { setSecError(err.message); }
    finally { setSecLoading(false); }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      const allStaff = await staffApi.list();
      // Filter only teachers with role 'teacher' and active
      const teacherList = allStaff.filter(s => s.role === 'teacher');
      console.log('Teachers loaded:', teacherList);
      setTeachers(teacherList);
    } catch (err) { 
      console.error('Failed to load teachers:', err);
      setTeachers([]);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try { 
      const data = await subjectApi.list();
      setSubjects(data);
    } catch (err) { 
      console.error('Failed to load subjects:', err);
      setSubjects([]);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    setScheduleLoading(true); setScheduleError(null);
    try {
      const data = await classScheduleApi.list();
      setSchedules(data);
      
      // Group schedules by subject
      const grouped = {};
      data.forEach(schedule => {
        if (!grouped[schedule.subject_id]) grouped[schedule.subject_id] = [];
        grouped[schedule.subject_id].push(schedule);
      });
      setSubjectSchedules(grouped);
    } catch (err) { 
      setScheduleError(err.message); 
      setSchedules([]);
    }
    finally { setScheduleLoading(false); }
  }, []);

  useEffect(() => {
    fetchSchoolYears();
    fetchGradeLevels();
    fetchSections();
    fetchTeachers();
    fetchSubjects();
  }, [fetchSchoolYears, fetchGradeLevels, fetchSections, fetchTeachers, fetchSubjects]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Filter subjects when grade/section changes
  useEffect(() => {
    if (selectedSectionId) {
      const section = sections.find(s => s.section_id === parseInt(selectedSectionId));
      if (section) {
        const gradeSubjects = subjects.filter(s => s.grade_level_id === section.grade_level);
        setFilteredSubjects(gradeSubjects);
      } else {
        setFilteredSubjects([]);
      }
    } else if (selectedGradeId) {
      const gradeSubjects = subjects.filter(s => s.grade_level_id === parseInt(selectedGradeId));
      setFilteredSubjects(gradeSubjects);
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedGradeId, selectedSectionId, subjects, sections]);

  const handleSaveSY = async (data) => {
    setSaving(true);
    try {
      if (editingSY) await schoolYearApi.update(editingSY.school_year_id, data);
      else await schoolYearApi.create(data);
      setSyModalOpen(false); setEditingSY(null);
      await fetchSchoolYears();
    } catch (err) { alert(`Failed to save school year: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDeleteSY = async (id) => {
    const target = schoolYears.find(sy => sy.school_year_id === id);
    if (target?.is_current) { alert('Cannot delete the currently active school year.'); return; }
    if (!window.confirm('Delete this school year?')) return;
    try { await schoolYearApi.delete(id); await fetchSchoolYears(); }
    catch (err) { alert(`Failed to delete: ${err.message}`); }
  };

  const handleSaveGL = async (data) => {
    setSaving(true);
    try {
      if (editingGL) await gradeLevelApi.update(editingGL.grade_level_id, data);
      else await gradeLevelApi.create(data);
      setGlModalOpen(false); setEditingGL(null);
      await fetchGradeLevels();
    } catch (err) { alert(`Failed to save grade level: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDeleteGL = async (id) => {
    if (sections.some(s => s.grade_level === id)) {
      alert('Cannot delete a grade level that has sections. Remove its sections first.');
      return;
    }
    if (!window.confirm('Delete this grade level?')) return;
    try { await gradeLevelApi.delete(id); await fetchGradeLevels(); }
    catch (err) { alert(`Failed to delete: ${err.message}`); }
  };

  const toggleGrade = (id) => setExpandedGrades(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSaveSec = async (data) => {
    setSaving(true);
    const payload = { grade_level: Number(data.grade_level), section_code: data.section_code, name: data.name };
    try {
      if (editingSec) await sectionApi.update(editingSec.section_id, payload);
      else await sectionApi.create(payload);
      setSecModalOpen(false); setEditingSec(null); setPrefillGrade(null);
      await fetchSections();
    } catch (err) { alert(`Failed to save section: ${err.message}`); }
    finally { setSaving(false); }
  };

  const handleDeleteSec = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try { await sectionApi.delete(id); await fetchSections(); }
    catch (err) { alert(`Failed to delete: ${err.message}`); }
  };

  // Schedule Handlers
  const handleSaveSchedule = async (data) => {
    setSaving(true);
    try {
      if (data.schedule_id) {
        // Update existing schedule
        await classScheduleApi.update(data.schedule_id, {
          school_year_id: data.school_year_id,
          section_id: data.section_id,
          subject_id: data.subject_id,
          teacher_id: data.teacher_id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          room: data.room,
        });
      } else {
        // Create new schedule
        await classScheduleApi.create({
          school_year_id: data.school_year_id,
          section_id: data.section_id,
          subject_id: data.subject_id,
          teacher_id: data.teacher_id,
          day_of_week: data.day_of_week,
          start_time: data.start_time,
          end_time: data.end_time,
          room: data.room,
        });
      }
      await fetchSchedules();
    } catch (err) {
      alert(`Failed to save schedule: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await classScheduleApi.delete(scheduleId);
      await fetchSchedules();
    } catch (err) {
      alert(`Failed to delete schedule: ${err.message}`);
    }
  };

  const openAddSection = (gradeId) => {
    setPrefillGrade(gradeId); setEditingSec(null); setSecModalOpen(true);
    setExpandedGrades(prev => ({ ...prev, [gradeId]: true }));
  };

  const current = schoolYears.find(sy => sy.is_current);
  const currentSchoolYearId = current?.school_year_id || (schoolYears[0]?.school_year_id);

  const availableSections = selectedGradeId 
    ? sections.filter(s => s.grade_level === parseInt(selectedGradeId))
    : sections;

  const handleGradeChange = (gradeId) => {
    setSelectedGradeId(gradeId);
    setSelectedSectionId('');
  };

  return (
    <div className="setup-page unified-setup">
      <div className="setup-header-row">
        <div className="setup-header-title">
          <div className="setup-title-wrapper">
            <BookOpen size={24} />
            <h2>Class Management</h2>
          </div>
          <p className="setup-header-subtitle">Configure school years, grade levels, sections, subjects, and class schedules</p>
        </div>
      </div>

      {/* SCHOOL YEARS */}
      <div className="us-card">
        <div className="us-card-header" onClick={() => setSyExpanded(v => !v)}>
          <div className="us-card-title">
            <CalendarDays size={18} />
            <span>School Years</span>
            {!syLoading && <span className="us-count-badge">{schoolYears.length}</span>}
          </div>
          <div className="us-card-actions" onClick={e => e.stopPropagation()}>
            <button className="setup-add-btn us-add-btn" onClick={() => { setEditingSY(null); setSyModalOpen(true); }}>
              <Plus size={14} /> Add
            </button>
            <button className="us-chevron-btn">
              {syExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {syExpanded && (
          <div className="us-card-body">
            {syError && <ErrorBanner message={syError} onRetry={fetchSchoolYears} />}
            {current && (
              <div className="setup-current-banner us-banner">
                <CheckCircle size={14} />
                <span>Active: <strong>{current.year}</strong> &nbsp;({current.start_date} – {current.end_date})</span>
              </div>
            )}
            <div className="setup-table-card us-table-card">
              <table className="setup-table">
                <thead><tr><th>Year</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {syLoading ? (
                    <tr><td colSpan={5} className="setup-empty">Loading school years…</td></tr>
                  ) : schoolYears.length === 0 ? (
                    <tr><td colSpan={5} className="setup-empty">No school years yet. Add one above.</td></tr>
                  ) : schoolYears.map(sy => (
                    <tr key={sy.school_year_id}>
                      <td className="setup-td-bold">{sy.year}</td>
                      <td>{sy.start_date}</td>
                      <td>{sy.end_date}</td>
                      <td>
                        {sy.is_current
                          ? <span className="setup-badge setup-badge-active"><CheckCircle size={11} /> Current</span>
                          : <span className="setup-badge setup-badge-inactive"><Clock size={11} /> Past</span>}
                      </td>
                      <td>
                        <div className="setup-actions">
                          <button className="setup-action-btn edit" onClick={() => { setEditingSY(sy); setSyModalOpen(true); }}><Pencil size={14} /></button>
                          <button className="setup-action-btn delete" onClick={() => handleDeleteSY(sy.school_year_id)} disabled={sy.is_current}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* GRADE LEVELS + SECTIONS */}
      <div className="us-card">
        <div className="us-card-header" onClick={() => setGlExpanded(v => !v)}>
          <div className="us-card-title">
            <Layers size={18} />
            <span>Grade Levels & Sections</span>
            {!glLoading && !secLoading && (
              <span className="us-count-badge">{gradeLevels.length} grades · {sections.length} sections</span>
            )}
          </div>
          <div className="us-card-actions" onClick={e => e.stopPropagation()}>
            <button className="setup-add-btn us-add-btn" onClick={() => { setEditingGL(null); setGlModalOpen(true); }}>
              <Plus size={14} /> Add Grade
            </button>
            <button className="us-chevron-btn">
              {glExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {glExpanded && (
          <div className="us-card-body">
            {glError && <ErrorBanner message={glError} onRetry={fetchGradeLevels} />}
            {secError && <ErrorBanner message={secError} onRetry={fetchSections} />}
            {glLoading ? (
              <p className="us-empty-hint">Loading grade levels…</p>
            ) : gradeLevels.length === 0 ? (
              <p className="us-empty-hint">No grade levels yet. Add one above.</p>
            ) : gradeLevels.map(gl => {
              const glSections = sections.filter(s => s.grade_level === gl.grade_level_id);
              const isOpen = !!expandedGrades[gl.grade_level_id];
              return (
                <div key={gl.grade_level_id} className="us-grade-block">
                  <div className="us-grade-row" onClick={() => toggleGrade(gl.grade_level_id)}>
                    <div className="us-grade-left">
                      <span className="us-grade-chevron">{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                      <Layers size={15} className="us-grade-icon" />
                      <span className="us-grade-name">{gl.level}</span>
                      <span className="us-grade-subname">{gl.name}</span>
                      <span className="us-section-count">
                        {secLoading ? '…' : `${glSections.length} section${glSections.length !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="us-grade-right" onClick={e => e.stopPropagation()}>
                      <button className="us-inline-add-btn" onClick={() => openAddSection(gl.grade_level_id)}><Plus size={13} /> Section</button>
                      <button className="setup-action-btn edit" onClick={() => { setEditingGL(gl); setGlModalOpen(true); }}><Pencil size={13} /></button>
                      <button className="setup-action-btn delete" onClick={() => handleDeleteGL(gl.grade_level_id)}><Trash2 size={13} /></button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="us-sections-panel">
                      {secLoading ? (
                        <div className="us-sections-empty"><span>Loading sections…</span></div>
                      ) : glSections.length === 0 ? (
                        <div className="us-sections-empty">
                          <Group size={14} /><span>No sections yet.</span>
                          <button className="us-inline-add-btn" onClick={() => openAddSection(gl.grade_level_id)}><Plus size={12} /> Add Section</button>
                        </div>
                      ) : (
                        <table className="setup-table us-sections-table">
                          <thead><tr><th>Code</th><th>Section Name</th><th>Actions</th></tr></thead>
                          <tbody>
                            {glSections.map(sec => (
                              <tr key={sec.section_id}>
                                <td className="setup-td-bold">{sec.section_code}</td>
                                <td>{sec.name}</td>
                                <td>
                                  <div className="setup-actions">
                                    <button className="setup-action-btn edit" onClick={() => { setEditingSec(sec); setPrefillGrade(null); setSecModalOpen(true); }}><Pencil size={13} /></button>
                                    <button className="setup-action-btn delete" onClick={() => handleDeleteSec(sec.section_id)}><Trash2 size={13} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SUBJECTS */}
      <SubjectTable />

      {/* CLASS SCHEDULES - MATRIX VIEW */}
      <div className="us-card">
        <div className="us-card-header" onClick={() => setScheduleExpanded(v => !v)}>
          <div className="us-card-title">
            <Calendar size={18} />
            <span>Class Schedules</span>
            <span className="us-count-badge">Schedule Matrix</span>
          </div>
          <div className="us-card-actions" onClick={e => e.stopPropagation()}>
            <button className="us-chevron-btn">
              {scheduleExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>

        {scheduleExpanded && (
          <div className="us-card-body">
            {/* Filters */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: '#6b7280' }}>Grade Level</label>
                <select 
                  value={selectedGradeId} 
                  onChange={(e) => handleGradeChange(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                >
                  <option value="">-- Select Grade Level --</option>
                  {gradeLevels.map(gl => (
                    <option key={gl.grade_level_id} value={gl.grade_level_id}>{gl.level} - {gl.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: '#6b7280' }}>Section</label>
                <select 
                  value={selectedSectionId} 
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                  disabled={!selectedGradeId}
                >
                  <option value="">-- Select Section --</option>
                  {availableSections.map(section => (
                    <option key={section.section_id} value={section.section_id}>{section.section_code} - {section.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule Matrix Table */}
            {selectedSectionId && currentSchoolYearId && (
              <>
                {scheduleLoading ? (
                  <p className="us-empty-hint">Loading schedules…</p>
                ) : filteredSubjects.length === 0 ? (
                  <p className="us-empty-hint">No subjects found for this grade level. Please add subjects first.</p>
                ) : (
                  <div style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#f3f4f6',
                      padding: '12px 16px',
                      fontWeight: 600,
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Subjects
                    </div>
                    
                    {/* Rows */}
                    {filteredSubjects.map(subject => {
                      const subjectScheds = subjectSchedules[subject.subject_id] || [];
                      const sectionSchedules = subjectScheds.filter(s => s.section_id === parseInt(selectedSectionId));
                      
                      return (
                        <ScheduleRow
                          key={subject.subject_id}
                          subject={subject}
                          schedules={sectionSchedules}
                          onSave={handleSaveSchedule}
                          onDelete={handleDeleteSchedule}
                          teachers={teachers}
                          days={DAYS}
                          saving={saving}
                          schoolYearId={currentSchoolYearId}
                          sectionId={parseInt(selectedSectionId)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
            
            {!selectedGradeId && (
              <p className="us-empty-hint">Select a grade level and section to configure schedules</p>
            )}
            {selectedGradeId && !selectedSectionId && (
              <p className="us-empty-hint">Select a section to configure schedules</p>
            )}
            {!currentSchoolYearId && (
              <p className="us-empty-hint">Please add a school year first</p>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <SchoolYearModal
        isOpen={syModalOpen}
        onClose={() => { setSyModalOpen(false); setEditingSY(null); }}
        onSave={handleSaveSY}
        editingItem={editingSY}
        saving={saving}
      />
      <GradeLevelModal
        isOpen={glModalOpen}
        onClose={() => { setGlModalOpen(false); setEditingGL(null); }}
        onSave={handleSaveGL}
        editingItem={editingGL}
        saving={saving}
      />
      <SectionModal
        isOpen={secModalOpen}
        onClose={() => { setSecModalOpen(false); setEditingSec(null); setPrefillGrade(null); }}
        onSave={handleSaveSec}
        editingItem={editingSec}
        gradeLevels={gradeLevels}
        prefillGradeId={prefillGrade}
        saving={saving}
      />
    </div>
  );
};

export default SetupPage;