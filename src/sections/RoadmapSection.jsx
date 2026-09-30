import SectionHeader from '../components/SectionHeader'
import RoadmapCard from '../components/RoadmapCard'
import { roadmap } from '../data/platform'

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Roadmap"
          title="MVP Build Plan"
          subtitle="A phased development plan that takes CodeCollab from a frontend foundation to a full collaborative learning platform."
          centered
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roadmap.map((phase) => (
            <RoadmapCard key={phase.phase} {...phase} />
          ))}
        </div>

        <p className="text-center text-xs text-editor-muted mt-8 font-mono">
          Status indicators reflect actual implementation state — ✓ Complete · ○ Planned
        </p>
      </div>
    </section>
  )
}
