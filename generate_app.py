import os

files = {
    "src/data/mockData.js": """
export const initialTasks = [
  { id: '1', title: 'Write a 150-word essay: My Dream Job', type: 'Writing', description: 'Write an essay about your dream job.', sourceUrl: '', sourceNote: '', deadline: new Date(Date.now() + 86400000).toISOString(), maxScore: 10, createdAt: new Date().toISOString(), assignedStudentIds: ['s1', 's2', 's3', 's4', 's5'] },
  { id: '2', title: 'Unit 5 Vocabulary Quiz', type: 'Quiz', description: 'Complete the vocabulary quiz for Unit 5.', sourceUrl: '', sourceNote: 'Prepare using page 42.', deadline: new Date(Date.now() + 172800000).toISOString(), maxScore: 20, createdAt: new Date().toISOString(), assignedStudentIds: ['s1', 's2', 's3', 's4', 's5'] },
];

export const initialStudents = [
  { id: 's1', name: 'Aziza Karimova' },
  { id: 's2', name: 'Bekzod Tursunov' },
  { id: 's3', name: 'Malika Yusupova' },
  { id: 's4', name: 'Jasur Rahimov' },
  { id: 's5', name: 'Dilnoza Aliyeva' }
];

export const initialAssignments = [
  { id: 'a1', taskId: '1', studentId: 's1', status: 'submitted', firstSeenAt: new Date(Date.now() - 3600000).toISOString(), submittedAt: new Date(Date.now() - 1800000).toISOString(), reviewedAt: null, score: null, teacherFeedback: '', submission: { textAnswer: 'I want to be a software engineer.', linkUrl: '', fileName: '', createdAt: new Date(Date.now() - 1800000).toISOString() } },
];
""",
    "src/utils/dates.js": """
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
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip())

print("Files generated.")
