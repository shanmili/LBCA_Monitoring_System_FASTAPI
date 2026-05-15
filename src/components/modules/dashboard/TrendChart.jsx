import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../../../styles/dashboard/TrendChart.css';

// Colour palette for up to 8 sections
const SECTION_COLORS = [
  '#1F4788', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
];

/**
 * TrendChart
 *
 * Props:
 *  data         — array of { name: 'W1', SectionA: 72, SectionB: 85, … }
 *  sectionKeys  — array of { key: 'SectionA', label: 'Section A' }
 */
const TrendChart = ({ data, sectionKeys = [], title = 'PACE Completion Trend' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <div
          className="chart-container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No PACE data recorded yet.
          </p>
        </div>
      </div>
    );
  }

  // Fall back to inferring keys from the first data row if sectionKeys not passed
  const keys = sectionKeys.length > 0
    ? sectionKeys
    : Object.keys(data[0])
        .filter((k) => k !== 'name')
        .map((k) => ({ key: k, label: k }));

  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip formatter={(value) => [`${value}%`, '']} />
            <Legend />
            {keys.map(({ key, label }, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={SECTION_COLORS[idx % SECTION_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                name={label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendChart;