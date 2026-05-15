// ============================================================
// useDashboardDataState.js
// Fetches live data from FastAPI backend + Django AI model.
// Attendance removed — system only tracks PACE.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  studentApi,
  sectionApi,
  schoolYearApi,
  paceApi,
  enrollmentApi,
  aiApi,
  toAiStudentInput,
} from '../services/api';

// ── helpers ──────────────────────────────────────────────────

/**
 * Build PACE Completion Trend data for the line chart.
 * Groups pace records by section, produces weekly average % per section.
 */
function buildTrendData(enrollments, paceRecords, sections) {
  if (!enrollments.length || !sections.length) return [];

  // Map enrollment_id → section name
  const enrollSectionMap = {};
  enrollments.forEach((enr) => {
    const sec = sections.find((s) => s.section_id === enr.section_id);
    enrollSectionMap[enr.enrollment_id] = sec?.name || `Section ${enr.section_id}`;
  });

  // Group pace records by section
  const bySection = {};
  sections.forEach((s) => { bySection[s.name] = []; });

  paceRecords.forEach((p) => {
    const secName = enrollSectionMap[p.enrollment_id];
    if (secName && bySection[secName]) {
      bySection[secName].push(p.pace_percent ?? 0);
    }
  });

  // Build up to 8 weekly buckets (treat each pace record as one "week" slot)
  const maxLen = Math.max(...Object.values(bySection).map((a) => a.length), 1);
  const buckets = Math.min(maxLen, 8);
  const rows = [];

  for (let i = 0; i < buckets; i++) {
    const row = { name: `W${i + 1}` };
    sections.slice(0, 5).forEach((sec) => {
      const scores = bySection[sec.name] || [];
      const slice = scores.slice(0, i + 1);
      const key = sec.name.replace(/\s+/g, '');
      row[key] = slice.length > 0
        ? Math.round(slice.reduce((a, b) => a + b, 0) / slice.length)
        : 0;
    });
    rows.push(row);
  }

  return rows.length ? rows : [{ name: 'W1' }];
}

/**
 * Build AI-powered PACE Forecast data for the bar/area chart.
 * Uses AI cohort predictions to show risk distribution forecast.
 * Falls back to deriving from individual predictions if insights.forecast is absent.
 */
function buildForecastData(aiInsights, aiPredictions = []) {
  // Try from insights.forecast first
  if (aiInsights?.forecast) {
    const f = aiInsights.forecast;
    return {
      predictedPass: f.predicted_pass ?? 0,
      predictedAtRisk: f.predicted_at_risk ?? 0,
      passRate: f.predicted_pass_rate ?? 0,
      confidence: f.confidence ?? 0,
      total: f.total_students ?? 0,
      chartData: [
        { name: 'On Track', value: f.predicted_pass ?? 0, color: '#10B981' },
        { name: 'At Risk', value: f.predicted_at_risk ?? 0, color: '#EF4444' },
      ],
    };
  }

  // Derive from individual predictions when insights doesn't have forecast
  if (aiPredictions.length > 0) {
    const total = aiPredictions.length;
    const atRisk = aiPredictions.filter(
      (p) => p.risk_level === 'high' || p.risk_level === 'medium'
    ).length;
    const pass = total - atRisk;
    const passRate = total > 0 ? (pass / total) * 100 : 0;
    const avgConf = aiPredictions.reduce((s, p) => s + (p.confidence ?? 0), 0) / total;
    return {
      predictedPass: pass,
      predictedAtRisk: atRisk,
      passRate,
      confidence: avgConf * 100,
      total,
      chartData: [
        { name: 'On Track', value: pass, color: '#10B981' },
        { name: 'At Risk', value: atRisk, color: '#EF4444' },
      ],
    };
  }

  return null;
}

/**
 * Merge AI risk predictions onto backend student records.
 * Also computes pacePercent from actual pace records.
 */
