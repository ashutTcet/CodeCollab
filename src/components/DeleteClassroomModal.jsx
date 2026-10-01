import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function DeleteClassroomModal({
  isOpen,
  classroom,
  onClose,
  onSuccess,
}) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const targetName = classroom?.name || '';
  const isMatch = confirmationInput.trim() === targetName.trim();

  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      setError('');
      setSubmitting(false);
    }
  }, [isOpen, classroom]);

  if (!isOpen || !classroom) {
    return null;
  }

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isMatch || submitting) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.deleteClassroom(classroom.id || classroom._id);
      if (onSuccess) {
        onSuccess(classroom.id || classroom._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete classroom. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 overflow-hidden transition-all text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-classroom-title"
      >
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="delete-classroom-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Delete this classroom?
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will permanently delete the classroom and its associated workspace/data. Students will lose access to this classroom.
            </p>
          </div>
        </div>

        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          <div>
            <label htmlFor="confirm-classroom-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To confirm, type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{targetName}</span>:
            </label>
            <input
              id="confirm-classroom-name"
              type="text"
              value={confirmationInput}
              onChange={(e) => {
                setConfirmationInput(e.target.value);
                setError('');
              }}
              placeholder={targetName}
              disabled={submitting}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatch || submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Classroom</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
