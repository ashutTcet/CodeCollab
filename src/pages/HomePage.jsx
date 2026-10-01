import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Bug,
  Check,
  ChevronRight,
  Code2,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Video,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  {
    icon: Code2,
    title: 'Real-Time Collaborative Editor',
    description: 'Write, review, and learn simultaneously in shared Monaco editor rooms with instant Yjs synchronization.',
  },
  {
    icon: Bot,
    title: 'AI Coding Tutor',
    description: 'Get progressive hints, conceptual explanations, and structured guidance without spoon-feeding answers.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-Language Code Execution',
    description: 'Run Python, JavaScript, Java, C++, and C in an isolated Judge0 sandbox environment with live stdout/stderr.',
  },
  {
    icon: Video,
    title: 'Integrated Video, Audio & Chat',
    description: 'Stay connected directly within the editor workspace through low-latency LiveKit calls and persistent chat.',
  },
  {
    icon: Bug,
    title: 'AI Error Explainer & Debugger',
    description: 'Transform cryptic compiler errors and runtime exceptions into clear, beginner-friendly learning moments.',
  },
  {
    icon: BarChart3,
    title: 'Classroom Management & Access',
    description: 'Teachers easily create classrooms with unique join codes, manage attendees, and observe student work in real time.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create or Join Classroom',
    description: 'Teachers launch a collaborative coding room and share a 6-character room code with students.',
  },
  {
    number: '02',
    title: 'Collaborate, Code & Communicate',
    description: 'Write code together with multi-cursor presence, run tests instantly, and talk over built-in audio/video.',
  },
  {
    number: '03',
    title: 'Learn & Debug with AI',
    description: 'When errors occur, ask the AI Tutor to diagnose root causes and guide you step-by-step toward the fix.',
  },
];

