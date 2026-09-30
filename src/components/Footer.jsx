import { Code2 } from 'lucide-react'

const techPills = ['React', 'Node.js', 'Express', 'MongoDB']

export default function Footer() {
  return (
    <footer className="border-t border-surface-500 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Code2 size={14} className="text-brand-700" />
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
                  className="px-2 py-0.5 text-xs rounded-md bg-surface-600 text-editor-muted border border-surface-500 font-mono"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Center links */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-editor-muted mb-1">Platform</p>
            {[
              { label: 'Overview', href: '#overview' },
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Platform', href: '#showcase' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-editor-muted hover:text-editor-text transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Product */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="px-4 py-3 rounded-lg bg-surface-600 border border-surface-500 text-center md:text-right">
              <p className="text-xs text-editor-muted mb-1 font-mono uppercase tracking-wide">Product</p>
              <p className="text-sm font-semibold text-editor-text">Remote Classroom Coding Platform</p>
            </div>
            <p className="text-xs text-editor-muted font-mono">© 2026 CodeCollab. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
