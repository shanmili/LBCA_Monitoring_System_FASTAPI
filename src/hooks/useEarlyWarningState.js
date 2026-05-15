// ============================================================
// useEarlyWarningState.js
// AI-integrated early warning hook. Attendance removed.
// Uses PACE data + AI risk predictions to build warning list.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  studentApi,
  earlyWarningApi,
  sectionApi,
  schoolYearApi,
  paceApi,
  enrollmentApi,
  aiApi,
  toAiStudentInput,
} from '../services/api';

// ── helpers ──────────────────────────────────────────────────

function mergeStudentData(backendStudents, warnings, aiPredictions, paceRecords, enrollments, sections) {
  const aiMap = {};
  aiPredictions.forEach((p) => { aiMap[String(p.student_id)] = p; });

  const warnMap = {};
  warnings.forEach((w) => {
    const sid = String(w.student_id);
    if (!warnMap[sid]) warnMap[sid] = [];
    warnMap[sid].push(w);
  });

  // Map enrollment_id → section name
  const sectionMap = {};
  sections.forEach((s) => { sectionMap[s.section_id] = s.name; });

  const enrollMap = {};
  enrollments.forEach((enr) => {
    if (enr.is_active) enrollMap[String(enr.student_id)] = enr;
  });

  return backendStudents.map((s) => {
    const id = String(s.student_id || s.id);
    const ai = aiMap[id];
    const studentWarnings = warnMap[id] || [];
    const enr = enrollMap[id];
    const studentPaces = paceRecords.filter((p) => String(p.student_id) === id);

    // Pace percent from actual records
    const pacePercent = studentPaces.length > 0
      ? Math.round(
          studentPaces.reduce((sum, p) => sum + (p.pace_percent ?? 0), 0) /
          studentPaces.length
        )
      : 0;

    // Risk level: AI first (most accurate), then compute fresh from current pace.
    // Stored DB warnings are intentionally skipped — they go stale.
    let riskLevel = pacePercent < 70 ? 'High' : pacePercent < 85 ? 'Medium' : 'Low';
    if (ai?.risk_level) {
      riskLevel = ai.risk_level.charAt(0).toUpperCase() + ai.risk_level.slice(1).toLowerCase();
    }

    // Primary factor: AI first, then derive from pace — always show something
    const factor =
      ai?.risk_factors?.[0] ||
      studentWarnings[0]?.notes ||
      (pacePercent < 70
        ? 'Low PACE completion'
        : pacePercent < 85
        ? 'Below average PACE completion'
        : pacePercent < 100
        ? 'On track — minor gaps'
        : 'Excellent PACE completion');

    // AI early warnings for detail view
    const earlyWarnings = ai?.early_warnings || [];

    // Suggested action from AI
    const suggestedAction =
      earlyWarnings[0]?.message ||
      studentWarnings[0]?.suggested_action ||
      (riskLevel === 'High'
        ? 'Immediate intervention required'
        : riskLevel === 'Medium'
        ? 'Monitor PACE progress closely'
        : 'No action needed');

    const sectionName = enr ? sectionMap[enr.section_id] || '—' : '—';

    return {
      id,
      firstName: s.first_name || '',
      lastName: s.last_name || '',
      middleName: s.middle_name || '',
      student_id: s.student_id,
      section: sectionName,
      gradeLevel: s.gradeLevel || '',
      pacePercent,
      riskLevel,
      riskProbability: (() => {
        if (!ai) return pacePercent < 70 ? 85 : pacePercent < 85 ? 50 : 10;
        const raw = ai.risk_probability ?? ai.probability ?? ai.risk_score ?? null;
        if (raw == null) return pacePercent < 70 ? 85 : pacePercent < 85 ? 50 : 10;
        // AI may return 0-1 decimal or 0-100 integer
        return raw > 1 ? Math.round(raw) : Math.round(raw * 100);
      })(),
      factor,
      suggestedAction,
      earlyWarnings,
      storedWarnings: studentWarnings,
      aiConfidence: ai?.confidence ?? null,
    };
  });
}

// ── hook ─────────────────────────────────────────────────────

