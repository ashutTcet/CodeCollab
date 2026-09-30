import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Code2, Menu, X, ChevronRight } from 'lucide-react'

const navLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'Classroom', href: '#features' },
  { label: 'AI Tutor', href: '#how-it-works' },
  { label: 'Code Execution', href: '#architecture' },
  { label: 'Learning', href: '#roadmap' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (e, href) => {
    e.preventDefault()
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface-900/95 backdrop-blur-md border-b border-surface-600'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" onClick={(e) => handleNavClick(e, 'body')} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
              <Code2 size={16} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-base font-bold text-editor-text tracking-tight">CodeCollab</span>
              <p className="text-[10px] text-editor-muted leading-none mt-0.5 hidden sm:block">
                Collaborative Coding Classroom
              </p>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
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
            <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-widest">
              MERN Stack
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-500 border border-surface-400 flex items-center justify-center text-xs font-semibold text-editor-muted">
              CC
            </div>
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
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center justify-between px-3 py-2.5 text-sm text-editor-muted hover:text-editor-text hover:bg-surface-600 rounded-lg transition-colors"
              >
                {link.label}
                <ChevronRight size={14} />
              </a>
            ))}
            <div className="pt-2 mt-1 border-t border-surface-500">
              <span className="badge bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono uppercase tracking-widest">
                MERN Stack
              </span>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
