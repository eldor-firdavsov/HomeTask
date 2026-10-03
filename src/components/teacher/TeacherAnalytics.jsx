import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import Button from '../common/Button';
import { Download } from 'lucide-react';
import { getTaskStatus } from '../../utils/taskStatus';
import { calculateCompletionRate, calculateAverageScore } from '../../utils/statistics';

export default function TeacherAnalytics() {
  const { tasks, students, assignments } = useAppState();

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student,Task,Type,Deadline,Submitted At,Status,Score\n";

    assignments.forEach(a => {
      const student = students.find(s => s.id === a.studentId)?.name || 'Unknown';
      const task = tasks.find(t => t.id === a.taskId);
      if (!task) return;
      const status = getTaskStatus(a, task);
      const submitted = a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'N/A';
      const row = `"${student}","${task.title}","${task.type}","${new Date(task.deadline).toLocaleString()}","${submitted}","${status}","${a.score || ''}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "classflow_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Class Analytics</h1>
          <p style={{ color: 'var(--muted)' }}>Overview of student performance</p>
        </div>
        <Button variant="primary" onClick={handleExportCSV}>
          <Download size={18} /> Export CSV
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {students.map(s => {
          const completion = calculateCompletionRate(s.id, assignments);
          const avgScore = calculateAverageScore(s.id, assignments);
          return (
            <div key={s.id} className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{s.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--muted)' }}>Completion Rate</span>
                <strong>{completion}%</strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ width: `${completion}%`, height: '100%', background: 'var(--primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Avg Score</span>
                <strong>{avgScore > 0 ? `${avgScore} / 10` : '-'}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