export default function useEarlyWarningState(teacher = null) {
  const [filters, setFilters] = useState({
    schoolYear: '',
    risk: 'All',
    section: 'All',
  });

  const [students, setStudents]       = useState([]);
  const [warnings, setWarnings]       = useState([]);
  const [paceRecords, setPaceRecords] = useState([]);
  const [sections, setSections]       = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);

  const [loading, setLoading]     = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]         = useState(null);

  // ── load backend data ────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [studs, warns, paces, secs, years, enrs] = await Promise.all([
          studentApi.list(),
          earlyWarningApi.list(),
          paceApi.list(),
          sectionApi.list(),
          schoolYearApi.list(),
          enrollmentApi.list(),
        ]);
        if (!mounted) return;
        setStudents(studs);
        setWarnings(warns);
        setPaceRecords(paces);
        setSections(secs);
        setSchoolYears(years);
        setEnrollments(enrs);

        const currentYear = years.find((y) => y.is_current) || years[0];
        if (currentYear) {
          setFilters((f) => ({ ...f, schoolYear: currentYear.year || '' }));
        }
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // ── AI risk predictions ──────────────────────────────────
  const runAi = useCallback(async () => {
    if (!students.length) return;
    setAiLoading(true);
    try {
      const aiInputs = students.map((s) => {
        const sp = paceRecords.filter(
          (p) => String(p.student_id) === String(s.student_id || s.id)
        );
        return toAiStudentInput(s, sp);
      });

      // Render free tier hibernates — ping health to wake it, then retry up to 3x
      try { await aiApi.health(); } catch (_) { /* ignore wake-up errors */ }

      let result = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[AI] attempt ${attempt} — sending ${aiInputs.length} students`);
          result = await aiApi.predictCohortRisk(aiInputs);
          if (result?.predictions?.[0]) {
            console.log('[AI] first prediction fields:', Object.keys(result.predictions[0]));
            console.log('[AI] first prediction:', JSON.stringify(result.predictions[0]));
          }
          if (result?.predictions?.length) break;
        } catch (e) {
          console.warn(`[AI] attempt ${attempt} failed:`, e.message);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 5000));
        }
      }
      console.log('[AI] final predictions count:', result?.predictions?.length ?? 0);
      if (result?.predictions?.length) {
        setAiPredictions(result.predictions);
      }
    } catch (e) {
      console.warn('AI prediction failed (early warning):', e.message);
    } finally {
      setAiLoading(false);
    }
  }, [students, paceRecords]);

  useEffect(() => {
    if (students.length > 0) runAi();
  }, [runAi]);

  // ── derived state ────────────────────────────────────────

  const allStudents = mergeStudentData(
    students, warnings, aiPredictions, paceRecords, enrollments, sections
  );

  // Teacher scope filter
  const teacherFiltered = teacher?.assignedSections
    ? allStudents.filter((s) => teacher.assignedSections.includes(s.section))
    : allStudents;

  // User-selected filters
  const filteredStudents = teacherFiltered.filter((student) => {
    const matchesRisk    = filters.risk === 'All' || student.riskLevel === filters.risk;
    const matchesSection = filters.section === 'All' || student.section === filters.section;
    return matchesRisk && matchesSection;
  });

  // Sort: High → Medium → Low, then by risk probability
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 };
    const levelDiff = (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
    if (levelDiff !== 0) return levelDiff;
    return (b.riskProbability ?? 0) - (a.riskProbability ?? 0);
  });

  const riskCounts = {
    high:   allStudents.filter((s) => s.riskLevel === 'High').length,
    medium: allStudents.filter((s) => s.riskLevel === 'Medium').length,
    low:    allStudents.filter((s) => s.riskLevel === 'Low').length,
  };

  const sectionOptions   = sections.map((s) => s.name);
  const schoolYearOptions = schoolYears.map((y) => y.year || String(y.school_year_id));

  return {
    filters,
    updateFilter: (key, value) => setFilters((prev) => ({ ...prev, [key]: value })),

    allStudents,
    filteredStudents: sortedStudents,
    riskCounts,

    sectionOptions,
    schoolYearOptions,

    loading,
    aiLoading,
    error,
  };
}