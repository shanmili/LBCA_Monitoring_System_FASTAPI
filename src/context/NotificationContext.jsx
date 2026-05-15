// ============================================================
// NotificationContext.jsx
// Replaces hardcoded studentsData notifications with live data
// from the FastAPI backend (early warnings) and the Django AI
// model (active alerts).  Polls every 60 s for fresh alerts.
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { earlyWarningApi, aiApi, studentApi, paceApi, toAiStudentInput } from '../services/api';

// ── helpers ──────────────────────────────────────────────────

let _idCounter = 1;
const nextId = () => _idCounter++;

function relativeTime(isoString) {
  if (!isoString) return 'Just now';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

function aiAlertToNotification(alert, studentsMap = {}) {
  const studentId = alert.student_id;
  const student = studentsMap[String(studentId)];
  const name = student
    ? `${student.first_name || student.firstName || ''} ${student.last_name || student.lastName || ''}`.trim()
    : studentId;

  const typeMap = {
    critical: 'at-risk',
    warning:  'risk',
    info:     'attendance',
  };

  return {
    id: nextId(),
    type: typeMap[alert.severity] || 'risk',
    severity: alert.severity,
    title: alert.type || 'Alert',
    message: alert.message || `Alert for ${name}`,
    student: name,
    studentId: student?.id || studentId,
    time: relativeTime(alert.timestamp),
    read: false,
    source: 'ai',
  };
}

function warningToNotification(warning, studentsMap = {}) {
  const student = studentsMap[String(warning.student_id)];
  const name = warning.student_name ||
    (student
      ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
      : `Student #${warning.student_id}`);

  const risk = (warning.risk_level || 'low').toLowerCase();
  const type = risk === 'critical' || risk === 'high' ? 'at-risk' : 'risk';

  return {
    id: nextId(),
    type,
    severity: risk,
    title: risk === 'critical' || risk === 'high'
      ? 'At-Risk Alert'
      : 'Risk Warning',
    message:
      warning.notes ||
      warning.reason ||
      `${name} flagged with ${risk} risk level`,
    student: name,
    studentId: student?.id || warning.student_id,
    time: relativeTime(warning.created_at || warning.updated_at),
    read: false,
    source: 'backend',
  };
}

// ── context ───────────────────────────────────────────────────

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [userActivity, setUserActivity]   = useState([]);
  const [studentsMap, setStudentsMap]     = useState({});

  // ── load student lookup once ─────────────────────────────────
  useEffect(() => {
    studentApi.list()
      .then((studs) => {
        const map = {};
        studs.forEach((s) => { map[String(s.id || s.student_id)] = s; });
        setStudentsMap(map);
      })
      .catch(() => {}); // non-fatal
  }, []);

  // ── fetch & merge notifications ──────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      // 1. Stored early warnings from backend
      const warnings = await earlyWarningApi.list().catch(() => []);

      // 2. AI active alerts
      const aiAlerts = await aiApi.activeAlerts()
        .then((r) => r.alerts || [])
        .catch(() => []);

      // 3. If AI has no stored alerts, generate them now from live student data
      let liveAiAlerts = aiAlerts;
      if (!liveAiAlerts.length) {
        const [studs, paces] = await Promise.all([
          studentApi.list().catch(() => []),
          paceApi.list().catch(() => []),
        ]);
        if (studs.length) {
          const aiInputs = studs.map((s) => {
            const sp = paces.filter((p) => p.student_id === (s.id || s.student_id));
            return toAiStudentInput(s, sp);
          });
          const result = await aiApi.checkAlerts(aiInputs).catch(() => null);
          liveAiAlerts = result?.individual || [];
        }
      }

      // Build notification list — deduplicate by studentId + type
      const seen = new Set();
      const all = [];

      // AI alerts first (higher priority)
      liveAiAlerts.forEach((a) => {
        const key = `${a.student_id}-${a.type}-${a.severity}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(aiAlertToNotification(a, studentsMap));
        }
      });

      // Supplement with backend warnings
      warnings.forEach((w) => {
        const key = `${w.student_id}-warning-${w.risk_level}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(warningToNotification(w, studentsMap));
        }
      });

      // Preserve read state from existing notifications
      setNotifications((prev) => {
        const readSet = new Set(prev.filter((n) => n.read).map((n) => n.id));
        return all.map((n) => ({
          ...n,
          read: readSet.has(n.id),
        }));
      });
    } catch (e) {
      console.warn('Notification fetch failed:', e.message);
    }
  }, [studentsMap]);

  // Initial load + poll every 60 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── computed ─────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const addUserActivity = (text) =>
    setUserActivity((prev) => [
      { id: Date.now(), text, time: 'Just now' },
      ...prev,
    ]);

  // Also allow pushing a new notification (e.g. after manual AI trigger)
  const addNotification = (notif) =>
    setNotifications((prev) => [
      { id: nextId(), read: false, time: 'Just now', ...notif },
      ...prev,
    ]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        markRead,
        addNotification,
        userActivity,
        addUserActivity,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}