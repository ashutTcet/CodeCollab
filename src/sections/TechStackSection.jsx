import SectionHeader from '../components/SectionHeader'
import { techStack } from '../data/platform'

export default function TechStackSection() {
  return (
    <section id="tech-stack" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Technology"
          title="Built on a Modern Stack"
          subtitle="Each layer of CodeCollab uses production-grade technologies purpose-fit for real-time collaborative education."
          centered
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((group) => (
            <div
              key={group.category}
              className={`rounded-xl border ${group.borderColor} bg-surface-700 p-5 hover:bg-surface-600 transition-all duration-200`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-2 h-2 rounded-full ${group.bgColor.replace('bg-', 'bg-').replace('/10', '')}`}
                  style={{ background: 'currentColor' }}
                />
                <span className={`text-xs font-semibold uppercase tracking-widest ${group.color}`}>
                  {group.category}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${group.borderColor} ${group.bgColor} ${group.color}`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
