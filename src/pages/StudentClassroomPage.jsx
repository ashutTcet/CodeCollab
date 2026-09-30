import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

export default function StudentClassroomPage() {
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadClassroom() {
      setLoading(true);
      setError('');

      try {
        const response = await api.getClassroomDetails(id);

        if (isActive) {
          setClassroom(response.classroom);
        }
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Loading classroom...</p>
            </section>
          ) : error ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-red-600">{error}</p>
            </section>
          ) : classroom ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6" id="student-classroom">
              <h1 className="text-2xl font-bold text-slate-900">{classroom.name}</h1>
              <p className="text-sm text-slate-600 mt-2">Subject: {classroom.subject}</p>
              {classroom.description && <p className="text-sm text-slate-700 mt-3">{classroom.description}</p>}

              <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                  <dt className="text-slate-600">Teacher</dt>
                  <dd className="text-slate-900 font-medium mt-1">{classroom.teacher?.name || 'Not available'}</dd>
                </div>
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                  <dt className="text-slate-600">Number of students</dt>
                  <dd className="text-slate-900 font-medium mt-1">{classroom.studentCount}</dd>
                </div>
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                  <dt className="text-slate-600">Joined date</dt>
                  <dd className="text-slate-900 font-medium mt-1">{new Date(classroom.updatedAt).toLocaleDateString()}</dd>
                </div>
                <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                  <dt className="text-slate-600">Room code</dt>
                  <dd className="text-slate-900 font-medium mt-1 tracking-wide">{classroom.roomCode}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <Link to={`/classroom/${classroom.id}/workspace`} className="btn-primary">
                  Open Classroom
                </Link>
                <p className="text-xs text-slate-500 mt-2">Join the shared workspace and collaborate in real time.</p>
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
