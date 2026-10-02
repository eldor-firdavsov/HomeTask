import os

files = {
    "src/index.css": """
@import "tailwindcss";

@theme {
  --color-primary: #6259D9;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-background: #F8F9FB;
  --color-surface: #FFFFFF;
  --color-text-primary: #20232B;
  --color-text-secondary: #747986;
  --color-border: #E7E9EF;
}

body {
    background-color: var(--color-background);
    color: var(--color-text-primary);
    font-family: 'Inter', sans-serif;
    margin: 0;
}
""",
    "src/main.jsx": """
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
""",
    "src/App.jsx": """
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import TeacherDashboard from './pages/teacher/Dashboard';
import TaskLibrary from './pages/teacher/TaskLibrary';
import CreateTask from './pages/teacher/CreateTask';
import StudentDetail from './pages/teacher/StudentDetail';
import SubmissionReview from './pages/teacher/SubmissionReview';
import StudentTasks from './pages/student/Tasks';
import StudentTaskDetail from './pages/student/TaskDetail';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            {/* Teacher Routes */}
            <Route path="teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="teacher/tasks" element={<TaskLibrary />} />
            <Route path="teacher/tasks/new" element={<CreateTask />} />
            <Route path="teacher/students/:studentId" element={<StudentDetail />} />
            <Route path="teacher/submissions/:submissionId" element={<SubmissionReview />} />
            
            {/* Student Routes */}
            <Route path="student/tasks" element={<StudentTasks />} />
            <Route path="student/tasks/:assignmentId" element={<StudentTaskDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
""",
    "src/context/DataContext.jsx": """
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialData } from '../data/mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('homework_app_data');
    return saved ? JSON.parse(saved) : initialData;
  });
  
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('homework_app_session');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('homework_app_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('homework_app_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('homework_app_session');
    }
  }, [session]);

  const login = (role, user) => setSession({ role, user });
  const logout = () => setSession(null);

  return (
    <DataContext.Provider value={{ data, setData, session, login, logout }}>
      {children}
    </DataContext.Provider>
  );
};
""",
    "src/data/mockData.js": """
export const initialData = {
  users: [
    { id: 't1', firstName: 'Admin', lastName: 'Teacher', email: 'teacher@example.com', role: 'TEACHER' },
    { id: 's1', firstName: 'Ahmadjon', lastName: 'Karimov', email: 'student@example.com', role: 'STUDENT' },
    { id: 's2', firstName: 'Ali', lastName: 'Rahimov', email: 'ali@example.com', role: 'STUDENT' }
  ],
  templates: [
    { id: 'tpl1', teacherId: 't1', title: 'Write an Essay', type: 'WRITING', instructions: 'Write 300 words about AI.', submissionTypes: ['Text'], createdAt: new Date().toISOString() }
  ],
  assignments: [
    { id: 'a1', templateId: 'tpl1', teacherId: 't1', studentId: 's1', title: 'Write an Essay', type: 'WRITING', deadline: new Date(Date.now() + 86400000).toISOString(), status: 'PENDING' }
  ],
  submissions: []
};
""",
    "src/components/layout/Layout.jsx": """
import React from 'react';
import { Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export default function Layout() {
  const { session, logout } = useData();
  const navigate = useNavigate();

  if (!session) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8F9FB]">
      <aside className="w-64 bg-white border-r border-[#E7E9EF] p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8 text-[#6259D9]">HW Manager</h1>
        <nav className="flex-1 space-y-2">
          {session.role === 'TEACHER' ? (
            <>
              <Link to="/teacher/dashboard" className="block p-2 rounded hover:bg-gray-50">Dashboard</Link>
              <Link to="/teacher/tasks" className="block p-2 rounded hover:bg-gray-50">Tasks</Link>
              <Link to="/teacher/tasks/new" className="block p-2 rounded hover:bg-gray-50">Add Task</Link>
            </>
          ) : (
            <Link to="/student/tasks" className="block p-2 rounded hover:bg-gray-50">My Tasks</Link>
          )}
        </nav>
        <button onClick={handleLogout} className="mt-auto p-2 text-red-500 hover:bg-red-50 rounded">Logout</button>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
""",
    "src/pages/auth/Login.jsx": """
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export default function Login() {
  const { login, data } = useData();
  const navigate = useNavigate();

  const handleLogin = (email) => {
    const user = data.users.find(u => u.email === email);
    if (user) {
      login(user.role, user);
      navigate(user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/tasks');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E7E9EF] w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Demo Login</h2>
        <div className="space-y-4">
          <button onClick={() => handleLogin('teacher@example.com')} className="w-full bg-[#6259D9] text-white p-3 rounded-lg hover:bg-opacity-90 transition">
            Login as Teacher
          </button>
          <button onClick={() => handleLogin('student@example.com')} className="w-full bg-gray-100 text-gray-800 p-3 rounded-lg hover:bg-gray-200 transition">
            Login as Student
          </button>
        </div>
      </div>
    </div>
  );
}
""",
    "src/pages/teacher/Dashboard.jsx": """
import React from 'react';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data } = useData();
  const students = data.users.filter(u => u.role === 'STUDENT');

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/teacher/tasks/new" className="bg-[#6259D9] text-white px-4 py-2 rounded-lg">New Task</Link>
      </div>
      <h2 className="text-xl font-semibold mb-4">Students</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(student => {
            const studentAssignments = data.assignments.filter(a => a.studentId === student.id);
            const pending = studentAssignments.filter(a => a.status === 'PENDING').length;
            return (
              <Link key={student.id} to={`/teacher/students/${student.id}`} className="block bg-white p-6 rounded-xl border border-[#E7E9EF] hover:border-[#6259D9] transition shadow-sm">
                <h3 className="font-semibold text-lg">{student.firstName} {student.lastName}</h3>
                <p className="text-gray-500 text-sm mb-4">{student.email}</p>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending: {pending}</span>
                </div>
              </Link>
            )
        })}
      </div>
    </div>
  );
}
""",
    "src/pages/teacher/TaskLibrary.jsx": """
import React from 'react';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

export default function TaskLibrary() {
  const { data } = useData();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Link to="/teacher/tasks/new" className="bg-[#6259D9] text-white px-4 py-2 rounded-lg">New Task</Link>
      </div>
      <div className="bg-white rounded-xl border border-[#E7E9EF] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-[#E7E9EF]">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Title</th>
              <th className="p-4 font-semibold text-gray-600">Type</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.templates.map(tpl => (
              <tr key={tpl.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium">{tpl.title}</td>
                <td className="p-4 text-gray-500 text-sm">{tpl.type}</td>
                <td className="p-4">
                  <Link to={`/teacher/tasks/${tpl.id}`} className="text-[#6259D9] hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
""",
    "src/pages/teacher/CreateTask.jsx": """
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export default function CreateTask() {
  const { data, setData, session } = useData();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('WRITING');
  const [instructions, setInstructions] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const newTemplate = {
      id: `tpl_${Date.now()}`,
      teacherId: session.user.id,
      title,
      type,
      instructions,
      submissionTypes: ['Text'],
      createdAt: new Date().toISOString()
    };
    setData({ ...data, templates: [...data.templates, newTemplate] });
    navigate('/teacher/tasks');
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Task</h1>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-[#E7E9EF] space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Task Title</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:border-[#6259D9] focus:ring-1 focus:ring-[#6259D9] outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Task Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 rounded p-2 focus:border-[#6259D9] outline-none">
            <option value="WRITING">Writing</option>
            <option value="READING">Reading</option>
            <option value="GRAMMAR">Grammar</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <textarea required value={instructions} onChange={e => setInstructions(e.target.value)} rows="5" className="w-full border border-gray-300 rounded p-2 focus:border-[#6259D9] outline-none"></textarea>
        </div>
        <div className="pt-4 flex justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-[#6259D9] text-white rounded hover:bg-opacity-90">Save to Library</button>
        </div>
      </form>
    </div>
  );
}
""",
    "src/pages/teacher/StudentDetail.jsx": """
import React from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export default function StudentDetail() {
  const { studentId } = useParams();
  const { data } = useData();
  const student = data.users.find(u => u.id === studentId);
  const assignments = data.assignments.filter(a => a.studentId === studentId);

  if (!student) return <div>Student not found</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{student.firstName} {student.lastName}</h1>
        <p className="text-gray-500">{student.email}</p>
      </div>
      <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
      <div className="space-y-4">
        {assignments.map(assignment => (
          <div key={assignment.id} className="bg-white p-4 rounded-xl border border-[#E7E9EF] flex justify-between items-center">
            <div>
              <h3 className="font-medium">{assignment.title}</h3>
              <p className="text-sm text-gray-500">{assignment.type} • Status: {assignment.status}</p>
            </div>
            <button className="text-[#6259D9] text-sm font-medium hover:underline">View</button>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-gray-500 italic">No tasks assigned yet.</p>}
      </div>
    </div>
  );
}
""",
    "src/pages/teacher/SubmissionReview.jsx": "export default function SubmissionReview() { return <div>Submission Review</div>; }",
    "src/pages/student/Tasks.jsx": """
import React from 'react';
import { useData } from '../../context/DataContext';
import { Link } from 'react-router-dom';

export default function Tasks() {
  const { data, session } = useData();
  const assignments = data.assignments.filter(a => a.studentId === session.user.id);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Tasks</h1>
      <div className="grid gap-4">
        {assignments.map(assignment => (
          <div key={assignment.id} className="bg-white p-6 rounded-xl border border-[#E7E9EF] flex justify-between items-center shadow-sm">
            <div>
              <h3 className="font-semibold text-lg">{assignment.title}</h3>
              <p className="text-sm text-gray-500 mb-1">{assignment.type}</p>
              <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{assignment.status}</span>
            </div>
            <Link to={`/student/tasks/${assignment.id}`} className="bg-[#6259D9] text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90">
              Open Task
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
""",
    "src/pages/student/TaskDetail.jsx": """
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

export default function TaskDetail() {
  const { assignmentId } = useParams();
  const { data, setData, session } = useData();
  const navigate = useNavigate();
  
  const assignment = data.assignments.find(a => a.id === assignmentId);
  const [content, setContent] = useState('');

  if (!assignment) return <div>Task not found</div>;

  const handleSubmit = () => {
    const newSubmission = {
      id: `sub_${Date.now()}`,
      assignedTaskId: assignmentId,
      studentId: session.user.id,
      content,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString()
    };

    const updatedAssignments = data.assignments.map(a => 
      a.id === assignmentId ? { ...a, status: 'SUBMITTED' } : a
    );

    setData({
      ...data,
      submissions: [...data.submissions, newSubmission],
      assignments: updatedAssignments
    });
    
    navigate('/student/tasks');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
      <div className="flex gap-2 mb-8">
        <span className="px-2 py-1 bg-gray-100 text-sm rounded">{assignment.type}</span>
        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">{assignment.status}</span>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#E7E9EF] mb-6">
        <h2 className="font-semibold mb-2">Instructions</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
      </div>

      {assignment.status !== 'SUBMITTED' && assignment.status !== 'DONE' && (
        <div className="bg-white p-6 rounded-xl border border-[#E7E9EF]">
          <h2 className="font-semibold mb-4">Your Submission</h2>
          <textarea 
            rows="8" 
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full border border-gray-300 rounded p-3 focus:border-[#6259D9] outline-none mb-4"
            placeholder="Type your answer here..."
          ></textarea>
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">Save Draft</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-[#6259D9] text-white rounded hover:bg-opacity-90">Submit Task</button>
          </div>
        </div>
      )}
    </div>
  );
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\\n")

print("Frontend scaffolded successfully")
