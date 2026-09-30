import { useMemo, useState } from 'react';

export default function JoinClassroomModal({ isOpen, onClose, onJoin }) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => roomCode.trim().length > 0 && !submitting, [roomCode, submitting]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!roomCode.trim()) {
      setError('Room code is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onJoin({ roomCode: roomCode.trim().toUpperCase() });
      setRoomCode('');
      onClose();
    } catch (joinError) {
      setError(joinError.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Join Classroom</h2>
          <p className="text-sm text-slate-600 mt-1">Enter the room code shared by your teacher.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="room-code" className="block text-sm font-medium text-slate-700 mb-1">Classroom Code</label>
            <input
              id="room-code"
              value={roomCode}
              onChange={(event) => {
                setRoomCode(event.target.value.toUpperCase());
                setError('');
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600"
              maxLength={12}
              placeholder="EXAMPLE: DSA7K2"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {submitting ? 'Joining...' : 'Join Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
