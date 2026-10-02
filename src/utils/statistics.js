export const calculateCompletionRate = (studentId, assignments) => {
  const studentAssignments = assignments.filter(a => a.studentId === studentId);
  if (studentAssignments.length === 0) return 0;
  const completed = studentAssignments.filter(a => ['submitted', 'reviewed'].includes(a.status)).length;
  return Math.round((completed / studentAssignments.length) * 100);
};

export const calculateOnTimeRate = (studentId, assignments, tasks) => {
  const studentAssignments = assignments.filter(a => a.studentId === studentId && ['submitted', 'reviewed'].includes(a.status));
  if (studentAssignments.length === 0) return 0;
  
  const onTime = studentAssignments.filter(a => {
    const task = tasks.find(t => t.id === a.taskId);
    if (!task) return false;
    return new Date(a.submittedAt) <= new Date(task.deadline);
  }).length;
  
  return Math.round((onTime / studentAssignments.length) * 100);
};

export const calculateAverageScore = (studentId, assignments) => {
  const reviewed = assignments.filter(a => a.studentId === studentId && a.status === 'reviewed' && a.score !== null);
  if (reviewed.length === 0) return 0;
  const sum = reviewed.reduce((acc, a) => acc + a.score, 0);
  return (sum / reviewed.length).toFixed(1);
};