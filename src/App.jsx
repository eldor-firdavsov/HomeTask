import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingScreen from './components/common/LoadingScreen';
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
import ReadingTests from './pages/teacher/ReadingTests';
import CreateReadingTest from './pages/teacher/CreateReadingTest';
import ReadingSubmissionReview from './pages/teacher/ReadingSubmissionReview';
import StudentReadingExam from './pages/student/StudentReadingExam';
import StudentReadingResult from './pages/student/StudentReadingResult';

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
  // Allow teachers to also preview student interfaces & exam environments
  if (session.role !== 'STUDENT' && session.role !== 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  return children;
}

/* ── App Routes ───────────────────────────────── */
function AppRoutes() {
  const { session, loading } = useData();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Root route: defaults to student login when unauthenticated */}
      <Route path="/" element={
        session
          ? <Navigate to={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />
          : <Navigate to="/student/login" replace />
      } />

      {/* Auth routes */}
      <Route path="/teacher/login" element={
        session?.role === 'TEACHER'
          ? <Navigate to="/teacher/dashboard" replace />
          : <TeacherLogin />
      } />
      <Route path="/student/login" element={
        session?.role === 'STUDENT'
          ? <Navigate to="/student/dashboard" replace />
          : <StudentLogin />
      } />
      <Route path="/teacher/forgot-password" element={<ForgotPassword role="teacher" />} />
      <Route path="/student/forgot-password" element={<ForgotPassword role="student" />} />

      {/* Fallback login route */}
      <Route path="/login" element={
        session?.role === 'TEACHER'
          ? <Navigate to="/teacher/dashboard" replace />
          : session?.role === 'STUDENT'
            ? <Navigate to="/student/dashboard" replace />
            : <Navigate to="/student/login" replace />
      } />

      {/* Fullscreen IELTS CD Exam (standalone simulation without sidebar) */}
      <Route path="/student/reading/:assignmentId" element={
        <StudentRoute><StudentReadingExam /></StudentRoute>
      } />
      <Route path="/student/reading-exam/:assignmentId" element={
        <StudentRoute><StudentReadingExam /></StudentRoute>
      } />

      {/* Protected routes wrapped in Layout */}
      <Route element={<Layout />}>
        {/* Teacher routes */}
        <Route path="teacher/dashboard" element={
          <TeacherRoute><TeacherDashboard /></TeacherRoute>
        } />
        <Route path="teacher/tasks" element={
          <TeacherRoute><TaskLibrary /></TeacherRoute>
        } />
        <Route path="teacher/tasks/new" element={
          <TeacherRoute><TaskLibrary defaultMode="create" /></TeacherRoute>
        } />
        <Route path="teacher/tasks/:templateId" element={
          <TeacherRoute><TaskDetail /></TeacherRoute>
        } />
        <Route path="teacher/reading-tests" element={
          <TeacherRoute><ReadingTests /></TeacherRoute>
        } />
        <Route path="teacher/reading-tests/new" element={
          <TeacherRoute><CreateReadingTest /></TeacherRoute>
        } />
        <Route path="teacher/reading-submissions/:submissionId" element={
          <TeacherRoute><ReadingSubmissionReview /></TeacherRoute>
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
        <Route path="student/reading-results/:submissionId" element={
          <StudentRoute><StudentReadingResult /></StudentRoute>
        } />
        <Route path="student/pomodoro" element={
          <Navigate to="/student/dashboard" replace />
        } />
      </Route>

      {/* Catch-all unknown routes */}
      <Route path="*" element={
        session
          ? <Navigate to={session.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'} replace />
          : <Navigate to="/student/login" replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </ErrorBoundary>
  );
}

export default App;
