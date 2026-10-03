import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import TeacherLogin from './pages/auth/TeacherLogin';
import StudentLogin from './pages/auth/StudentLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import TeacherDashboard from './pages/teacher/Dashboard';
import TaskLibrary from './pages/teacher/TaskLibrary';
import CreateTask from './pages/teacher/CreateTask';
import StudentDetail from './pages/teacher/StudentDetail';
import SubmissionReview from './pages/teacher/SubmissionReview';
import TaskDetail from './pages/teacher/TaskDetail';
import TeacherSettings from './pages/teacher/Settings';
import StudentDashboard from './pages/student/Dashboard';
import StudentTasks from './pages/student/Tasks';
import StudentTaskDetail from './pages/student/TaskDetail';
import StudentPomodoro from './pages/student/Pomodoro';

/* ── Loading Screen ──────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(99,102,241,0.14)',
        border: '1px solid rgba(99,102,241,0.24)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div style={{ fontSize: 14, color: 'var(--txt-secondary)', fontWeight: 500 }}>
        Loading…
      </div>
    </div>
  );
}

/* ── Route Guards ─────────────────────────────── */
function TeacherRoute({ children }) {
  const { session, loading } = useData();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/teacher/login" replace />;
  if (session.role !== 'TEACHER') return <Navigate to="/student/dashboard" replace />;
  return children;
}

function StudentRoute({ children }) {
  const { session, loading } = useData();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/student/login" replace />;
  if (session.role !== 'STUDENT') return <Navigate to="/teacher/dashboard" replace />;
  return children;
}

/* ── App Routes ───────────────────────────────── */
function AppRoutes() {
  const { session, loading } = useData();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/teacher/login" element={
        session?.role === 'TEACHER'
          ? <Navigate to="/teacher/dashboard" replace />
          : session?.role === 'STUDENT'
            ? <Navigate to="/student/dashboard" replace />
            : <TeacherLogin />
      } />
      <Route path="/student/login" element={
        session?.role === 'STUDENT'
          ? <Navigate to="/student/dashboard" replace />
          : session?.role === 'TEACHER'
            ? <Navigate to="/teacher/dashboard" replace />
            : <StudentLogin />
      } />
      <Route path="/teacher/forgot-password" element={<ForgotPassword role="teacher" />} />
      <Route path="/student/forgot-password" element={<ForgotPassword role="student" />} />

      {/* Login routes */}
      <Route path="/login" element={
        session?.role === 'TEACHER'
          ? <Navigate to="/teacher/dashboard" replace />
          : session?.role === 'STUDENT'
            ? <Navigate to="/student/dashboard" replace />
            : <Login />
      } />

      {/* Teacher routes */}
      <Route path="/" element={<Layout />}>
        <Route path="teacher/dashboard" element={
          <TeacherRoute><TeacherDashboard /></TeacherRoute>
        } />
        <Route path="teacher/tasks" element={
          <TeacherRoute><TaskLibrary /></TeacherRoute>
        } />
        <Route path="teacher/tasks/new" element={
          <TeacherRoute><CreateTask /></TeacherRoute>
        } />
        <Route path="teacher/tasks/:templateId" element={
          <TeacherRoute><TaskDetail /></TeacherRoute>
        } />
        <Route path="teacher/students/:studentId" element={
          <TeacherRoute><StudentDetail /></TeacherRoute>
        } />
        <Route path="teacher/submissions/:submissionId" element={
          <TeacherRoute><SubmissionReview /></TeacherRoute>
        } />
        <Route path="teacher/settings" element={
          <TeacherRoute><TeacherSettings /></TeacherRoute>
        } />

        {/* Student routes */}
        <Route path="student/dashboard" element={
          <StudentRoute><StudentDashboard /></StudentRoute>
        } />
        <Route path="student/tasks" element={
          <StudentRoute><StudentTasks /></StudentRoute>
        } />
        <Route path="student/tasks/:assignmentId" element={
          <StudentRoute><StudentTaskDetail /></StudentRoute>
        } />
        <Route path="student/pomodoro" element={
          <StudentRoute><StudentPomodoro /></StudentRoute>
        } />
      </Route>

      {/* Root redirects */}
      <Route path="/" element={
        session
          ? <Navigate to={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />
          : <Navigate to="/teacher/login" replace />
      } />
      <Route path="*" element={
        session
          ? <Navigate to={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />
          : <Navigate to="/teacher/login" replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
