import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import JoinClassroomModal from '../components/JoinClassroomModal';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadDashboardData() {
      setLoading(true);
      setLoadError('');

      try {
        const response = await api.getStudentClassrooms();

        if (!isActive) {
          return;
        }

        setClassrooms(Array.isArray(response.classrooms) ? response.classrooms : []);
      } catch (error) {
        if (isActive) {
          setLoadError(error.message || 'Unable to load your classrooms right now.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isActive = false;
    };
  }, []);

  const recentActivity = useMemo(() => {
    return [...classrooms]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4)
      .map((classroom) => ({
        id: classroom.id,
        message: `Opened or updated classroom ${classroom.name}`,
        timestamp: classroom.updatedAt || classroom.createdAt,
      }));
  }, [classrooms]);

  const handleJoinClassroom = async (payload) => {
    const response = await api.joinClassroom(payload);
    const joinedClassroom = response.classroom;

    setClassrooms((prev) => {
      const exists = prev.some((classroom) => classroom.id === joinedClassroom.id);
      if (exists) {
        return prev;
      }
      return [joinedClassroom, ...prev];
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div id="student-dashboard" className="max-w-7xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label !text-brand-700">Student Dashboard</p>
                <h1 className="text-2xl font-bold text-slate-900">{getGreeting()}, {user?.name}</h1>
                <p className="text-sm text-slate-600 mt-2">Open your classrooms and collaborate in shared workspaces.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary" onClick={() => setShowJoinModal(true)}>Join Classroom</button>
                <button type="button" onClick={logout} className="btn-secondary">Logout</button>
              </div>
            </div>
            {loadError && <p className="text-sm text-red-600 mt-4">{loadError}</p>}
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <article className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Joined Classrooms</p>
              <p className="text-2xl font-semibold text-slate-900 mt-2">{classrooms.length}</p>
            </article>
            <article className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
              <Link to="/progress" className="btn-secondary mt-3 inline-flex">
                View Progress
              </Link>
            </article>
            <article className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Workspace Access</p>
              <p className="text-sm text-slate-700 mt-2">Open any classroom and start collaborative coding.</p>
            </article>
          </section>

          <section id="classrooms" className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">My Classrooms</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/progress" className="btn-secondary">View Progress</Link>
                <button type="button" className="btn-secondary" onClick={() => setShowJoinModal(true)}>Join Classroom</button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600 mt-4">Loading classrooms...</p>
            ) : classrooms.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm text-slate-600">You haven&apos;t joined any classrooms yet.</p>
                <button type="button" className="btn-secondary mt-3" onClick={() => setShowJoinModal(true)}>
                  Join Classroom
                </button>
              </div>
            ) : (
              <ul className="mt-4 grid md:grid-cols-2 gap-3">
                {classrooms.map((classroom) => (
                  <li key={classroom.id} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">{classroom.name}</p>
                    <p className="text-xs text-slate-600 mt-1">Subject: {classroom.subject}</p>
                    <p className="text-xs text-slate-600">Teacher: {classroom.teacher?.name || 'Not available'}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link to={`/student/classroom/${classroom.id}`} className="btn-secondary">Open Classroom</Link>
                      <Link to={`/classroom/${classroom.id}/workspace`} className="btn-primary">Open Workspace</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="activity" className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-600 mt-3">Your recent activity will appear here.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="border border-slate-200 rounded-md p-3 bg-slate-50">
                    <p className="text-sm text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <JoinClassroomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinClassroom}
      />

      <Footer />
    </div>
  );
}
