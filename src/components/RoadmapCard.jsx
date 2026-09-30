import { CheckCircle2, Circle } from 'lucide-react'

export default function RoadmapCard({ phase, title, status, items }) {
  const isComplete = status === 'complete'

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 transition-all duration-200 group ${
        isComplete
          ? 'border-cyan-500/40 bg-cyan-500/5'
          : 'border-surface-500 bg-surface-700 hover:border-surface-400'
      }`}
    >
      {/* Status indicator */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs font-mono font-semibold uppercase tracking-widest ${
            isComplete ? 'text-cyan-400' : 'text-editor-muted'
          }`}
        >
          {phase}
        </span>
        <span
          className={`badge text-xs ${
            isComplete
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'bg-surface-600 text-editor-muted border border-surface-400'
          }`}
        >
          {isComplete ? 'Complete' : 'Planned'}
        </span>
      </div>

      <h3 className="text-base font-semibold text-editor-text mb-4">{title}</h3>

      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {item.done ? (
              <CheckCircle2 size={15} className="text-cyan-400 mt-0.5 shrink-0" />
            ) : (
              <Circle size={15} className="text-surface-400 mt-0.5 shrink-0" />
            )}
            <span className={item.done ? 'text-editor-text' : 'text-editor-muted'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {isComplete && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-sm bg-cyan-500" />
      )}
    </div>
  )
}
