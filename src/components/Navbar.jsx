import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Code2, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const homeLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Roadmap', href: '#roadmap' },
]

const studentLinks = [
  { label: 'Dashboard', href: '#student-dashboard' },
  { label: 'Projects', href: '#recent-projects' },
  { label: 'Sessions', href: '#active-sessions' },
  { label: 'Progress', href: '#learning-progress' },
]

const teacherLinks = [
  { label: 'Dashboard', href: '#teacher-dashboard' },
  { label: 'Classrooms', href: '#classrooms' },
  { label: 'Sessions', href: '#active-sessions' },
  { label: 'Students', href: '#students' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const isStudentDashboard = location.pathname === '/student/dashboard'
  const isTeacherDashboard = location.pathname === '/teacher/dashboard'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)

    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const dashboardPath = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
  const navItems = isHomePage
    ? homeLinks
    : isStudentDashboard
      ? studentLinks
      : isTeacherDashboard
        ? teacherLinks
        : []

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-surface-500'
          : 'bg-white/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {isHomePage ? (
            <a href="#" onClick={(e) => handleNavClick(e, 'body')} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-md bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Code2 size={16} className="text-brand-700" />
              </div>
              <div>
                <span className="text-base font-bold text-editor-text tracking-tight">CodeCollab</span>
                <p className="text-[11px] text-editor-muted leading-none mt-0.5 hidden sm:block">
                  Collaborative coding for remote learning
                </p>
              </div>
            </a>
          ) : (
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
              <div className="w-8 h-8 rounded-md bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Code2 size={16} className="text-brand-700" />
              </div>
              <div>
                <span className="text-base font-bold text-editor-text tracking-tight">CodeCollab</span>
                <p className="text-[11px] text-editor-muted leading-none mt-0.5 hidden sm:block">
                  Collaborative coding for remote learning
                </p>
              </div>
            </Link>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-2 text-sm text-editor-muted hover:text-editor-text transition-colors rounded-md hover:bg-surface-600"
                >
                  {link.label}
                </a>
              ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-editor-muted border border-surface-500 rounded-md px-3 py-2">
                  Profile: {user?.name || 'User'}
                </span>
                {!(isStudentDashboard || isTeacherDashboard) && (
                  <Link to={dashboardPath} className="btn-secondary">Dashboard</Link>
                )}
                <button type="button" onClick={logout} className="btn-primary">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Log In</Link>
                <Link to="/register" className="btn-primary">Register</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-editor-muted hover:text-editor-text transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-800/95 backdrop-blur-md border-b border-surface-600">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navItems.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-2.5 text-sm text-editor-muted hover:text-editor-text hover:bg-surface-600 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
            <div className="pt-2 mt-1 border-t border-surface-500 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <span className="px-3 py-2 text-sm text-editor-muted border border-surface-500 rounded-md">
                    Profile: {user?.name || 'User'}
                  </span>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm rounded-md border border-surface-400 text-editor-text hover:bg-surface-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false)
                      logout()
                    }}
                    className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm rounded-md border border-surface-400 text-editor-text hover:bg-surface-600 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
