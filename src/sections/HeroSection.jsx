import { ArrowDown, ExternalLink } from 'lucide-react'

const codeSnippet = `// CodeCollab Workspace
const session = await CodeCollab.createSession({
  language: 'python',
  collaborative: true,
  aiTutor: true,
});

// Real-time sync powered by Yjs + Socket.IO
session.on('change', (delta) => {
  editor.applyDelta(delta);
});

// Secure code execution via Judge0
const result = await session.run();`

export default function HeroSection() {
  const scrollToFeatures = (e) => {
    e.preventDefault()
    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })
  }
  const scrollToArchitecture = (e) => {
    e.preventDefault()
    document.querySelector('#architecture')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="overview"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
    >
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Top badge */}
            <div className="flex items-center gap-3">
              <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs">
                🚀 Hackathon Build — HackConquest 2026
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-editor-text leading-[1.1] tracking-tight">
              Collaborative{' '}
              <span className="text-gradient">Coding,</span>
              <br />
              Built for{' '}
              <span className="text-gradient">Learning.</span>
            </h1>

            <p className="text-lg text-editor-muted leading-relaxed max-w-lg">
              CodeCollab brings real-time collaborative coding, communication, AI-powered
              debugging, secure code execution, and personalized learning into one workspace
              built for remote STEM education.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={scrollToFeatures}
                className="btn-primary"
              >
                Explore Platform
                <ArrowDown size={15} />
              </button>
              <button
                onClick={scrollToArchitecture}
                className="btn-secondary"
              >
                View Architecture
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Quick stat pills — only real items, no fake stats */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                'Monaco Editor',
                'Socket.IO',
                'Judge0',
                'LLM Tutor',
                'WebRTC',
              ].map((tech) => (
                <span key={tech} className="tag">{tech}</span>
              ))}
            </div>
          </div>

          {/* Right: Code preview card */}
          <div className="animate-slide-up">
            <div className="rounded-xl border border-editor-border bg-editor-bg overflow-hidden shadow-2xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-editor-line border-b border-editor-border">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-xs font-mono text-editor-muted">
                  session.js — CodeCollab Workspace
                </span>
              </div>

              {/* Code area */}
              <pre className="p-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto text-editor-text">
                <code>{codeSnippet}</code>
              </pre>

              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-cyan-500/10 border-t border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono text-cyan-400">Collaborative session ready</span>
                </div>
                <span className="text-xs font-mono text-editor-muted">Python · UTF-8</span>
              </div>
            </div>

            {/* Floating labels */}
            <div className="flex justify-between mt-3 px-1">
              <span className="text-xs text-editor-muted font-mono">Monaco Editor</span>
              <span className="text-xs text-editor-muted font-mono">Socket.IO / Yjs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
