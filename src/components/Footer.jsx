import { Code2, Github } from 'lucide-react'

const techPills = ['React', 'Node.js', 'Express', 'MongoDB']

export default function Footer() {
  return (
    <footer className="border-t border-surface-600 bg-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Code2 size={14} className="text-cyan-400" />
              </div>
              <span className="text-base font-bold text-editor-text">CodeCollab</span>
            </div>
            <p className="text-sm text-editor-muted max-w-xs">
              Collaborative coding for remote STEM education.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {techPills.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs rounded-md bg-surface-600 text-editor-muted border border-surface-400 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Center links */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-editor-muted mb-1">Platform</p>
            {['Overview', 'Features', 'Architecture', 'Roadmap', 'Tech Stack'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-editor-muted hover:text-editor-text transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Badge */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="px-4 py-3 rounded-xl bg-surface-700 border border-surface-500 text-center md:text-right">
              <p className="text-xs text-editor-muted mb-1 font-mono uppercase tracking-wide">Built for</p>
              <p className="text-sm font-bold text-editor-text">HackConquest 2026</p>
            </div>
            <p className="text-xs text-surface-400 font-mono">© 2026 CodeCollab. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
