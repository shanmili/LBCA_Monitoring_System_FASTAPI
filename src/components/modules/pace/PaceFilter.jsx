import FilterBar from '../../../components/common/FilterBar';

/**
 * PaceFilter
 * Receives option arrays from the parent hook (live from backend)
 * instead of importing static mockData.
 */
const PaceFilter = ({
  filters,
  onFilterChange,
  schoolYearOptions = [],
  gradeLevelOptions = [],
  sectionOptions    = [],
  subjectOptions    = [],
}) => {
  const filterOptions = [
    {
      key: 'schoolYear',
      value: filters.schoolYear,
      options: schoolYearOptions.map((year) => ({
        value: year,
        label: `SY ${year}`,
      })),
    },
    {
      key: 'gradeLevel',
      value: filters.gradeLevel,
      options: gradeLevelOptions.map((grade) => ({
        value: grade,
        label: grade,
      })),
    },
    {
      key: 'section',
      value: filters.section,
      options: sectionOptions.map((section) => ({
        value: section,
        label: section,
      })),
    },
    {
      key: 'subject',
      value: filters.subject,
      options: subjectOptions.map((subject) => ({
        value: subject,
        label: subject,
      })),
    },
  ];

  return (
    <div className="filter-section">
      <FilterBar
        filters={filterOptions}
        onFilterChange={onFilterChange}
      />
    </div>
  );
};

export default PaceFilter;