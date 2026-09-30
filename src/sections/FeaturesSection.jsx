import { CheckCircle2 } from 'lucide-react'
import { features } from '../data/features'
import SectionHeader from '../components/SectionHeader'

function FeatureCard({ feature }) {
  const Icon = feature.icon

  return (
    <div
      className={`group card ${feature.glowColor} flex flex-col gap-4 border ${feature.borderColor} hover:bg-surface-600 transition-all duration-200`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center bg-surface-600 border ${feature.borderColor} group-hover:scale-105 transition-transform`}
      >
        <Icon size={20} className={feature.accentColor} />
      </div>

      <div>
        <h3 className="text-base font-semibold text-editor-text mb-1.5">{feature.title}</h3>
        <p className="text-sm text-editor-muted leading-relaxed">{feature.description}</p>
      </div>

      <ul className="flex flex-col gap-2 mt-auto">
        {feature.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-editor-muted">
            <CheckCircle2 size={13} className={`${feature.accentColor} mt-0.5 shrink-0`} />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-surface-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="Platform Overview"
          title="Everything You Need to Teach & Learn Code"
          subtitle="Six integrated modules that work together to create a complete remote coding education environment."
          centered
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <FeatureCard key={f.id} feature={f} />
          ))}
        </div>
      </div>
    </section>
  )
}
