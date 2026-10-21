export const getTaskStatus = (assignment, task) => {
  if (!assignment) return 'unseen';
  if (assignment.status === 'reviewed') return 'reviewed';
  if (assignment.status === 'needs_revision' || assignment.status === 'review') return 'review';
  if (assignment.status === 'submitted') {
    const isLate = task?.deadline && new Date(assignment.submittedAt) > new Date(task.deadline);
    return isLate ? 'late_submitted' : 'on_time';
  }
  
  if (task?.deadline && new Date() > new Date(task.deadline)) return 'overdue';
  return assignment.status === 'pending' ? 'in_progress' : assignment.status; 
};