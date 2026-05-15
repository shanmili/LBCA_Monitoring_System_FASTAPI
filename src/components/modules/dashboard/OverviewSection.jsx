// ============================================================
// OverviewSection.jsx — dynamic filter options version
// The filters prop now accepts _sectionOptions and
// _schoolYearOptions arrays from the live hook so the dropdowns
// are populated from real backend data instead of hard-coded lists.
// ============================================================

import FilterBar from '../../../components/common/FilterBar';
import '../../../styles/dashboard/OverviewSection.css';

const OverviewSection = ({ title, subtitle, filters, onFilterChange }) => {
  const sectionOptions = filters._sectionOptions || ['Section A', 'Section B', 'Section C'];
  const schoolYearOptions = filters._schoolYearOptions || ['2025-2026', '2024-2025'];

  const filterConfig = [
    {
      key: 'schoolYear',
      value: filters.schoolYear,
      options: [
        ...schoolYearOptions.map((y) => ({ value: y, label: `SY ${y}` })),
      ],
    },
    {
      key: 'section',
      value: filters.section,
      options: [
        { value: 'All', label: 'All Sections' },
        ...sectionOptions.map((s) => ({ value: s, label: s })),
      ],
    },
    {
      key: 'quarter',
      value: filters.quarter,
      options: [
        { value: 'Q1', label: 'Q1' },
        { value: 'Q2', label: 'Q2' },
        { value: 'Q3', label: 'Q3' },
        { value: 'Q4', label: 'Q4' },
      ],
    },
    {
      key: 'risk',
      value: filters.risk,
      options: [
        { value: 'All',    label: 'All Risk' },
        { value: 'High',   label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low',    label: 'Low' },
      ],
    },
  ];

  return (
    <div className="overview-section">
      <div className="title-group">
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      <FilterBar filters={filterConfig} onFilterChange={onFilterChange} />
    </div>
  );
};

export default OverviewSection;