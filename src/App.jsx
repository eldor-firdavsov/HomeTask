import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import TeacherDashboard from './pages/teacher/Dashboard';
import TaskLibrary from './pages/teacher/TaskLibrary';
import CreateTask from './pages/teacher/CreateTask';
import StudentDetail from './pages/teacher/StudentDetail';
import SubmissionReview from './pages/teacher/SubmissionReview';
import TaskDetail from './pages/teacher/TaskDetail';
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
            <Route path="teacher/tasks/:templateId" element={<TaskDetail />} />
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
