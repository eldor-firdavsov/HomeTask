import os

files = {
    "src/components/layout/DemoSelection.jsx": """
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { BookOpen } from 'lucide-react';

export default function DemoSelection() {
  const navigate = useNavigate();
  const { setRole } = useAppState();

  const handleSelect = (r) => {
    setRole(r);
    navigate(r === 'teacher' ? '/teacher/dashboard' : '/student/tasks');
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <BookOpen size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <h1 style={{ marginBottom: '0.5rem' }}>ClassFlow</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>English Class Task Tracker</p>
        
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Frontend prototype<br/>Data is stored locally
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => handleSelect('teacher')}>
            Teacher Demo
          </button>
          <button className="btn btn-glass" onClick={() => handleSelect('student')}>
            Student Demo
          </button>
        </div>
      </div>
    </div>
  );
}
""",
    "src/components/layout/AppShell.jsx": """
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { LayoutDashboard, ClipboardList, Users, Settings, User } from 'lucide-react';

export default function AppShell({ role }) {
  const navigate = useNavigate();
  const { currentStudentId, setCurrentStudentId, students, setRole } = useAppState();

  const switchDemo = (e) => {
    const val = e.target.value;
    if (val === 'teacher') {
      setRole('teacher');
      navigate('/teacher/dashboard');
    } else {
      setRole('student');
      setCurrentStudentId(val);
      navigate('/student/tasks');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Desktop */}
      <div className="sidebar glass" style={{ margin: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>CF</div>
          ClassFlow
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {role === 'teacher' ? (
            <>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/teacher/dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/teacher/tasks')}><ClipboardList size={18} /> Tasks</button>
            </>
          ) : (
            <>
              <button className="btn btn-glass" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/student/tasks')}><ClipboardList size={18} /> Tasks</button>
            </>
          )}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Demo Mode · {role === 'teacher' ? 'Teacher' : 'Student'}
          </div>
          <select 
            className="btn btn-glass" 
            style={{ width: '100%', appearance: 'none' }}
            value={role === 'teacher' ? 'teacher' : currentStudentId}
            onChange={switchDemo}
          >
            <option value="teacher">Teacher - Ms. Nilufar</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>Student - {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
""",
    "src/components/teacher/TeacherDashboard.jsx": """
import React from 'react';
import { useAppState } from '../../hooks/useAppState';

export default function TeacherDashboard() {
  const { tasks, assignments } = useAppState();

  const pendingReviews = assignments.filter(a => a.status === 'submitted').length;
  const overdue = assignments.filter(a => a.status === 'overdue').length;

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Good morning, Ms. Nilufar</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Here's what is happening in your class today.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Active Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{tasks.length}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Pending Reviews</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{pendingReviews}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Overdue</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>{overdue}</div>
        </div>
      </div>
    </div>
  );
}
""",
    "src/components/teacher/TeacherTasks.jsx": """
import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function TeacherTasks() {
  const { tasks } = useAppState();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Tasks</h1>
          <p style={{ color: 'var(--muted)' }}>Manage assignments and deadlines</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Task</th>
              <th style={{ padding: '1rem' }}>Type</th>
              <th style={{ padding: '1rem' }}>Deadline</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{t.title}</td>
                <td style={{ padding: '1rem' }}><span className="badge badge-unseen">{t.type}</span></td>
                <td style={{ padding: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{new Date(t.deadline).toLocaleString()}</td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn btn-glass" onClick={() => navigate(`/teacher/tasks/${t.id}`)}>View</button>
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
    "src/components/teacher/TeacherTaskDetail.jsx": """
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { ArrowLeft } from 'lucide-react';

export default function TeacherTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, assignments, students, setAssignments } = useAppState();

  const task = tasks.find(t => t.id === id);
  const taskAssignments = assignments.filter(a => a.taskId === id);

  if (!task) return <div>Task not found</div>;

  const handleReview = (assignmentId, score, feedback) => {
    setAssignments(assignments.map(a => 
      a.id === assignmentId 
        ? { ...a, status: 'reviewed', score, teacherFeedback: feedback, reviewedAt: new Date().toISOString() } 
        : a
    ));
  };

  return (
    <div className="animate-fade-in">
      <button className="btn btn-glass" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/teacher/tasks')}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{task.title}</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-unseen">{task.type}</span>
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Due: {new Date(task.deadline).toLocaleString()}</span>
        </div>
        <p style={{ marginTop: '1rem' }}>{task.description}</p>
      </div>

      <h2>Submissions</h2>
      <div className="glass" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Student</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {taskAssignments.map(a => {
              const student = students.find(s => s.id === a.studentId);
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{student?.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {a.status === 'submitted' && (
                      <button className="btn btn-primary" onClick={() => handleReview(a.id, task.maxScore, 'Good job!')}>Quick Review ({task.maxScore}/{task.maxScore})</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
""",
    "src/components/student/StudentTasks.jsx": """
import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigate } from 'react-router-dom';

export default function StudentTasks() {
  const { currentStudentId, tasks, assignments, students } = useAppState();
  const navigate = useNavigate();
  const student = students.find(s => s.id === currentStudentId);

  const studentAssignments = assignments.filter(a => a.studentId === currentStudentId);
  const getTask = (taskId) => tasks.find(t => t.id === taskId);

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Good morning, {student?.name.split(' ')[0]}</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Ready to make progress today?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {studentAssignments.map(a => {
          const task = getTask(a.taskId);
          if (!task) return null;
          return (
            <div key={a.id} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/student/tasks/${task.id}`)}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-unseen">{task.type}</span>
                  <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{task.title}</h3>
                <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Due: {new Date(task.deadline).toLocaleString()}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
""",
    "src/components/student/StudentTaskDetail.jsx": """
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { ArrowLeft } from 'lucide-react';

export default function StudentTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, assignments, currentStudentId, setAssignments } = useAppState();

  const [answer, setAnswer] = useState('');

  const task = tasks.find(t => t.id === id);
  const assignment = assignments.find(a => a.taskId === id && a.studentId === currentStudentId);

  if (!task || !assignment) return <div>Task not found</div>;

  const handleSubmit = () => {
    setAssignments(assignments.map(a => 
      a.id === assignment.id 
        ? { 
            ...a, 
            status: 'submitted', 
            submittedAt: new Date().toISOString(),
            submission: { textAnswer: answer, linkUrl: '', fileName: '', createdAt: new Date().toISOString() }
          } 
        : a
    ));
    navigate('/student/tasks');
  };

  return (
    <div className="animate-fade-in">
      <button className="btn btn-glass" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/student/tasks')}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span className="badge badge-unseen">{task.type}</span>
              <span className={`badge badge-${assignment.status}`}>{assignment.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        <p style={{ marginTop: '1.5rem', lineHeight: '1.6' }}>{task.description}</p>
      </div>

      {assignment.status !== 'submitted' && assignment.status !== 'reviewed' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Submit your work</h3>
          <textarea 
            style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text)', marginBottom: '1rem', fontFamily: 'inherit' }}
            placeholder="Write your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSubmit}>Submit Work</button>
        </div>
      )}

      {assignment.status === 'reviewed' && (
        <div className="glass" style={{ padding: '2rem', background: 'var(--surface-hover)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Feedback</h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Score: {assignment.score} / {task.maxScore}</div>
          <p style={{ fontStyle: 'italic' }}>"{assignment.teacherFeedback}"</p>
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
        f.write(content.strip())

print("Components generated.")
