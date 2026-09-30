import {
  Code2,
  Video,
  Bot,
  Play,
  Bug,
  TrendingUp,
} from 'lucide-react'

export const features = [
  {
    id: 'editor',
    icon: Code2,
    title: 'Real-Time Collaborative Editor',
    description:
      'Multiple students can work on the same codebase simultaneously with live cursor synchronization and instant conflict resolution.',
    bullets: [
      'Live cursors and code synchronization',
      'Multi-language development environment',
      'Powered by Monaco Editor + Socket.IO / Yjs',
    ],
    accentColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    glowColor: 'group-hover:shadow-cyan-500/10',
  },
  {
    id: 'video',
    icon: Video,
    title: 'Video & Chat',
    description:
      'Integrated real-time communication lets students and teachers collaborate while coding — no context switching required.',
    bullets: [
      'Video and audio collaboration',
      'Real-time classroom discussion',
      'WebRTC / LiveKit based architecture',
    ],
    accentColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    glowColor: 'group-hover:shadow-violet-500/10',
  },
  {
    id: 'ai',
    icon: Bot,
    title: 'AI Tutor & Debugger',
    description:
      'An LLM-powered tutor explains errors in plain language, provides guided hints, and helps students understand the "why" behind bugs.',
    bullets: [
      'Beginner-friendly error explanations',
      'Guided hints instead of direct answers',
      'AI-assisted debugging and learning support',
    ],
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    glowColor: 'group-hover:shadow-emerald-500/10',
  },
  {
    id: 'execution',
    icon: Play,
    title: 'Secure Code Execution',
    description:
      'Execute code inside an isolated, sandboxed environment with strict resource limits — safe for classroom use at scale.',
    bullets: [
      'Isolated execution environment',
      'Controlled CPU, memory and time limits',
      'Support for multiple programming languages',
    ],
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    glowColor: 'group-hover:shadow-amber-500/10',
  },
  {
    id: 'debug',
    icon: Bug,
    title: 'Collaborative Debugging & Code Quality',
    description:
      'Debug problems together in real time. Automated analysis surfaces potential issues so teachers can guide students precisely.',
    bullets: [
      'Collaborative real-time debugging sessions',
      'Automated code quality analysis',
      'Teacher-guided student support tooling',
    ],
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    glowColor: 'group-hover:shadow-rose-500/10',
  },
  {
    id: 'learning',
    icon: TrendingUp,
    title: 'Personalized Learning',
    description:
      'Track each student\'s coding activity, identify weak areas, and surface personalized exercise recommendations to close learning gaps.',
    bullets: [
      'Topic-wise progress monitoring',
      'Automatic identification of weak areas',
      'Personalized exercise recommendations',
    ],
    accentColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    glowColor: 'group-hover:shadow-sky-500/10',
  },
]
