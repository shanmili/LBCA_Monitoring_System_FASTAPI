import { useState, useEffect } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import '../../../styles/pace/PaceTable.css';

const PaceTable = ({
  data,
  onDataChange,
  onAddPaceForCurrent,
  subject,
  section,
  gradeLevel,
  loading = false,
}) => {
  const [localData, setLocalData] = useState(data);
  const [paceTotals, setPaceTotals] = useState({});

  useEffect(() => {
    setLocalData(data);

    // Derive totals from the student with the most records
    if (data && data.length > 0) {
      const richest = data.reduce(
        (best, row) =>
          (row.paceRecords?.length ?? 0) > (best.paceRecords?.length ?? 0) ? row : best,
        data[0]
      );
      if (richest?.paceRecords?.length > 0) {
        const totals = {};
        richest.paceRecords.forEach((record, index) => {
          if (record.totalScore != null) totals[index] = record.totalScore;
        });
        setPaceTotals(totals);
      }
    }
  }, [data]);

  // Number of PACE columns = max paceRecords length across ALL students
  const maxPaceCount = localData
    ? Math.max(...localData.map((row) => row.paceRecords?.length ?? 0), 0)
    : 0;

  // Synthetic column descriptors based on the student with the most records
  const columnRecords = (() => {
    if (!localData || maxPaceCount === 0) return [];
    const richest = localData.reduce(
      (best, row) =>
        (row.paceRecords?.length ?? 0) > (best.paceRecords?.length ?? 0) ? row : best,
      localData[0]
    );
    return richest.paceRecords ?? [];
  })();

  const handleScoreChange = (studentId, paceIndex, value) => {
    const score = value === '' ? null : parseFloat(value);
    const maxScore = paceTotals[paceIndex];
    if (score !== null && !isNaN(score) && maxScore && (score < 0 || score > maxScore)) return;

    const updatedData = localData.map((row) => {
      if (row.studentId === studentId) {
        const updatedPaceRecords = [...(row.paceRecords ?? [])];
        if (updatedPaceRecords[paceIndex]) {
          updatedPaceRecords[paceIndex] = {
            ...updatedPaceRecords[paceIndex],
            testScore: score,
          };
        }
        return { ...row, paceRecords: updatedPaceRecords };
      }
      return row;
    });

    setLocalData(updatedData);
    onDataChange(updatedData);
  };

  const handleTotalScoreChange = (paceIndex, value) => {
    if (value === '') {
      setPaceTotals((prev) => ({ ...prev, [paceIndex]: '' }));
      return;
    }
    const total = parseInt(value, 10);
    if (!isNaN(total) && total > 0) {
      setPaceTotals((prev) => ({ ...prev, [paceIndex]: total }));
      const updatedData = localData.map((row) => {
        const updatedPaceRecords = [...(row.paceRecords ?? [])];
        if (updatedPaceRecords[paceIndex]) {
          updatedPaceRecords[paceIndex] = {
            ...updatedPaceRecords[paceIndex],
            totalScore: total,
          };
        }
        return { ...row, paceRecords: updatedPaceRecords };
      });
      onDataChange(updatedData);
    }
  };

  const handleTotalBlur = (paceIndex) => {
    if (!paceTotals[paceIndex]) {
      const newTotals = { ...paceTotals };
      delete newTotals[paceIndex];
      setPaceTotals(newTotals);
    }
  };

  if (loading) {
    return (
      <div className="no-data-container">
        <p style={{ opacity: 0.6 }}>Loading class data…</p>
      </div>
    );
  }

  if (!localData || localData.length === 0) {
    return (
      <div className="no-data-container">
        <BookOpen size={48} />
        <p>No students found for {gradeLevel} {section}.</p>
        <p className="hint">Please add students to this class first.</p>
      </div>
    );
  }

  return (
    <div className="pace-table-container">
      <div className="pace-table-header">
        <h3>{subject} - {gradeLevel} {section}</h3>
        <button className="add-pace-current-btn" onClick={onAddPaceForCurrent}>
          <Plus size={16} />
          PACE
        </button>
      </div>
      <div className="pace-table-wrapper">
        <table className="pace-table">
          <thead>
            <tr>
              <th className="sticky-header">Student</th>
              {maxPaceCount === 0 ? (
                <th className="pace-record-header">No PACE Records Yet</th>
              ) : (
                columnRecords.map((record, index) => (
                  <th key={index} className="pace-record-header">
                    <div className="pace-header-content">
                      <span>PACE #{record.paceNo ?? index + 1}</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Total"
                        value={paceTotals[index] ?? ''}
                        onChange={(e) => handleTotalScoreChange(index, e.target.value)}
                        onBlur={() => handleTotalBlur(index)}
                        className="total-input"
                      />
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {localData.map((row) => (
              <tr key={row.studentId}>
                <td className="student-name sticky-col">{row.name}</td>
                {maxPaceCount === 0 ? (
                  <td className="score-cell empty">—</td>
                ) : (
                  Array.from({ length: maxPaceCount }).map((_, colIndex) => {
                    const record = row.paceRecords?.[colIndex];
                    return (
                      <td key={colIndex} className="score-cell">
                        {record ? (
                          <input
                            type="number"
                            min="0"
                            max={paceTotals[colIndex] || undefined}
                            placeholder="Score"
                            value={record.testScore ?? ''}
                            onChange={(e) =>
                              handleScoreChange(row.studentId, colIndex, e.target.value)
                            }
                            className="score-input"
                            disabled={!paceTotals[colIndex]}
                          />
                        ) : (
                          // Student has no record for this column yet — show dash
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>—</span>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pace-table-footer">
        <p className="auto-save-note">✓ All changes are automatically saved</p>
      </div>
    </div>
  );
};

export default PaceTable;