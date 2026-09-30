import SectionHeader from '../components/SectionHeader'
import { ArrowDown, ArrowRight } from 'lucide-react'

function ArchNode({ label, sublabel, accent = false, color = 'border-surface-400' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 text-center min-w-[120px] ${
        accent
          ? 'bg-cyan-500/10 border-cyan-500/40'
          : 'bg-surface-700 border-surface-500'
      }`}
    >
      <span className={`text-xs font-semibold ${accent ? 'text-cyan-300' : 'text-editor-text'}`}>
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-editor-muted mt-0.5 font-mono">{sublabel}</span>
      )}
    </div>
  )
}

function ArrowConnector({ label }) {
  return (
    <div className="flex flex-col items-center gap-1 my-1">
      <ArrowDown size={16} className="text-surface-400" />
      {label && (
        <span className="text-[10px] text-editor-muted font-mono">{label}</span>
      )}
    </div>
  )
}

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="py-24 bg-surface-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="System Design"
          title="Platform Architecture Preview"
          subtitle="A high-level view of how CodeCollab's components interconnect. These integrations form the planned production architecture."
          centered
        />

        <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
          {/* Main architecture flow */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {/* Users row */}
            <div className="flex items-center gap-4 mb-1">
              <ArchNode label="Teacher" sublabel="Instructor" />
              <ArrowRight size={14} className="text-surface-400" />
              <ArchNode label="Students" sublabel="Learners" />
            </div>

            <ArrowConnector label="WebSocket / HTTP" />

            <ArchNode label="CodeCollab Classroom" sublabel="Session Management" accent />

            <ArrowConnector />

            <ArchNode label="Collaborative Editor" sublabel="Monaco Editor" />

            <ArrowConnector />

            <div className="rounded-xl border border-surface-500 bg-surface-700 px-5 py-3 text-center">
              <p className="text-[10px] font-mono text-editor-muted mb-1 uppercase tracking-widest">Real-Time Layer</p>
              <div className="flex items-center gap-2 justify-center">
                <span className="tag">Socket.IO</span>
                <span className="text-editor-muted text-xs">/</span>
                <span className="tag">Yjs</span>
              </div>
            </div>

            <ArrowConnector />

            <div className="rounded-xl border border-surface-500 bg-surface-700 px-5 py-3 text-center">
              <p className="text-[10px] font-mono text-editor-muted mb-1 uppercase tracking-widest">Backend</p>
              <div className="flex items-center gap-2 justify-center">
                <span className="tag">Node.js</span>
                <span className="text-editor-muted text-xs">+</span>
                <span className="tag">Express</span>
              </div>
            </div>

            <ArrowConnector />

            {/* Bottom services grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {[
                { label: 'AI Tutor', sublabel: 'LLM API', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400' },
                { label: 'Code Execution', sublabel: 'Judge0', color: 'border-amber-500/40 bg-amber-500/5 text-amber-400' },
                { label: 'MongoDB', sublabel: 'Atlas Database', color: 'border-blue-200 bg-blue-50 text-blue-700' },
                { label: 'Learning Data', sublabel: 'Progress Store', color: 'border-sky-500/40 bg-sky-500/5 text-sky-400' },
              ].map((node) => (
                <div
                  key={node.label}
                  className={`rounded-xl border px-3 py-2.5 text-center ${node.color.split(' ').slice(0, 2).join(' ')}`}
                >
                  <p className={`text-xs font-semibold ${node.color.split(' ')[2]}`}>{node.label}</p>
                  <p className="text-[10px] text-editor-muted font-mono mt-0.5">{node.sublabel}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Communication layer */}
          <div className="flex flex-col gap-3 items-center lg:pt-20">
            <div className="rounded-xl border border-surface-500 bg-surface-700 px-5 py-4 text-center">
              <p className="text-[10px] font-mono text-editor-muted mb-2 uppercase tracking-widest">Communication</p>
              <div className="flex flex-col gap-2 items-center">
                <ArchNode label="Video & Audio" sublabel="WebRTC / LiveKit" />
                <div className="w-px h-4 bg-surface-400" />
                <ArchNode label="Real-Time Chat" sublabel="Socket.IO" />
              </div>
            </div>

            {/* Auth */}
            <div className="rounded-xl border border-surface-500 bg-surface-700 px-5 py-3 text-center">
              <p className="text-[10px] font-mono text-editor-muted mb-1 uppercase tracking-widest">Auth</p>
              <div className="flex items-center gap-2 justify-center">
                <span className="tag">JWT</span>
                <span className="text-editor-muted text-xs">/</span>
                <span className="tag">OAuth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-700 border border-surface-500 text-xs text-editor-muted font-mono">
            <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" />
            Planned Production Architecture — Not Yet Implemented
          </span>
        </div>
      </div>
    </section>
  )
}