function deriveRiskFromAi(aiPredictions = [], backendStudents = [], enrollments = [], paceRecords = [], sections = []) {
  const aiMap = {};
  aiPredictions.forEach((p) => { aiMap[String(p.student_id)] = p; });

  // Map student_id → active enrollment
  const enrollMap = {};
  enrollments.forEach((enr) => {
    if (enr.is_active) enrollMap[String(enr.student_id)] = enr;
  });

  // Map section_id → section name
  const sectionMap = {};
  sections.forEach((s) => { sectionMap[s.section_id] = s.name; });

  return backendStudents.map((s) => {
    const id = String(s.student_id || s.id);
    const ai = aiMap[id];
    const enr = enrollMap[id];

    // Calculate pacePercent from actual records
    const studentPaces = paceRecords.filter((p) => String(p.student_id) === id);
    const pacePercent = studentPaces.length > 0
      ? Math.round(
          studentPaces.reduce((sum, p) => sum + (p.pace_percent ?? 0), 0) /
          studentPaces.length
        )
      : 0;

    const sectionName = enr
      ? sectionMap[enr.section_id] || '—'
      : s.section_name || '—';

    const riskLevel = ai
      ? ai.risk_level.charAt(0).toUpperCase() + ai.risk_level.slice(1).toLowerCase()
      : pacePercent < 70 ? 'High' : pacePercent < 85 ? 'Medium' : 'Low';

    const factor =
      ai?.risk_factors?.[0] ||
      (pacePercent < 70
        ? 'Low PACE completion'
        : pacePercent < 85
        ? 'Below average PACE completion'
        : pacePercent < 100
        ? 'On track — minor gaps'
        : 'Excellent PACE completion');

    return {
      ...s,
      id,
      section: sectionName,
      enrollment: enr || null,
      pacePercent,
      riskLevel,
      riskProbability: (() => {
        if (!ai) return pacePercent < 70 ? 85 : pacePercent < 85 ? 50 : 10;
        const raw = ai.risk_probability ?? ai.probability ?? ai.risk_score ?? null;
        if (raw == null) return pacePercent < 70 ? 85 : pacePercent < 85 ? 50 : 10;
        return raw > 1 ? Math.round(raw) : Math.round(raw * 100);
      })(),
      isAiProbability: !!ai,
      factor,
      earlyWarnings: ai?.early_warnings || [],
      positiveFactors: ai?.positive_factors || [],
      aiConfidence: ai?.confidence ?? 0,
    };
  });
}

// ── hook ─────────────────────────────────────────────────────

