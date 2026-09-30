import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

export default function TeacherClassroomPage() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadClassroom() {
      setLoading(true);
      setError('');

      try {
        const [classroomResponse, studentsResponse] = await Promise.all([
          api.getClassroomDetails(id),
          api.getClassroomStudents(id),
        ]);

        if (!isActive) {
          return;
        }

        setClassroom(classroomResponse.classroom);
        setStudents(Array.isArray(studentsResponse.students) ? studentsResponse.students : []);
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message || 'Something went wrong. Please try again.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadClassroom();

    return () => {
      isActive = false;
    };
  }, [id]);

  const handleCopy = async () => {
    if (!classroom?.roomCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(classroom.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_error) {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {loading ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Loading classroom...</p>
            </section>
          ) : error ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-red-600">{error}</p>
            </section>
          ) : classroom ? (
            <>
              <section className="bg-white border border-slate-200 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-slate-900">{classroom.name}</h1>
                <p className="text-sm text-slate-600 mt-2">Subject: {classroom.subject}</p>
                {classroom.description && <p className="text-sm text-slate-700 mt-3">{classroom.description}</p>}

                <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-600">ROOM CODE</p>
                    <p className="text-lg font-semibold text-slate-900 tracking-wide mt-1">{classroom.roomCode}</p>
                  </div>
                  <button type="button" className="btn-secondary" onClick={handleCopy}>
                    {copied ? 'Copied' : 'Copy Code'}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-4">Created: {new Date(classroom.createdAt).toLocaleString()}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link to={`/classroom/${classroom.id}/workspace`} className="btn-primary">
                    Open Workspace
                  </Link>
                  <Link to={`/teacher/classroom/${classroom.id}/progress`} className="btn-secondary">
                    View Progress
                  </Link>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900">Students ({students.length})</h2>

                {students.length === 0 ? (
                  <p className="text-sm text-slate-600 mt-3">No students have joined this classroom yet.</p>
                ) : (
                  <ol className="mt-4 space-y-3">
                    {students.map((student, index) => (
                      <li key={student.id} className="border border-slate-200 rounded-md px-3 py-3 bg-slate-50">
                        <p className="text-sm font-medium text-slate-900">{index + 1}. {student.name}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{student.email}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
