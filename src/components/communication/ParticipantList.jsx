function statusBadgeClass(status) {
  if (status === 'in-call') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (status === 'online') {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }

  return 'bg-slate-100 text-slate-600 border-slate-200';
}

export default function ParticipantList({ participants, currentUserId }) {
  if (!participants || participants.length === 0) {
    return <p className="text-sm text-slate-600 px-3 py-4">No participants online yet.</p>;
  }

  return (
    <ul className="space-y-2 px-3 py-3 overflow-y-auto min-h-0">
      {participants.map((participant) => {
        const isMine = participant.userId === currentUserId;
        return (
          <li key={participant.userId} className="rounded-md border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 truncate">
                {participant.name} {isMine ? '(You)' : ''}
              </p>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">{participant.role}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className={`inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadgeClass(participant.status)}`}>
                {participant.status}
              </span>
              <span className="text-[11px] text-slate-500">
                Sockets: {participant.connectedSockets || 1}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
