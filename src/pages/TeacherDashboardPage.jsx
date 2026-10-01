import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import CreateClassroomModal from '../components/CreateClassroomModal';
import DeleteClassroomModal from '../components/DeleteClassroomModal';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TeacherDashboardPage() {
  const { user, logout } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadDashboardData() {
      setLoading(true);
      setLoadError('');

      try {
        const response = await api.getTeacherClassrooms();

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

  const totalStudents = useMemo(() => {
    return classrooms.reduce((sum, classroom) => sum + Number(classroom.studentCount || 0), 0);
  }, [classrooms]);

  const recentActivity = useMemo(() => {
    return [...classrooms]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4)
      .map((classroom) => ({
        id: classroom.id,
        message: `Updated classroom ${classroom.name}`,
        timestamp: classroom.updatedAt || classroom.createdAt,
      }));
  }, [classrooms]);

  const handleCreateClassroom = async (payload) => {
    const response = await api.createClassroom(payload);
    const classroom = response.classroom;
    setClassrooms((prev) => [classroom, ...prev]);
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 1500);
    } catch (_error) {
      setCopiedCode('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div id="teacher-dashboard" className="max-w-7xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label !text-brand-700">Teacher Dashboard</p>
                <h1 className="text-2xl font-bold text-slate-900">{getGreeting()}, {user?.name}</h1>
                <p className="text-sm text-slate-600 mt-2">Manage classrooms and open collaborative workspaces.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>Create Classroom</button>
                <button type="button" onClick={logout} className="btn-secondary">Logout</button>
              </div>
            </div>
            {loadError && <p className="text-sm text-red-600 mt-4">{loadError}</p>}
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <article className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Classrooms</p>
              <p className="text-2xl font-semibold text-slate-900 mt-2">{classrooms.length}</p>
            </article>
            <article className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Students</p>
              <p className="text-2xl font-semibold text-slate-900 mt-2">{totalStudents}</p>
            </article>
            <article className="bg-white border border-slate-200 rounded-lg p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Quick Action</p>
              <button type="button" className="btn-secondary mt-3" onClick={() => setShowCreateModal(true)}>
                Create Classroom
              </button>
            </article>
          </section>

          <section id="classrooms" className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">My Classrooms</h2>
              <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(true)}>Create Classroom</button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600 mt-4">Loading classrooms...</p>
            ) : classrooms.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm text-slate-600">No classrooms created yet.</p>
                <button type="button" className="btn-secondary mt-3" onClick={() => setShowCreateModal(true)}>
                  Create Classroom
                </button>
              </div>
            ) : (
              <ul className="mt-4 grid md:grid-cols-2 gap-3">
                {classrooms.map((classroom) => (
                  <li key={classroom.id} className="border border-slate-200 rounded-md p-4 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">{classroom.name}</p>
                    <p className="text-xs text-slate-600 mt-1">Subject: {classroom.subject}</p>
                    <p className="text-xs text-slate-600">Room: {classroom.roomCode}</p>
                    <p className="text-xs text-slate-600">Students: {classroom.studentCount}</p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn-secondary" onClick={() => handleCopyCode(classroom.roomCode)}>
                          {copiedCode === classroom.roomCode ? 'Copied' : 'Copy Code'}
                        </button>
                        <Link to={`/teacher/classroom/${classroom.id}`} className="btn-secondary">Open Classroom</Link>
                        <Link to={`/classroom/${classroom.id}/workspace`} className="btn-primary">Open Workspace</Link>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeletingClassroom(classroom)}
                        className="p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 transition-colors"
                        title="Delete Classroom"
                        aria-label={`Delete ${classroom.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
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

      <CreateClassroomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateClassroom}
      />

      <DeleteClassroomModal
        isOpen={Boolean(deletingClassroom)}
        classroom={deletingClassroom}
        onClose={() => setDeletingClassroom(null)}
        onSuccess={(deletedId) => {
          setClassrooms((prev) => prev.filter((c) => (c.id || c._id) !== deletedId));
          setDeletingClassroom(null);
        }}
      />

      <Footer />
    </div>
  );
}
