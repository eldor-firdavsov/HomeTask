import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useData, useToast } from '../../context/DataContext';
import {
  BookOpen, Sparkles, Award, Clock,
  Search, Trash2, Send, ChevronRight, X
} from 'lucide-react';
import {
  getReadingTests,
  getTeacherReadingAssignments,
  getTeacherReadingSubmissions,
  deleteReadingTest,
  assignReadingTest
} from '../../lib/supabase/readingTests';
import { getBandColor, getBandLabel } from '../../lib/supabase/aiGrading';
import ActionMenu from '../../components/common/ActionMenu';

export default function ReadingTests() {
  const { profile, data, setData, refreshData } = useData();
  const toast = useToast();

  const [tests, setTests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'submissions'

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Assign Modal
  const [assignModalTest, setAssignModalTest] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assignDeadline, setAssignDeadline] = useState('');
  const [assigning, setAssigning] = useState(false);

  const students = useMemo(() => {
    return (data?.users || []).filter(u => u.role === 'STUDENT');
  }, [data]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tList, aList, sList] = await Promise.all([
        getReadingTests().catch(err => { console.warn('Could not load tests:', err); return []; }),
        getTeacherReadingAssignments().catch(err => { console.warn('Could not load assignments:', err); return []; }),
        getTeacherReadingSubmissions().catch(err => { console.warn('Could not load submissions:', err); return []; }),
      ]);
      setTests(tList);
      setAssignments(aList);
      setSubmissions(sList);
    } catch (err) {
      console.error('Error loading reading tests data:', err);
      toast('Failed to load reading tests', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Stats
  const totalTests = tests.length;
  const totalAssigned = assignments.length;
  const totalCompleted = submissions.length;
  const avgBand = useMemo(() => {
    const bands = submissions.filter(s => s.bandScore != null).map(s => Number(s.bandScore));
    if (bands.length === 0) return null;
    const sum = bands.reduce((a, b) => a + b, 0);
    return (sum / bands.length).toFixed(1);
  }, [submissions]);

  // Handle delete test
  const handleDeleteTest = async (testId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteReadingTest(testId);
      setTests(prev => prev.filter(t => t.id !== testId));
      if (setData) {
        setData(prev => ({
          ...prev,
          assignments: (prev.assignments || []).filter(a => a.readingTestId !== testId),
        }));
      }
      toast('Test deleted successfully');
      if (refreshData) await refreshData();
    } catch (err) {
      console.error('Failed to delete test:', err);
      toast('Failed to delete test', 'error');
    }
  };

  // Handle Quick Assign
  const handleAssignSubmit = async () => {
    if (!assignModalTest) return;
    if (selectedStudentIds.length === 0) {
      toast('Please select at least one student', 'error');
      return;
    }
    setAssigning(true);
    try {
      await assignReadingTest({
        readingTestId: assignModalTest.id,
        teacherId: profile.id,
        studentIds: selectedStudentIds,
        deadline: assignDeadline || null,
      });
      toast(`Assigned "${assignModalTest.title}" to ${selectedStudentIds.length} student(s)!`);
      setAssignModalTest(null);
      setSelectedStudentIds([]);
      setAssignDeadline('');
      loadData();
    } catch (err) {
      toast(err.message || 'Failed to assign test', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // Filtered tests
  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return tests;
    const q = searchQuery.toLowerCase();
    return tests.filter(t => t.title.toLowerCase().includes(q));
  }, [tests, searchQuery]);

  // Filtered submissions with enriched info
  const enrichedSubmissions = useMemo(() => {
    const studentMap = new Map((data?.users || []).map(u => [u.id, u]));
    const testMap = new Map(tests.map(t => [t.id, t]));
    const assignMap = new Map(assignments.map(a => [a.id, a]));

    return submissions.map(sub => {
      const student = studentMap.get(sub.studentId);
      const assignment = assignMap.get(sub.assignmentId);
      const test = assignment ? testMap.get(assignment.readingTestId) : null;

      return {
        ...sub,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        studentEmail: student?.email || '',
        testTitle: test?.title || 'IELTS Reading Test',
      };
    }).filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.testTitle.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q)
      );
    });
  }, [submissions, data, tests, assignments, searchQuery]);

  return (
    <div className="g-page">
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 26, flexWrap: 'wrap', gap: 14
      }}>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: '#fff',
              boxShadow: '0 2px 6px rgba(36, 74, 58, 0.25)'
            }}>
              <BookOpen size={20} strokeWidth={2.2} />
            </span>
            IELTS Academic Reading Tests
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Author AI-parsed IELTS reading exams, assign to students, and monitor instant band evaluations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to="/teacher/reading-tests/new"
            className="g-btn g-btn-primary"
            style={{
              fontSize: 13.5, gap: 8, padding: '10px 18px',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            <Sparkles size={16} /> Create Test with AI
          </Link>
        </div>
      </div>

      {/* ── Stats Overview ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 28
      }}>
        <div className="glass-1" style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', borderTop: '3px solid var(--color-primary)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Test Templates
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginTop: 4 }}>
            {totalTests}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Ready to assign
          </div>
        </div>

        <div className="glass-1" style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', borderTop: '3px solid var(--color-info)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Assignments
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-info)', marginTop: 4 }}>
            {totalAssigned}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Assigned to learners
          </div>
        </div>

        <div className="glass-1" style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', borderTop: '3px solid var(--color-success)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Exams Completed
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>
            {totalCompleted}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Graded with AI
          </div>
        </div>

        <div className="glass-1" style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', borderTop: '3px solid var(--color-accent)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Average Band Score
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: avgBand ? getBandColor(Number(avgBand)) : 'var(--color-text)', marginTop: 4 }}>
            {avgBand ? `Band ${avgBand}` : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {avgBand ? getBandLabel(Number(avgBand)) : 'No submissions yet'}
          </div>
        </div>
      </div>

      {/* ── Tabs & Search Bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 18, flexWrap: 'wrap', gap: 12
      }}>
        {/* Tab Buttons */}
        <div style={{
          display: 'inline-flex', padding: 4, background: 'rgba(0,0,0,0.04)',
          borderRadius: 'var(--r-md)', gap: 4
        }}>
          <button
            onClick={() => setActiveTab('tests')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--r-sm)', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'tests' ? '#ffffff' : 'transparent',
              color: activeTab === 'tests' ? 'var(--txt-primary)' : 'var(--txt-secondary)',
              boxShadow: activeTab === 'tests' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            📚 Test Templates ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--r-sm)', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'submissions' ? '#ffffff' : 'transparent',
              color: activeTab === 'submissions' ? 'var(--txt-primary)' : 'var(--txt-secondary)',
              boxShadow: activeTab === 'submissions' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            🎯 Student Results & AI Band Scores ({submissions.length})
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={15} color="var(--txt-secondary)" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'tests' ? 'Search tests...' : 'Search student or test...'}
            className="g-input"
            style={{ width: '100%', paddingLeft: 34, fontSize: 13 }}
          />
        </div>
      </div>

      {/* ── Tab Content ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--txt-secondary)' }}>
          <div className="g-spin" style={{ display: 'inline-block', marginBottom: 12 }}>
            <Sparkles size={28} color="var(--color-primary, #244A3A)" />
          </div>
          <div>Loading IELTS reading tests...</div>
        </div>
      ) : activeTab === 'tests' ? (
        /* Tests Grid */
        filteredTests.length === 0 ? (
          <div className="glass-1" style={{
            padding: '50px 20px', borderRadius: 'var(--radius-xl, 18px)', textAlign: 'center',
            border: '1px dashed var(--color-border-strong, #C5CFC5)'
          }}>
            <BookOpen size={40} color="var(--color-primary, #244A3A)" style={{ opacity: 0.7, marginBottom: 12 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--txt-primary)' }}>
              No IELTS Reading Tests Yet
            </h3>
            <p style={{ fontSize: 13, color: 'var(--txt-secondary)', maxWidth: 420, margin: '0 auto 20px' }}>
              Create your first test by pasting HTML from Cambridge IELTS or your reading test materials. Gemini AI will automatically extract passages and 40 questions!
            </p>
            <Link
              to="/teacher/reading-tests/new"
              className="g-btn"
              style={{
                fontSize: 13, gap: 8, padding: '10px 20px',
                background: 'var(--color-primary, #244A3A)',
                color: '#fff', textDecoration: 'none', fontWeight: 600,
                borderRadius: 'var(--radius-sm, 6px)', display: 'inline-flex', alignItems: 'center',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <Sparkles size={15} /> Create Test with AI
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}>
            {filteredTests.map(test => {
              const testAssignments = assignments.filter(a => a.readingTestId === test.id);
              const testSubmissions = submissions.filter(s => {
                const a = assignments.find(item => item.id === s.assignmentId);
                return a?.readingTestId === test.id;
              });

              return (
                <div
                  key={test.id}
                  className="glass-1"
                  style={{
                    borderRadius: 'var(--r-xl)', padding: '22px 24px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, lineHeight: 1.3 }}>
                        {test.title}
                      </h3>
                      <ActionMenu
                        align="right"
                        ariaLabel="Test actions"
                        items={[
                          {
                            label: 'Preview / Take Exam',
                            icon: BookOpen,
                            onClick: () => window.open('/student/reading/demo', '_blank'),
                          },
                          {
                            label: 'Delete Reading Test',
                            icon: Trash2,
                            danger: true,
                            onClick: () => handleDeleteTest(test.id, test.title),
                          },
                        ]}
                      />
                    </div>

                    {/* Metadata pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      <span style={{
                        fontSize: 12, padding: '4px 9px', borderRadius: 6,
                        background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <BookOpen size={13} /> {test.passages?.length || 0} Passages
                      </span>
                      <span style={{
                        fontSize: 12, padding: '4px 9px', borderRadius: 6,
                        background: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        🎯 {test.totalQuestions || 40} Questions
                      </span>
                      <span style={{
                        fontSize: 12, padding: '4px 9px', borderRadius: 6,
                        background: 'rgba(0,0,0,0.05)', color: 'var(--txt-secondary)', fontWeight: 500,
                        display: 'inline-flex', alignItems: 'center', gap: 5
                      }}>
                        <Clock size={13} /> {test.timeLimitMins || 60} mins
                      </span>
                    </div>

                    {/* Assignment status */}
                    <div style={{
                      padding: '10px 14px', borderRadius: 'var(--r-md)',
                      background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)',
                      fontSize: 12, color: 'var(--txt-secondary)', marginBottom: 18,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>Assigned to <strong>{testAssignments.length}</strong> students</span>
                      <span style={{ color: testSubmissions.length > 0 ? '#10b981' : 'inherit', fontWeight: 600 }}>
                        {testSubmissions.length} completed
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setAssignModalTest(test);
                        setSelectedStudentIds([]);
                      }}
                      className="g-btn g-btn-primary"
                      style={{
                        flex: 1, fontSize: 12.5, gap: 6, padding: '9px 12px',
                        justifyContent: 'center', fontWeight: 600
                      }}
                    >
                      <Send size={13} /> Assign to Students
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Submissions Table */
        enrichedSubmissions.length === 0 ? (
          <div className="glass-1" style={{
            padding: '50px 20px', borderRadius: 'var(--radius-xl)', textAlign: 'center',
            border: '1px dashed var(--color-border)'
          }}>
            <Award size={40} color="#10b981" style={{ opacity: 0.6, marginBottom: 12 }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--txt-primary)' }}>
              No Student Submissions Yet
            </h3>
            <p style={{ fontSize: 13, color: 'var(--txt-secondary)', maxWidth: 420, margin: '0 auto' }}>
              When students complete an assigned IELTS reading exam, AI will automatically grade it and their band score and breakdown will appear here.
            </p>
          </div>
        ) : (
          <div className="glass-1" style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{
                    background: 'rgba(0,0,0,0.02)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    color: 'var(--txt-secondary)', fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>
                    <th style={{ padding: '14px 20px' }}>Student</th>
                    <th style={{ padding: '14px 16px' }}>Test Title</th>
                    <th style={{ padding: '14px 16px' }}>Date</th>
                    <th style={{ padding: '14px 16px' }}>Time Taken</th>
                    <th style={{ padding: '14px 16px' }}>Score</th>
                    <th style={{ padding: '14px 16px' }}>Band Score</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedSubmissions.map(sub => {
                    const band = sub.bandScore != null ? Number(sub.bandScore) : null;
                    const bandColor = band ? getBandColor(band) : 'var(--color-primary, #244A3A)';
                    const bandLabel = band ? getBandLabel(band) : '';
                    const mins = sub.timeSpentSecs ? Math.round(sub.timeSpentSecs / 60) : '—';

                    return (
                      <tr
                        key={sub.id}
                        style={{
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-soft, #E6EEE8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>
                            {sub.studentName}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--txt-secondary)' }}>
                            {sub.studentEmail}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--txt-primary)' }}>
                          {sub.testTitle}
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--txt-secondary)', fontSize: 12.5 }}>
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--txt-secondary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} /> {mins} min{mins !== 1 ? 's' : ''}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>
                            {sub.correctCount != null ? sub.correctCount : '—'}
                          </span>
                          <span style={{ color: 'var(--txt-secondary)', fontSize: 12 }}>
                            /{sub.totalQuestions || 40} ({sub.percentage || 0}%)
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {band != null ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '4px 10px', borderRadius: 999,
                              background: `${bandColor}18`, color: bandColor,
                              fontWeight: 700, fontSize: 12.5
                            }}>
                              <Award size={13} /> Band {band.toFixed(1)} · {bandLabel}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--txt-secondary)' }}>Grading...</span>
                          )}
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <Link
                            to={`/teacher/reading-submissions/${sub.id}`}
                            className="g-btn g-btn-secondary"
                            style={{
                              fontSize: 12, padding: '6px 12px', gap: 5,
                              textDecoration: 'none', display: 'inline-flex', alignItems: 'center'
                            }}
                          >
                            Review <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Quick Assign Modal ── */}
      {assignModalTest && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="glass-1" style={{
            borderRadius: 'var(--r-xl)', padding: '28px 30px',
            maxWidth: 580, width: '100%', maxHeight: '85vh', overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--txt-primary)' }}>
                  Assign Reading Test to Students
                </h2>
                <div style={{ fontSize: 13, color: 'var(--color-primary, #244A3A)', fontWeight: 600, marginTop: 4 }}>
                  {assignModalTest.title}
                </div>
              </div>
              <button onClick={() => setAssignModalTest(null)} className="g-btn g-btn-ghost" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Deadline */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                Deadline (Optional)
              </label>
              <input
                type="datetime-local"
                value={assignDeadline}
                onChange={e => setAssignDeadline(e.target.value)}
                className="g-input"
                style={{ width: '100%', fontSize: 13, padding: '10px 12px' }}
              />
            </div>

            {/* Student Selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Students ({selectedStudentIds.length} selected)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds(students.map(s => s.id))}
                    className="g-btn g-btn-ghost"
                    style={{ fontSize: 11.5, padding: '2px 8px' }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="g-btn g-btn-ghost"
                    style={{ fontSize: 11.5, padding: '2px 8px' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div style={{
                maxHeight: 240, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 'var(--r-md)', padding: 6, display: 'flex', flexDirection: 'column', gap: 4
              }}>
                {students.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--txt-secondary)', fontSize: 12.5 }}>
                    No students registered yet
                  </div>
                ) : (
                  students.map(student => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => {
                          setSelectedStudentIds(prev =>
                            isSelected ? prev.filter(id => id !== student.id) : [...prev, student.id]
                          );
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          background: isSelected ? 'var(--color-primary-soft)' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-primary)' }}>
                              {student.firstName} {student.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--txt-secondary)' }}>
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setAssignModalTest(null)}
                disabled={assigning}
                className="g-btn g-btn-ghost"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={assigning || selectedStudentIds.length === 0}
                className="g-btn g-btn-primary"
                style={{
                  fontSize: 13, gap: 6, padding: '10px 18px',
                  fontWeight: 600,
                  opacity: (assigning || selectedStudentIds.length === 0) ? 0.6 : 1,
                }}
              >
                <Send size={14} /> {assigning ? 'Assigning...' : `Assign to ${selectedStudentIds.length} Student(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
