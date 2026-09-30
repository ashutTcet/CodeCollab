export default function SectionHeader({ label, title, subtitle, centered = false }) {
  return (
    <div className={`mb-12 ${centered ? 'text-center mx-auto max-w-2xl' : ''}`}>
      {label && <p className="section-label">{label}</p>}
      <h2 className="section-title mb-4">{title}</h2>
      {subtitle && (
        <p className={`section-subtitle ${centered ? 'mx-auto' : ''}`}>{subtitle}</p>
      )}
    </div>
  )
}
