export const getTaskStatus = (assignment, task) => {
  if (!assignment) return 'unseen';
  if (assignment.status === 'reviewed') return 'reviewed';
  if (assignment.status === 'needs_revision') return 'needs_revision';
  if (assignment.status === 'submitted') {
    const isLate = new Date(assignment.submittedAt) > new Date(task.deadline);
    return isLate ? 'late_submitted' : 'on_time';
  }
  
  if (new Date() > new Date(task.deadline)) return 'overdue';
  return assignment.status; 
};