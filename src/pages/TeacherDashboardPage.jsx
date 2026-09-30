import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function TeacherDashboardPage() {
  const { user, logout } = useAuth();
  const [loadError, setLoadError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    activeClassrooms: [],
    recentCodingSessions: [],
    studentStatistics: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const response = await api.getTeacherDashboard();
        const placeholders = response?.dashboard?.placeholders || {};

        if (isActive) {
          setDashboardData({
            activeClassrooms: Array.isArray(placeholders.activeClassrooms) ? placeholders.activeClassrooms : [],
            recentCodingSessions: Array.isArray(placeholders.recentCodingSessions) ? placeholders.recentCodingSessions : [],
            studentStatistics: placeholders.studentStatistics && Object.keys(placeholders.studentStatistics).length > 0 ? placeholders.studentStatistics : null,
          });
        }
      } catch (error) {
        if (isActive) {
          setLoadError(error.message || 'Could not load dashboard data');
        }
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div id="teacher-dashboard" className="max-w-7xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label !text-brand-700">Teacher Dashboard</p>
                <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
                <p className="text-sm text-slate-600 mt-2">Manage classrooms and coding sessions.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary">Create Classroom</button>
                <button type="button" className="btn-secondary">Start Coding Session</button>
                <button type="button" onClick={logout} className="btn-secondary">Logout</button>
              </div>
            </div>
            {loadError && <p className="text-sm text-red-600 mt-4">{loadError}</p>}
          </section>

          <section className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="font-medium">Full Name</dt>
                  <dd>{user?.name}</dd>
                </div>
                <div>
                  <dt className="font-medium">Email</dt>
                  <dd>{user?.email}</dd>
                </div>
                <div>
                  <dt className="font-medium">Role</dt>
                  <dd className="capitalize">{user?.role}</dd>
                </div>
              </dl>
            </div>

            <div id="active-sessions" className="bg-white border border-slate-200 rounded-lg p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Active Sessions</h2>
              {dashboardData.recentCodingSessions.length === 0 ? (
                <p className="text-sm text-slate-600 mt-3">No sessions yet</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {dashboardData.recentCodingSessions.map((session, index) => (
                    <li key={session.id || index} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                      {session.name || session.title || 'Session'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div id="classrooms" className="bg-white border border-slate-200 rounded-lg p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Classrooms</h2>
              {dashboardData.activeClassrooms.length === 0 ? (
                <p className="text-sm text-slate-600 mt-3">No classrooms yet</p>
              ) : (
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  {dashboardData.activeClassrooms.map((classroom, index) => (
                    <li key={classroom.id || index} className="border border-slate-200 rounded-md p-3 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{classroom.name || 'Classroom'}</p>
                        <p className="text-xs text-slate-600">Students: {typeof classroom.studentCount === 'number' ? classroom.studentCount : 'Not available'}</p>
                        <p className="text-xs text-slate-600">Status: {classroom.status || 'Unknown'}</p>
                      </div>
                      <button type="button" className="btn-secondary">Open</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div id="students" className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900">Students</h2>
              {dashboardData.studentStatistics ? (
                <pre className="mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto">
                  {JSON.stringify(dashboardData.studentStatistics, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-slate-600 mt-3">No student statistics available</p>
              )}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Sessions</h2>
            {dashboardData.recentCodingSessions.length === 0 ? (
              <p className="text-sm text-slate-600 mt-3">No sessions yet</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {dashboardData.recentCodingSessions.map((session, index) => (
                  <li key={session.id || `recent-${index}`} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                    {session.name || session.title || 'Session'}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
