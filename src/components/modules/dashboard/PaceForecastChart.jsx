import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import '../../../styles/dashboard/AttendanceChart.css'; // reuse same card styles

/**
 * PaceForecastChart
 *
 * Replaces the old AttendanceChart.
 * Displays the AI model's cohort outcome forecast:
 *   - Predicted pass vs at-risk student counts (donut)
 *   - AI insight cards (if available)
 */
const PaceForecastChart = ({ forecastData, aiInsights, aiLoading }) => {
  // While AI is loading show a spinner inside the card
  if (aiLoading && !forecastData) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">AI PACE Forecast</h3>
        <div
          className="pie-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            ⏳ Analysing…
          </p>
        </div>
      </div>
    );
  }

  // No forecast yet (no students or AI not done)
  if (!forecastData) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">AI PACE Forecast</h3>
        <div
          className="pie-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No forecast data yet.
          </p>
        </div>
      </div>
    );
  }

  const { chartData, passRate, confidence, total } = forecastData;

  // Pull top AI insight card (highest priority)
  const topInsights = (aiInsights?.insights || [])
    .filter((i) => i.priority === 'critical' || i.priority === 'high')
    .slice(0, 2);

  return (
    <div className="chart-card">
      <h3 className="chart-title">AI PACE Forecast</h3>

      {/* Donut chart */}
      <div className="pie-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => [`${val} students`, '']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-center">
          <span className="pie-value">{passRate?.toFixed(0) ?? 0}%</span>
          <span className="pie-label">Predicted Pass</span>
        </div>
      </div>

      {/* Legend */}
      <div className="pie-legend">
        {chartData.map((item) => (
          <div className="legend-item" key={item.name}>
            <span className="legend-color" style={{ backgroundColor: item.color }} />
            <span>{item.name} ({item.value})</span>
          </div>
        ))}
        <div className="legend-item" style={{ marginTop: 4, fontSize: '0.72rem', color: '#9CA3AF' }}>
          {confidence != null ? `AI confidence: ${confidence.toFixed(0)}% · ` : 'Estimated · '}{total} students
        </div>
      </div>

      {/* AI insight pills */}
      {topInsights.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {topInsights.map((ins, i) => (
            <div
              key={i}
              style={{
                fontSize: '0.72rem',
                background: ins.priority === 'critical' ? '#FEF2F2' : '#FFFBEB',
                color: ins.priority === 'critical' ? '#B91C1C' : '#92400E',
                borderRadius: 6,
                padding: '4px 8px',
              }}
            >
              {ins.icon} {ins.title}: {ins.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaceForecastChart;