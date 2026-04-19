import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, CalendarDays, Layers, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, CheckCircle, Clock, Group, AlertCircle, RefreshCw,
} from 'lucide-react';
import SchoolYearModal from './SchoolYearModal.jsx';
import GradeLevelModal from './GradeLevelModal.jsx';
import SectionModal from './SectionModal.jsx';
import { gradeLevelApi, schoolYearApi, sectionApi } from '../../../services/api.js';
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

  useEffect(() => {
    fetchSchoolYears();
    fetchGradeLevels();
    fetchSections();
  }, [fetchSchoolYears, fetchGradeLevels, fetchSections]);

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

  const openAddSection = (gradeId) => {
    setPrefillGrade(gradeId); setEditingSec(null); setSecModalOpen(true);
    setExpandedGrades(prev => ({ ...prev, [gradeId]: true }));
  };

  const current = schoolYears.find(sy => sy.is_current);

  return (
    <div className="setup-page unified-setup">
      <div className="setup-header-row">
        <div className="setup-header-title">
          <div className="setup-title-wrapper">
            <BookOpen size={24} />
            <h2>Class Management</h2>
          </div>
          <p className="setup-header-subtitle">Configure school years, grade levels, and sections</p>
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
                          <button className="setup-action-btn edit" onClick={() => { setEditingSY(sy); setSyModalOpen(true); }} title="Edit"><Pencil size={14} /></button>
                          <button className="setup-action-btn delete" onClick={() => handleDeleteSY(sy.school_year_id)} title="Delete" disabled={sy.is_current}><Trash2 size={14} /></button>
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
                      <button className="us-inline-add-btn" onClick={() => openAddSection(gl.grade_level_id)} title="Add section"><Plus size={13} /> Section</button>
                      <button className="setup-action-btn edit" onClick={() => { setEditingGL(gl); setGlModalOpen(true); }} title="Edit grade"><Pencil size={13} /></button>
                      <button className="setup-action-btn delete" onClick={() => handleDeleteGL(gl.grade_level_id)} title="Delete grade"><Trash2 size={13} /></button>
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
                                    <button className="setup-action-btn edit" onClick={() => { setEditingSec(sec); setPrefillGrade(null); setSecModalOpen(true); }} title="Edit"><Pencil size={13} /></button>
                                    <button className="setup-action-btn delete" onClick={() => handleDeleteSec(sec.section_id)} title="Delete"><Trash2 size={13} /></button>
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
