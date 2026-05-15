const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const AI_MODEL_BASE = import.meta.env.VITE_AI_URL || 'https://lbca-django-ai-model.onrender.com';

// ── Backend fetch helper ───────────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem('access_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── AI fetch helper ────────────────────────────────────────────────────────────
async function aiRequest(path, options = {}) {
  const res = await fetch(`${AI_MODEL_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || res.statusText);
  }
  return res.json();
}

// ── Grade Levels ──────────────────────────────────────────────────────────────
export const gradeLevelApi = {
  list: () => request('/api/grade-levels/'),
  get: (id) => request(`/api/grade-levels/${id}`),
  create: (data) => request('/api/grade-levels', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/grade-levels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/grade-levels/${id}`, { method: 'DELETE' }),
};

// ── School Years ──────────────────────────────────────────────────────────────
export const schoolYearApi = {
  list: () => request('/api/school-years/'),
  getCurrent: () => request('/api/school-years/current/'),
  get: (id) => request(`/api/school-years/${id}`),
  create: (data) => request('/api/school-years', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/school-years/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/school-years/${id}`, { method: 'DELETE' }),
};

// ── Sections ──────────────────────────────────────────────────────────────────
export const sectionApi = {
  list: (gradeLevelId = null) =>
    request(gradeLevelId ? `/api/sections/?grade_level_id=${gradeLevelId}` : '/api/sections/'),
  get: (id) => request(`/api/sections/${id}`),
  create: (data) => request('/api/sections', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/sections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/sections/${id}`, { method: 'DELETE' }),
};

// ── Subjects ───────────────────────────────────────────────────────────────────
export const subjectApi = {
  list: (gradeLevelId = null) =>
    request(gradeLevelId ? `/api/subjects/?grade_level_id=${gradeLevelId}` : '/api/subjects/'),
  get: (id) => request(`/api/subjects/${id}`),
  create: (data) => request('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/subjects/${id}`, { method: 'DELETE' }),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentApi = {
  list: () => request('/api/students/'),
  get: (id) => request(`/api/students/${id}`),
  create: (data) => request('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/students/${id}`, { method: 'DELETE' }),
};

// ── Staff / Teachers ──────────────────────────────────────────────────────────
export const staffApi = {
  list: () => request('/api/users'),
  get: (id) => request(`/api/users/${id}`),
  me: () => request('/api/users/me'),
};

// ── Student Enrollments ───────────────────────────────────────────────────────
export const enrollmentApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request(qs ? `/api/enrollments/?${qs}` : '/api/enrollments/');
  },
  get: (id) => request(`/api/enrollments/${id}`),
  createWithStudent: (data) =>
    request('/api/enrollments/with-student', { method: 'POST', body: JSON.stringify(data) }),
  create: (data) =>
    request('/api/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/api/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/enrollments/${id}`, { method: 'DELETE' }),
};

// ── Teacher Assignments ───────────────────────────────────────────────────────
export const teacherAssignmentApi = {
  list: (sectionId = null) =>
    request(sectionId ? `/api/teacher-assignments/?section_id=${sectionId}` : '/api/teacher-assignments/'),
  get: (id) => request(`/api/teacher-assignments/${id}`),
  create: (data) => request('/api/teacher-assignments', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/teacher-assignments/${id}`, { method: 'DELETE' }),
};

// ── Class Schedules ───────────────────────────────────────────────────────────
export const classScheduleApi = {
  list: () => request('/api/class-schedules/'),
  create: (data) => request('/api/class-schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/class-schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/class-schedules/${id}`, { method: 'DELETE' }),
};

// ── Early Warnings ────────────────────────────────────────────────────────────
export const earlyWarningApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request(`/api/early-warnings/${qs ? '?' + qs : ''}`);
  },
  critical: () => request('/api/early-warnings/critical'),
};

// ── PACE Records ──────────────────────────────────────────────────────────────
export const paceApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request(`/api/student-paces/${qs ? '?' + qs : ''}`);
  },
  get: (id) => request(`/api/student-paces/${id}`),
  create: (data) => request('/api/student-paces', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/student-paces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/student-paces/${id}`, { method: 'DELETE' }),
};

// ── AI helpers ────────────────────────────────────────────────────────────────

/**
 * Build the StudentDataInput payload that the Django AI model expects.
 *
 * Since we only track PACE (no attendance), we:
 *  - map pace_percent → pace_history (as chronological completion %)
 *  - map subject scores via test_scores
 *  - leave attendance_history empty (AI handles missing values gracefully)
 */
export function toAiStudentInput(student, paces = []) {
  // Sort paces by creation date so history is chronological
  const sorted = [...paces].sort(
    (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
  );

  // pace_history: list of pace_percent values (0-100) per record
  const paceHistory = sorted.map((p) =>
    p.pace_percent != null ? parseFloat(p.pace_percent) : 0
  );

  // test_scores keyed by subject name
  const testScores = {};
  sorted.forEach((p) => {
    const subj = p.subject || 'General';
    if (!testScores[subj]) testScores[subj] = [];
    // Use pace_percent as the score proxy since that's what's recorded
    testScores[subj].push(
      p.pace_percent != null ? parseFloat(p.pace_percent) : 0
    );
  });

  return {
    student_id: String(student.student_id || student.id),
    current_week: sorted.length || 1,
    pace_history: paceHistory,
    attendance_history: [],          // not tracked — AI uses 0 as default
    test_scores: testScores,
    absences_current: 0,
    late_arrivals_current: 0,
    submissions: {
      ontime: sorted.filter((p) => (p.pace_percent ?? 0) >= 70).length,
      late: sorted.filter((p) => (p.pace_percent ?? 0) < 70).length,
    },
    teacher_notes: '',
  };
}

// ── AI Model API ──────────────────────────────────────────────────────────────
export const aiApi = {
  predictRisk: (studentInput) =>
    aiRequest('/api/ai/predict-risk/', { method: 'POST', body: JSON.stringify(studentInput) }),

  predictCohortRisk: (students, cohortId = 'cohort-1') =>
    aiRequest('/api/ai/predict-risk/batch/', {
      method: 'POST',
      body: JSON.stringify({ students, cohort_id: cohortId }),
    }),

  insights: (students, cohortId = 'cohort-1') =>
    aiRequest('/api/ai/insights/', {
      method: 'POST',
      body: JSON.stringify({ students, cohort_id: cohortId }),
    }),

  recommendations: (studentInput) =>
    aiRequest('/api/ai/recommend-action/', { method: 'POST', body: JSON.stringify(studentInput) }),

  activeAlerts: (severity) =>
    aiRequest(`/api/ai/alerts/active${severity ? `?severity=${severity}` : ''}`),

  checkAlerts: (students, cohortId = 'cohort-1') =>
    aiRequest('/api/ai/check-alerts/', {
      method: 'POST',
      body: JSON.stringify({ students, cohort_id: cohortId }),
    }),

  health: () => aiRequest('/api/ai/health'),
};