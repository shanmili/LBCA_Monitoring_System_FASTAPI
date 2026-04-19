import FilterBar from '../../../components/common/FilterBar';

const TeacherFilter = ({ filters, onFilterChange }) => {
  const filterOptions = [
    {
      key: 'status',
      value: filters.status,
      options: [
        { value: 'all', label: 'All Accounts' },
        { value: 'pending', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  return (
    <FilterBar 
      filters={filterOptions} 
      onFilterChange={onFilterChange} 
    />
  );
};

export default TeacherFilter;