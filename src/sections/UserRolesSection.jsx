import SectionHeader from '../components/SectionHeader'
import { userRoles } from '../data/platform'
import { CheckCircle2 } from 'lucide-react'

export default function UserRolesSection() {
  return (
    <section id="roles" className="py-24 bg-surface-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          label="User Roles"
          title="Designed for Two Roles"
          subtitle="CodeCollab provides tailored experiences for both instructors and learners within the same unified platform."
          centered
        />

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {userRoles.map((role) => (
            <div
              key={role.role}
              className={`rounded-xl border ${role.borderColor} ${role.bgColor} p-8 flex flex-col gap-5`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{role.icon}</span>
                <div>
                  <h3 className={`text-xl font-bold ${role.color}`}>{role.role}</h3>
                  <p className="text-xs text-editor-muted font-mono">Platform Role</p>
                </div>
              </div>

              <ul className="flex flex-col gap-3">
                {role.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-editor-muted">
                    <CheckCircle2 size={15} className={`${role.color} mt-0.5 shrink-0`} />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-editor-muted mt-8 font-mono">
          Authentication is part of the planned implementation — not yet active.
        </p>
      </div>
    </section>
  )
}
