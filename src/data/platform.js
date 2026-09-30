export const techStack = [
  {
    category: 'Frontend',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    items: ['React.js', 'Vite', 'Tailwind CSS', 'Monaco Editor'],
  },
  {
    category: 'Backend',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    items: ['Node.js', 'Express.js', 'REST APIs'],
  },
  {
    category: 'Real-Time',
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    items: ['Socket.IO', 'Yjs'],
  },
  {
    category: 'Database',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    items: ['MongoDB Atlas'],
  },
  {
    category: 'AI',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    items: ['LLM API'],
  },
  {
    category: 'Communication',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/10',
    items: ['WebRTC', 'LiveKit'],
  },
  {
    category: 'Execution',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    items: ['Judge0', 'Sandboxed Runner'],
  },
  {
    category: 'DevOps',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    items: ['Git', 'GitHub'],
  },
]

export const userRoles = [
  {
    role: 'Teacher',
    color: 'text-brand-700',
    borderColor: 'border-brand-200',
    bgColor: 'bg-brand-50',
    capabilities: [
      'Create and manage coding classrooms',
      'Monitor student activity in real time',
      'Assist with debugging sessions',
      'Review student code quality',
      'Track learner progress and gaps',
    ],
  },
  {
    role: 'Student',
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    capabilities: [
      'Join shared coding classrooms',
      'Collaborate on code with peers',
      'Run and debug programs securely',
      'Ask AI Tutor for guided explanations',
      'Track personal learning progress',
    ],
  },
]

export const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Frontend Foundation',
    status: 'complete',
    items: [
      { label: 'Product UI & Design System', done: true },
      { label: 'Navigation & Routing', done: true },
      { label: 'Classroom Interface Design', done: true },
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Real-Time Collaboration',
    status: 'planned',
    items: [
      { label: 'Socket.IO / Yjs Integration', done: false },
      { label: 'Shared Collaborative Editor', done: false },
      { label: 'Presence & Live Cursors', done: false },
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Execution & AI',
    status: 'planned',
    items: [
      { label: 'Secure Code Execution (Judge0)', done: false },
      { label: 'AI Tutor Integration', done: false },
      { label: 'Error Explanation Engine', done: false },
      { label: 'Code Quality Analysis', done: false },
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Learning Platform',
    status: 'planned',
    items: [
      { label: 'Progress Tracking System', done: false },
      { label: 'Teacher Analytics Dashboard', done: false },
      { label: 'Personalized Recommendations', done: false },
    ],
  },
]
