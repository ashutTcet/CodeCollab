import SectionHeader from '../components/SectionHeader'

const steps = [
  {
    number: '01',
    title: 'Create Classroom',
    description: 'Teacher creates a live coding session with a chosen language and configuration.',
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
  },
  {
    number: '02',
    title: 'Join & Collaborate',
    description: 'Students join the shared workspace via a session link — everyone sees the same editor.',
    color: 'text-violet-400',
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10',
  },
  {
    number: '03',
    title: 'Code Together',
    description: 'Everyone works in the Monaco-powered collaborative editor with live cursor sync.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  {
    number: '04',
    title: 'Run, Debug & Ask AI',
    description: 'Execute code securely, understand errors, and get guided explanations from the AI Tutor.',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
  {
    number: '05',
    title: 'Track Progress',
    description: 'Coding activity, errors, and topic mastery are recorded and surfaced for both roles.',
    color: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Workflow"
          title="How CodeCollab Works"
          subtitle="A conceptual product flow showing how teachers and students interact with the platform."
          centered
        />

        {/* Desktop: horizontal stepper */}
        <div className="hidden md:flex items-start gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Number circle */}
                <div
                  className={`w-12 h-12 rounded-full border-2 ${step.border} ${step.bg} flex items-center justify-center mb-4 shrink-0`}
                >
                  <span className={`text-sm font-bold font-mono ${step.color}`}>{step.number}</span>
                </div>
                {/* Content */}
                <div className="text-center px-2">
                  <h3 className="text-sm font-semibold text-editor-text mb-1.5">{step.title}</h3>
                  <p className="text-xs text-editor-muted leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex items-start pt-6 w-8 shrink-0">
                  <div className="h-px w-full bg-surface-400 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-surface-400" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical stepper */}
        <div className="flex flex-col gap-0 md:hidden">
          {steps.map((step, index) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full border-2 ${step.border} ${step.bg} flex items-center justify-center shrink-0`}
                >
                  <span className={`text-xs font-bold font-mono ${step.color}`}>{step.number}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-px flex-1 bg-surface-500 my-2" />
                )}
              </div>
              <div className={`pb-8 ${index === steps.length - 1 ? '' : ''}`}>
                <h3 className="text-sm font-semibold text-editor-text mb-1">{step.title}</h3>
                <p className="text-xs text-editor-muted leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-editor-muted mt-10 font-mono border-t border-surface-600 pt-6">
          ℹ️ This is a conceptual product flow — backend workflows are part of the planned implementation.
        </p>
      </div>
    </section>
  )
}
