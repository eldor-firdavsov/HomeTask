import { useLocalStorage } from './useLocalStorage';
import { initialTasks, initialStudents, initialAssignments } from '../data/mockData';

export function useAppState() {
  const [tasks, setTasks] = useLocalStorage('classflow_tasks', []);
  const [students, setStudents] = useLocalStorage('classflow_students', []);
  const [assignments, setAssignments] = useLocalStorage('classflow_assignments', []);
  const [role, setRole] = useLocalStorage('classflow_role', 'student');
  const [currentStudentId, setCurrentStudentId] = useLocalStorage('classflow_student_id', 's1');

  const initDemoData = () => {
    if (tasks.length === 0) {
      setTasks(initialTasks);
      setStudents(initialStudents);
      setAssignments(initialAssignments);
    }
  };

  const resetDemoData = () => {
    setTasks(initialTasks);
    setStudents(initialStudents);
    setAssignments(initialAssignments);
  };

  return {
    tasks, setTasks,
    students, setStudents,
    assignments, setAssignments,
    role, setRole,
    currentStudentId, setCurrentStudentId,
    initDemoData,
    resetDemoData
  };
}