export default function useDashboardDataState() {
  const [filters, setFilters] = useState({
    schoolYear: '',
    section: 'All',
    quarter: 'Q1',
    risk: 'All',
  });

  // Raw data
  const [students, setStudents]       = useState([]);
  const [sections, setSections]       = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [paceRecords, setPaceRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [aiInsights, setAiInsights]   = useState(null);

  // UI state
  const [loading, setLoading]     = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]         = useState(null);

  // ── initial load ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [studs, secs, years, paces, enrs] = await Promise.all([
          studentApi.list(),
          sectionApi.list(),
          schoolYearApi.list(),
          paceApi.list(),
          enrollmentApi.list(),
        ]);
        if (!mounted) return;
        setStudents(studs);
        setSections(secs);
        setSchoolYears(years);
        setPaceRecords(paces);
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

  // ── AI analysis whenever students + paces change ─────────
  const runAiAnalysis = useCallback(async () => {
    if (!students.length) return;
    setAiLoading(true);
    try {
      // Build AI inputs using only PACE data (no attendance)
      const aiInputs = students.map((s) => {
        const sp = paceRecords.filter(
          (p) => String(p.student_id) === String(s.student_id || s.id)
        );
        return toAiStudentInput(s, sp);
      });

      // Wake up Render free-tier server, then retry up to 3 times
      try { await aiApi.health(); } catch (_) { /* ignore */ }

      let cohortResult = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          cohortResult = await aiApi.predictCohortRisk(aiInputs);
          if (cohortResult?.predictions?.length) break;
        } catch (e) {
          if (attempt === 3) break;
          await new Promise((r) => setTimeout(r, 5000));
        }
      }

      const [insightResult] = await Promise.allSettled([aiApi.insights(aiInputs)]);

      if (cohortResult?.predictions?.length) {
        setAiPredictions(cohortResult.predictions);
      }
      if (insightResult.status === 'fulfilled') {
        setAiInsights(insightResult.value);
      }
    } catch (e) {
      console.warn('AI analysis failed:', e.message);
    } finally {
      setAiLoading(false);
    }
  }, [students, paceRecords]);

  useEffect(() => {
    if (students.length > 0) runAiAnalysis();
  }, [runAiAnalysis]);

  // ── derived data ─────────────────────────────────────────

  const enriched = deriveRiskFromAi(aiPredictions, students, enrollments, paceRecords, sections);

  // Apply section filter
  const filtered = filters.section === 'All'
    ? enriched
    : enriched.filter((s) => s.section === filters.section);

  // Apply risk filter
  const riskFiltered = filters.risk === 'All'
    ? filtered
    : filtered.filter((s) => s.riskLevel === filters.risk);

  const totalStudents = enriched.length;
  const avgPaceCompletion = filtered.length > 0
    ? (filtered.reduce((sum, s) => sum + (s.pacePercent ?? 0), 0) / filtered.length).toFixed(1)
    : '0.0';
  const behindPace = filtered.filter((s) => (s.pacePercent ?? 0) < 80).length;
  const atRiskCount = filtered.filter(
    (s) => s.riskLevel === 'High' || s.riskLevel === 'Medium'
  ).length;

  const kpiData = {
    totalStudents,
    avgPaceCompletion,
    behindPace,
    atRisk: atRiskCount,
    quarter: filters.quarter,
  };

  // Trend chart — PACE completion over time by section
  const trendData = buildTrendData(enrollments, paceRecords, sections);
  // Section keys for TrendChart lines (strip spaces)
  const trendSectionKeys = sections.slice(0, 5).map((s) => ({
    key: s.name.replace(/\s+/g, ''),
    label: s.name,
  }));

  // AI Forecast data — always compute from enriched students so chart never shows empty
  const forecastData = (() => {
    // Try AI insights/predictions first
    const aiData = buildForecastData(aiInsights, aiPredictions);
    if (aiData) return aiData;

    // Fallback: derive from enriched student data (always available)
    if (enriched.length === 0) return null;
    const total = enriched.length;
    const atRisk = enriched.filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Medium').length;
    const pass = total - atRisk;
    const passRate = (pass / total) * 100;
    return {
      predictedPass: pass,
      predictedAtRisk: atRisk,
      passRate,
      confidence: null,
      total,
      chartData: [
        { name: 'On Track', value: pass, color: '#10B981' },
        { name: 'At Risk', value: atRisk, color: '#EF4444' },
      ],
    };
  })();

  // At-risk students table (sorted by risk probability desc)
  const atRiskStudents = riskFiltered
    .filter((s) => s.riskLevel === 'High' || s.riskLevel === 'Medium')
    .sort((a, b) => (b.riskProbability ?? 0) - (a.riskProbability ?? 0));

  // Activity feed from AI alerts
  const activityFeed = buildActivityFeed(aiInsights, atRiskStudents);

  // Filter options
  const sectionOptions = sections.map((s) => s.name);
  const schoolYearOptions = schoolYears.map((y) => y.year || String(y.school_year_id));

  return {
    filters,
    updateFilter: (key, value) => setFilters((prev) => ({ ...prev, [key]: value })),

    kpiData,
    trendData,
    trendSectionKeys,
    forecastData,
    atRiskStudents,
    activityFeed,
    aiInsights,

    sectionOptions,
    schoolYearOptions,

    loading,
    aiLoading,
    error,
  };
}

// ── activity feed builder ─────────────────────────────────────

function buildActivityFeed(aiInsights, atRiskStudents) {
  const feed = [];

  // Pull from AI alerts
  const alerts = aiInsights?.alerts?.individual || [];
  alerts.slice(0, 3).forEach((alert, i) => {
    feed.push({
      id: `ai-${i}`,
      type: alert.severity === 'critical' ? 'alert' : 'risk',
      text: alert.message || `Alert: ${alert.type}`,
      time: 'Just now',
    });
  });

  // Supplement with at-risk students
  atRiskStudents.slice(0, 2).forEach((s, i) => {
    const name = s.first_name
      ? `${s.first_name} ${s.last_name}`
      : String(s.id);
    feed.push({
      id: `risk-${i}`,
      type: 'risk',
      text: `Risk alert: ${name} — ${s.factor || s.riskLevel + ' risk'}`,
      time: '1 hour ago',
    });
  });

  if (feed.length < 3) {
    feed.push({
      id: 'pace-1',
      type: 'pace',
      text: 'PACE records updated from backend',
      time: '2 hours ago',
    });
  }

  return feed.slice(0, 6);
}