function CodeLine({ number, children }) {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] leading-relaxed font-mono text-[11px] sm:text-xs">
      <span className="text-slate-500 select-none text-right pr-3">{number}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function WorkspaceMockup({ compact = false }) {
  return (
    <div className={`cc-float rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden text-left ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {/* Window Title Bar */}
      <div className="h-10 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="ml-2 font-mono text-[11px] text-slate-500 font-medium">classroom_session.js</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center -space-x-1.5">
            <span className="size-5 rounded-full border-2 border-white bg-brand-600 text-[9px] font-bold text-white flex items-center justify-center">
              HP
            </span>
            <span className="size-5 rounded-full border-2 border-white bg-sky-600 text-[9px] font-bold text-white flex items-center justify-center">
              SK
            </span>
            <span className="size-5 rounded-full border-2 border-white bg-slate-700 text-[9px] font-bold text-white flex items-center justify-center">
              +2
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            live sync
          </span>
        </div>
      </div>

      {/* Editor & AI Split View */}
      <div className="grid min-h-[300px] sm:min-h-[340px] grid-cols-1 md:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
        {/* Code Editor Pane (Developer Dark Surface) */}
        <div className="bg-slate-950 py-3 px-2 sm:px-4 font-mono text-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center gap-4 border-b border-slate-800 pb-2 text-[10px] text-slate-400">
              <span className="border-b-2 border-brand-500 pb-2 text-white font-medium">solution.js</span>
              <span className="hover:text-slate-200 transition-colors">tests.js</span>
            </div>
            <div className="space-y-0.5">
              <CodeLine number="1">
                <span className="text-purple-400">function</span> <span className="text-amber-300">binarySearch</span>(arr, target) &#123;
              </CodeLine>
              <CodeLine number="2">
                &nbsp;&nbsp;<span className="text-purple-400">let</span> left = <span className="text-cyan-400">0</span>, right = arr.length - <span className="text-cyan-400">1</span>;
              </CodeLine>
              <CodeLine number="3">
                &nbsp;&nbsp;<span className="text-purple-400">while</span> (left &lt;= right) &#123;
              </CodeLine>
              <CodeLine number="4">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">const</span> mid = Math.<span className="text-amber-300">floor</span>((left + right) / <span className="text-cyan-400">2</span>);
              </CodeLine>
              <CodeLine number="5">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">if</span> (arr[mid] === target) <span className="text-purple-400">return</span> mid;
              </CodeLine>
              <CodeLine number="6">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">if</span> (arr[mid] &lt; target) left = mid + <span className="text-cyan-400">1</span>;
              </CodeLine>
              <CodeLine number="7">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">else</span> right = mid - <span className="text-cyan-400">1</span>;
              </CodeLine>
              <CodeLine number="8">
                &nbsp;&nbsp;&#125;<span className="cc-cursor" />
              </CodeLine>
              <CodeLine number="9">
                &nbsp;&nbsp;<span className="text-purple-400">return</span> -<span className="text-cyan-400">1</span>;
              </CodeLine>
              <CodeLine number="10">&#125;</CodeLine>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Terminal size={12} />
              <span>Judge0 Sandbox: Accepted (0.02s • Memory: 12.4 MB)</span>
            </div>
            <span className="hidden sm:inline text-slate-500 font-mono">JavaScript V8</span>
          </div>
        </div>

        {/* AI Tutor Pane (Matching CodeCollab AI Sidebar) */}
        <aside className="border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 flex flex-col justify-between">
          <div>
            <div className="h-9 px-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <Sparkles size={14} className="text-brand-600" />
                <span>AI Tutor Guidance</span>
              </div>
              <span className="size-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-3 space-y-2.5 text-[11px] leading-relaxed">
              <div className="rounded-lg border border-brand-200 bg-brand-50/80 p-2.5 text-slate-800">
                <span className="block font-mono text-[9px] uppercase tracking-wider font-semibold text-brand-700 mb-1">
                  💡 Progressive Hint
                </span>
                Excellent progress! Your search pointers narrow the interval in logarithmic time. What happens if the input array is not sorted?
              </div>

              <div className="flex gap-2 text-slate-600 text-[10px]">
                <span className="size-4 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-[8px] shrink-0 mt-0.5">
                  SK
                </span>
                <span>Should we validate sorting before the while loop?</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm text-[10px]">
                Binary search requires pre-sorted data. If unsorted, you can either sort first in <span className="font-mono text-brand-600">O(n log n)</span> or use linear search for a single lookup.
              </div>
            </div>
          </div>

          <div className="p-2 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
              <span>Ask AI Tutor a question...</span>
              <ArrowRight size={12} className="text-slate-400" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="size-10 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mb-4">
          <Icon size={20} strokeWidth={2} />
        </div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fbff] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100">
      {/* Global CodeCollab Navigation Bar */}
      <Navbar />

      <main className="flex-1">
        {/* ─── Hero Section ─────────────────────────────────────────────── */}
        <section id="overview" className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
          {/* Subtle Light Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold tracking-wide shadow-sm mb-6">
              <span className="size-2 rounded-full bg-brand-600 animate-pulse" />
              The Collaborative Coding Classroom
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08]">
              Code together.<br />
              <span className="text-brand-600">Learn together.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              One focused workspace for remote STEM education — collaborative code, live execution, real conversation, and an AI tutor that helps every learner find the answer.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="btn-primary text-sm px-5 py-2.5 w-full sm:w-auto justify-center shadow-sm">
                Get started
                <ArrowRight size={16} />
              </Link>
              <a href="#showcase" className="btn-secondary text-sm px-5 py-2.5 w-full sm:w-auto justify-center">
                <Play size={14} className="fill-slate-700" />
                Explore platform
              </a>
            </div>

            {/* Hero Workspace Mockup */}
            <div className="mt-14 sm:mt-18 max-w-5xl mx-auto">
              <WorkspaceMockup />
            </div>
          </div>
        </section>

        {/* ─── Capabilities Strip ────────────────────────────────────────── */}
        <section className="border-y border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                'Real-Time Collaboration',
                'AI-Powered Learning',
                'Live Code Execution',
                'Integrated Communication',
              ].map((item) => (
                <div key={item} className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <Check size={16} className="text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features Grid ─────────────────────────────────────────────── */}
        <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[0.8fr_1.4fr] gap-12 lg:gap-16 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">
                Everything in one room
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                A better place to learn how code works.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-md">
                CodeCollab keeps the code, the teacher, the compiler, and the conversation close enough to make progress feel shared.
              </p>
              <div className="mt-8">
                <Link to="/register" className="btn-primary text-sm">
                  Create a classroom today
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ──────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 sm:py-28 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">
                A clear path forward
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                From first line to breakthrough.
              </h2>
              <p className="mt-3 text-base text-slate-600">
                Designed for teachers leading remote STEM classes and students building confidence in programming.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono text-sm font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-md inline-block mb-4">
                      Step {step.number}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{step.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Platform Showcase ─────────────────────────────────────────── */}
        <section id="showcase" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">
                The whole classroom, connected
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Every insight has a place to land.
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                See what your students see. Talk through the problem, execute the code, and let the AI tutor meet the learner exactly where they are.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  'Shared context from the first line of code',
                  'Hints that guide without revealing full solutions',
                  'A calmer, collaborative way to debug together',
                  'Instant execution across JavaScript, Python, Java, C++, and C',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-slate-700 font-medium">
                    <span className="size-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link to="/register" className="btn-primary text-sm">
                  Join CodeCollab
                  <ChevronRight size={16} />
                </Link>
                <Link to="/login" className="btn-secondary text-sm">
                  Log In
                </Link>
              </div>
            </div>

            <div>
              <WorkspaceMockup compact />
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─────────────────────────────────────────────────── */}
        <section id="final-cta" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="bg-gradient-to-br from-brand-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-brand-200 dark:border-slate-800 rounded-2xl p-8 sm:p-14 text-center shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-400 mb-2">
                Ready when you are
              </p>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Turn remote coding into collaborative learning.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                Give every learner a place to experiment, ask questions, and build confidence together.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register" className="btn-primary text-sm px-6 py-3 w-full sm:w-auto justify-center shadow-sm">
                  Start coding together
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn-secondary text-sm px-6 py-3 w-full sm:w-auto justify-center">
                  Log in to existing classroom
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global CodeCollab Footer */}
      <Footer />
    </div>
  );
}
