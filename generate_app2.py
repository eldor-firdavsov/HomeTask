import os

files = {
    "src/App.jsx": """
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DemoSelection from './components/layout/DemoSelection';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherTasks from './components/teacher/TeacherTasks';
import TeacherTaskDetail from './components/teacher/TeacherTaskDetail';
import StudentTasks from './components/student/StudentTasks';
import StudentTaskDetail from './components/student/StudentTaskDetail';
import { useAppState } from './hooks/useAppState';

function App() {
  const { initDemoData } = useAppState();

  useEffect(() => {
    initDemoData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DemoSelection />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/*" element={<AppShell role="teacher" />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="tasks" element={<TeacherTasks />} />
          <Route path="tasks/:id" element={<TeacherTaskDetail />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student/*" element={<AppShell role="student" />}>
          <Route path="tasks" element={<StudentTasks />} />
          <Route path="tasks/:id" element={<StudentTaskDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
""",
    "src/main.jsx": """
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
""",
    "src/hooks/useLocalStorage.js": """
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return saved;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
""",
    "src/hooks/useAppState.js": """
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
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip())

print("App setup generated.")
