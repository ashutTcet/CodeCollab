import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const [loadError, setLoadError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    activeCodingSessions: [],
    recentProjects: [],
    learningProgress: null,
    recentActivity: [],
    recommendedPractice: null,
  });

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const response = await api.getStudentDashboard();
        const placeholders = response?.dashboard?.placeholders || {};
        if (isActive) {
          setDashboardData({
            activeCodingSessions: Array.isArray(placeholders.activeCodingSessions) ? placeholders.activeCodingSessions : [],
            recentProjects: Array.isArray(placeholders.recentProjects) ? placeholders.recentProjects : [],
            learningProgress: placeholders.learningProgress && Object.keys(placeholders.learningProgress).length > 0 ? placeholders.learningProgress : null,
            recentActivity: Array.isArray(placeholders.recentActivity) ? placeholders.recentActivity : [],
            recommendedPractice: placeholders.recommendedPractice || null,
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
        <div id="student-dashboard" className="max-w-7xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label !text-brand-700">Student Dashboard</p>
                <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
                <p className="text-sm text-slate-600 mt-2">Continue where you left off.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn-primary">Join Session</button>
                <button type="button" className="btn-secondary">Create Project</button>
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
              <h2 className="text-lg font-semibold text-slate-900">Active Coding Sessions</h2>
              {dashboardData.activeCodingSessions.length === 0 ? (
                <div className="mt-3">
                  <p className="text-sm text-slate-600">No active coding sessions</p>
                  <button type="button" className="btn-secondary mt-3">Join a Session</button>
                </div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {dashboardData.activeCodingSessions.map((session, index) => (
                    <li key={session.id || index} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                      {session.name || session.title || 'Session'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div id="recent-projects" className="bg-white border border-slate-200 rounded-lg p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
              {dashboardData.recentProjects.length === 0 ? (
                <div className="mt-3">
                  <p className="text-sm text-slate-600">No projects yet</p>
                  <button type="button" className="btn-secondary mt-3">Create Project</button>
                </div>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {dashboardData.recentProjects.map((project, index) => (
                    <li key={project.id || index} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                      {project.name || project.title || 'Project'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div id="learning-progress" className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900">Learning Progress</h2>
              {dashboardData.learningProgress ? (
                <pre className="mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto">
                  {JSON.stringify(dashboardData.learningProgress, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-slate-600 mt-3">No progress data yet</p>
              )}
            </div>
          </section>

          {dashboardData.recommendedPractice && (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900">Recommended Practice</h2>
              <pre className="mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto">
                {JSON.stringify(dashboardData.recommendedPractice, null, 2)}
              </pre>
            </section>
          )}

          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            {dashboardData.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-600 mt-3">No recent activity</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {dashboardData.recentActivity.map((activity, index) => (
                  <li key={activity.id || index} className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
                    {activity.title || activity.description || 'Activity'}
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
