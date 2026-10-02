export const getDeadlineCategory = (deadlineStr) => {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  if (deadline < now) return 'overdue';
  const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return 'today';
  if (diffDays < 2) return 'tomorrow';
  if (diffDays < 7) return 'next7days';
  return 'later';
};
export const getDeadlineLabel = (deadlineStr) => {
  const cat = getDeadlineCategory(deadlineStr);
  if (cat === 'overdue') return 'Overdue';
  if (cat === 'today') return 'Due today';
  if (cat === 'tomorrow') return 'Due tomorrow';
  return 'Due later';
};