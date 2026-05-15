// ============================================================
// WarningFilter.jsx — dynamic options version
// Accepts sectionOptions + schoolYearOptions from the live hook.
// ============================================================


const WarningFilter = ({
  filters,
  onFilterChange,
  teacher = null,
  sectionOptions = [],
  schoolYearOptions = [],
}) => {
  const sections = sectionOptions.length
    ? sectionOptions
    : ['Section A', 'Section B', 'Section C'];

  const years = schoolYearOptions.length
    ? schoolYearOptions
    : ['2025-2026', '2024-2025'];

  return (
    <div className="warning-filter">
      {/* School Year */}
      <select
        value={filters.schoolYear}
        onChange={(e) => onFilterChange('schoolYear', e.target.value)}
        className="filter-select"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            SY {y}
          </option>
        ))}
      </select>

      {/* Section — hidden when teacher has only one section */}
      {(!teacher || (teacher.assignedSections && teacher.assignedSections.length > 1)) && (
        <select
          value={filters.section}
          onChange={(e) => onFilterChange('section', e.target.value)}
          className="filter-select"
        >
          <option value="All">All Sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {/* Risk Level */}
      <select
        value={filters.risk}
        onChange={(e) => onFilterChange('risk', e.target.value)}
        className="filter-select"
      >
        <option value="All">All Risk Levels</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    </div>
  );
};

export default WarningFilter;