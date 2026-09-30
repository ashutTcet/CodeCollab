import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { SUPPORTED_CLASSROOM_SUBJECTS } from '../lib/classroomLanguages';
import { useEffect } from 'react';

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

function ProgressCard({ progress, isSelected, onSelect }) {
  const hasActivity = Boolean(progress?.hasActivity);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg border px-4 py-4 transition-colors ${
        isSelected ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{progress.language}</h3>
        <span className="text-xs text-slate-500 uppercase tracking-wider">{hasActivity ? 'Active' : 'Idle'}</span>
      </div>

      {!hasActivity ? (
        <p className="mt-3 text-sm text-slate-600">No activity yet</p>
      ) : (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Problems Solved</dt>
            <dd className="font-semibold text-slate-900">{progress.problemsSolved}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Attempts</dt>
            <dd className="font-semibold text-slate-900">{progress.submissions}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Accepted</dt>
            <dd className="font-semibold text-slate-900">{progress.acceptedSubmissions}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wide">Last Active</dt>
            <dd className="font-semibold text-slate-900">{formatDate(progress.lastActiveAt)}</dd>
          </div>
        </dl>
      )}
    </button>
  );
}

export default function ProgressPage() {
  const { user } = useAuth();
  const [progressRows, setProgressRows] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  useEffect(() => {
    let isActive = true;

    async function loadProgress() {
      setLoading(true);
      setLoadError('');

      try {
        const response = await api.getMyProgress();
        if (!isActive) {
          return;
        }

        setProgressRows(Array.isArray(response.progress) ? response.progress : []);
        setRecentSubmissions(Array.isArray(response.recentSubmissions) ? response.recentSubmissions : []);
      } catch (error) {
        if (isActive) {
          setLoadError(error.message || 'Unable to load progress right now.');
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
  }, []);

  const filteredRows = useMemo(() => {
    if (selectedLanguage === 'All') {
      return progressRows;
    }

    return progressRows.filter((row) => row.language === selectedLanguage);
  }, [progressRows, selectedLanguage]);

  const activeDetail = filteredRows[0] || null;
  const filteredSubmissions = useMemo(() => {
    if (selectedLanguage === 'All') {
      return recentSubmissions;
    }

    return recentSubmissions.filter((submission) => submission.language === selectedLanguage);
  }, [recentSubmissions, selectedLanguage]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-6">
            <p className="section-label !text-brand-700">Student Progress</p>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Progress</h1>
                <p className="text-sm text-slate-600 mt-2">Language-specific activity from your real classroom sessions and code runs.</p>
              </div>
              <div className="min-w-48">
                <label htmlFor="progress-filter" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Filter
                </label>
                <select
                  id="progress-filter"
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="All">All</option>
                  {SUPPORTED_CLASSROOM_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {loadError && <p className="text-sm text-red-600 mt-4">{loadError}</p>}
          </section>

          {loading ? (
            <section className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600">Loading progress...</p>
            </section>
          ) : (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
              <section className="space-y-3">
                {filteredRows.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <p className="text-sm text-slate-600">No activity yet</p>
                  </div>
                ) : (
                  filteredRows.map((progress) => (
                    <ProgressCard
                      key={progress.language}
                      progress={progress}
                      isSelected={activeDetail?.language === progress.language}
                      onSelect={() => setSelectedLanguage(progress.language)}
                    />
                  ))
                )}
              </section>

              <aside className="bg-white border border-slate-200 rounded-lg p-6 min-h-0">
                {activeDetail ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Language</p>
                      <h2 className="text-xl font-semibold text-slate-900 mt-1">{activeDetail.language}</h2>
                    </div>

                    {!activeDetail.hasActivity ? (
                      <p className="text-sm text-slate-600">No activity yet</p>
                    ) : (
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Problems Attempted</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.problemsAttempted}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Problems Solved</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.problemsSolved}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Submissions</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.submissions}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Accepted</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.acceptedSubmissions}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Compilation Errors</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.compilationErrors}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Runtime Errors</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.runtimeErrors}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Coding Sessions</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{activeDetail.codingSessions}</dd>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Coding Time</dt>
                          <dd className="mt-1 text-lg font-semibold text-slate-900">{formatDuration(activeDetail.codingTimeMinutes)}</dd>
                        </div>
                      </dl>
                    )}

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Last Active</p>
                      <p className="text-sm text-slate-900 mt-1">{formatDate(activeDetail.lastActiveAt)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Recent Activity</p>
                      {filteredSubmissions.length === 0 ? (
                        <p className="text-sm text-slate-600 mt-2">No submissions yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {filteredSubmissions.map((submission) => (
                            <li key={submission.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-sm font-medium text-slate-900">{submission.statusLabel}</p>
                              <p className="text-xs text-slate-500 mt-1">{formatDate(submission.createdAt)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No activity yet</p>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
