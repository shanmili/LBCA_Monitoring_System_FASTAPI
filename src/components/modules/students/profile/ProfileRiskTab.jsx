import { AlertTriangle, Shield } from 'lucide-react';
import RiskBadge from '../../../common/RiskBadge';

const ProfileRiskTab = ({ student, paceRecords = [], aiData, aiLoading }) => {
  // Average pace across all records
  const avgPace = paceRecords.length
    ? paceRecords.reduce((s, r) => s + (r.pace_percent ?? 0), 0) / paceRecords.length
    : null;

  // Risk level: AI first, then pace fallback
  const riskLevel = aiData?.risk_level
    ? aiData.risk_level.charAt(0).toUpperCase() + aiData.risk_level.slice(1)
    : avgPace == null ? 'Low'
    : avgPace < 60 ? 'High'
    : avgPace < 80 ? 'Medium'
    : 'Low';

  const riskProbability = aiData?.risk_probability != null
    ? (aiData.risk_probability * 100).toFixed(0)
    : null;

  // Risk factors: AI first, then derive from pace data
  const riskFactors = (() => {
    if (aiData?.risk_factors?.length) return aiData.risk_factors;
    if (aiLoading) return [];           // still waiting for AI — show nothing yet
    // Pace-based fallback factors
    const factors = [];
    if (avgPace != null && avgPace < 60) factors.push(`Low average PACE completion (${Math.round(avgPace)}%)`);
    else if (avgPace != null && avgPace < 80) factors.push(`Below-target PACE completion (${Math.round(avgPace)}%)`);
    const belowThreshold = paceRecords.filter((r) => (r.pace_percent ?? 0) < 70).length;
    if (belowThreshold > 0) factors.push(`${belowThreshold} PACE record(s) below 70% completion`);
    // Per-subject low performers
    const bySubject = {};
    paceRecords.forEach((r) => {
      const s = r.subject || 'General';
      if (!bySubject[s]) bySubject[s] = [];
      bySubject[s].push(r.pace_percent ?? 0);
    });
    Object.entries(bySubject).forEach(([subj, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg < 70) factors.push(`${subj}: avg ${Math.round(avg)}% PACE`);
    });
    return factors;
  })();

  const earlyWarnings = aiData?.early_warnings || [];
  const positiveFactors = aiData?.positive_factors || [];

  const suggestedAction = earlyWarnings[0]?.message || (
    riskLevel === 'High' ? 'Immediate intervention required — schedule a review with the student' :
    riskLevel === 'Medium' ? 'Monitor PACE progress closely and check in weekly' :
    'No action needed — student is on track'
  );

  const noRisk = !aiLoading && riskFactors.length === 0 && riskLevel === 'Low';

  return (
    <div className="tab-content risk-tab">
      {/* Header row */}
      <div className="current-risk" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary, #f9fafb)', borderRadius: 8, marginBottom: '1rem' }}>
        <span style={{ fontWeight: 500 }}>Current Risk Level:</span>
        <RiskBadge level={riskLevel} />
        {riskProbability && (
          <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: 4 }}>
            ({riskProbability}% probability)
          </span>
        )}
        {aiLoading && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
            ⏳ AI analysing…
          </span>
        )}
        {!aiLoading && !aiData && (
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: 8 }}>
            (PACE-based estimate)
          </span>
        )}
        {aiData && (
          <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: 'auto' }}>
            AI · {((aiData.confidence ?? 0) * 100).toFixed(0)}% confidence
          </span>
        )}
      </div>

      {/* Risk Factors */}
      {aiLoading && !riskFactors.length ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
          ⏳ Loading AI risk analysis…
        </div>
      ) : noRisk ? (
        <div className="no-risk-message" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          <Shield size={40} style={{ margin: '0 auto 0.5rem', color: '#10b981', display: 'block' }} />
          <p>No risk factors detected. This student is on track.</p>
        </div>
      ) : riskFactors.length > 0 ? (
        <div className="risk-details-list">
          <h4>Risk Factors</h4>
          {riskFactors.map((factor, i) => (
            <div key={i} style={{ padding: '0.6rem 1rem', marginBottom: '0.5rem', borderRadius: 6, background: '#fef2f2', borderLeft: '3px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={14} color="#ef4444" />
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{factor}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Early Warnings from AI */}
      {earlyWarnings.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Early Warnings</h4>
          {earlyWarnings.map((w, i) => (
            <div key={i} style={{ padding: '0.6rem 1rem', marginBottom: '0.5rem', borderRadius: 6, background: '#fffbeb', borderLeft: '3px solid #f59e0b', fontSize: '0.875rem' }}>
              <strong>{w.type || 'Warning'}:</strong> {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Positive Factors */}
      {positiveFactors.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Positive Factors</h4>
          {positiveFactors.map((f, i) => (
            <div key={i} style={{ padding: '0.6rem 1rem', marginBottom: '0.5rem', borderRadius: 6, background: '#ecfdf5', borderLeft: '3px solid #10b981', fontSize: '0.875rem', color: '#065f46' }}>
              ✓ {f}
            </div>
          ))}
        </div>
      )}

      {/* Suggested Action */}
      {!noRisk && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: '#eff6ff', borderLeft: '3px solid #3b82f6' }}>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>Recommended Action</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e3a8a' }}>{suggestedAction}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileRiskTab;