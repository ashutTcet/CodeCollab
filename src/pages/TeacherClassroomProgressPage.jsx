import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

function formatDate(value) {
  if (!value) {
    return 'No activity yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No activity yet';
  }

  return date.toLocaleString();
}

function formatDuration(minutes) {
  const totalMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0 && mins === 0) {
    return '0m';
  }
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
}

export default function TeacherClassroomProgressPage() {
  const { id: classroomId, studentId } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentProgress, setStudentProgress] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadProgress() {
      setLoading(true);
      setError('');

      try {
        if (studentId) {
          const response = await api.getClassroomStudentProgress(classroomId, studentId);
          if (!isActive) {
            return;
          }

          setClassroom(response.classroom || null);
          setStudentProgress(response.progress || null);
          setStudents(response.student ? [response.student] : []);
          setRecentSubmissions(Array.isArray(response.recentSubmissions) ? response.recentSubmissions : []);
        } else {
          const response = await api.getClassroomProgress(classroomId);
          if (!isActive) {
            return;
          }

          setClassroom(response.classroom || null);
          setStudents(Array.isArray(response.students) ? response.students : []);
          setStudentProgress(null);
          setRecentSubmissions([]);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message || 'Unable to load classroom progress.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      isActive = false;
    };
  }, [classroomId, studentId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-label !text-brand-700">Classroom Progress</p>
              <h1 className="text-2xl font-bold text-slate-900">{classroom?.name || 'Classroom Progress'}</h1>
              <p className="text-sm text-slate-600 mt-2">Subject: {classroom?.subject || 'Unknown'}</p>
            </div>
            <Link to={`/teacher/classroom/${classroomId}`} className="btn-secondary">
              Back to Classroom
            </Link>
          </section>

          {loading ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Loading progress...</p>
            </section>
          ) : error ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-red-600">{error}</p>
            </section>
          ) : studentId && studentProgress ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Student</p>
                <h2 className="text-xl font-semibold text-slate-900 mt-1">{students[0]?.name || 'Student'}</h2>
                <p className="text-sm text-slate-600">{students[0]?.email || ''}</p>
              </div>

              {!studentProgress.hasActivity ? (
                <p className="text-sm text-slate-600">No activity yet</p>
              ) : (
                <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Problems Attempted</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.problemsAttempted}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Problems Solved</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.problemsSolved}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Submissions</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.submissions}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Accepted</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.acceptedSubmissions}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Compilation Errors</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.compilationErrors}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Runtime Errors</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.runtimeErrors}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Coding Sessions</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{studentProgress.codingSessions}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Coding Time</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900">{formatDuration(studentProgress.codingTimeMinutes)}</dd>
                  </div>
                </dl>
              )}

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Last Active</p>
                <p className="text-sm text-slate-900 mt-1">{formatDate(studentProgress.lastActiveAt)}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Recent Activity</p>
                {recentSubmissions.length === 0 ? (
                  <p className="text-sm text-slate-600 mt-2">No submissions yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {recentSubmissions.map((submission) => (
                      <li key={submission.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{submission.statusLabel}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(submission.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900">Students</h2>
              {students.length === 0 ? (
                <p className="text-sm text-slate-600 mt-3">No enrolled students yet.</p>
              ) : (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-4">Student</th>
                        <th className="py-2 pr-4">Attempts</th>
                        <th className="py-2 pr-4">Solved</th>
                        <th className="py-2 pr-4">Accepted</th>
                        <th className="py-2 pr-4">Last Active</th>
                        <th className="py-2 pr-4">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(({ student, progress }) => (
                        <tr key={student.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-slate-900">{student.name}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </td>
                          <td className="py-3 pr-4">{progress.submissions}</td>
                          <td className="py-3 pr-4">{progress.problemsSolved}</td>
                          <td className="py-3 pr-4">{progress.acceptedSubmissions}</td>
                          <td className="py-3 pr-4">{formatDate(progress.lastActiveAt)}</td>
                          <td className="py-3 pr-4">
                            <Link to={`/teacher/classroom/${classroomId}/progress/${student.id}`} className="text-brand-700 hover:underline">
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
