import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Bug,
  Check,
  ChevronRight,
  Code2,
  Command,
  Menu,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Video,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeCollab — Code Together. Learn Together." },
      {
        name: "description",
        content:
          "A collaborative online coding classroom for remote STEM education, with real-time editing, live execution, communication, and an AI coding tutor.",
      },
      { property: "og:title", content: "CodeCollab — Code Together. Learn Together." },
      {
        property: "og:description",
        content: "The collaborative coding classroom for remote STEM education.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CodeCollabLanding,
});

const features: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: Code2, title: "Real-Time Collaborative Editor", description: "Write, review, and learn in the same file — together." },
  { icon: Bot, title: "AI Coding Tutor", description: "Get thoughtful hints and clear explanations without spoilers." },
  { icon: ShieldCheck, title: "Secure Code Execution", description: "Run code safely in a classroom built for experimentation." },
  { icon: Video, title: "Video & Chat", description: "Keep the conversation close to the code with built-in communication." },
  { icon: Bug, title: "Collaborative Debugging", description: "Turn confusing errors into shared moments of discovery." },
  { icon: BarChart3, title: "Learning Progress", description: "See momentum build across projects, lessons, and practice." },
];

const steps = [
  { number: "01", title: "Create Classroom", description: "Bring your students into one focused workspace." },
  { number: "02", title: "Collaborate & Code", description: "Build together with live code, audio, video, and chat." },
  { number: "03", title: "Learn & Debug", description: "Use AI guidance to understand the why behind every fix." },
];

function LogoMark() {
  return (
    <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_24px_var(--color-primary)]/20">
      <Command className="size-4" strokeWidth={2.4} />
    </span>
  );
}

function CodeLine({ number, children }: { number: string; children: ReactNode }) {
  return (
    <div className="cc-code-line">
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

function WorkspaceMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`cc-shell cc-float overflow-hidden ${compact ? "text-[9px]" : "text-[10px] sm:text-[11px]"}`}>
      <div className="cc-window-bar flex h-10 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="size-2 rounded-full bg-code-pink/80" />
            <span className="size-2 rounded-full bg-code-orange/80" />
            <span className="size-2 rounded-full bg-code-green/80" />
          </span>
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">lesson_04.tsx</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="cc-avatar-stack hidden items-center sm:flex">
            <span className="flex size-5 items-center justify-center rounded-full border-2 border-card bg-code-purple text-[8px] font-bold text-primary-foreground">AK</span>
            <span className="flex size-5 items-center justify-center rounded-full border-2 border-card bg-code-green text-[8px] font-bold text-primary-foreground">ML</span>
            <span className="flex size-5 items-center justify-center rounded-full border-2 border-card bg-code-orange text-[8px] font-bold text-primary-foreground">+2</span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[9px] text-code-green"><span className="size-1.5 rounded-full bg-code-green" /> live</span>
        </div>
      </div>
      <div className="grid min-h-[286px] grid-cols-[minmax(0,1.4fr)_minmax(132px,0.6fr)] sm:min-h-[330px]">
        <div className="cc-code-bg overflow-hidden py-4 font-mono">
          <div className="mb-3 flex items-center gap-4 border-b border-border/70 px-4 pb-2 text-[9px] text-muted-foreground">
            <span className="border-b border-primary pb-2 text-foreground">solution.tsx</span>
            <span>tests.ts</span>
          </div>
          <div className="px-1 sm:px-3">
            <CodeLine number="1"><span className="text-code-purple">import</span> <span className="text-code-blue">&#123; useState &#125;</span> <span className="text-code-purple">from</span> <span className="text-code-green">&quot;react&quot;</span>;</CodeLine>
            <CodeLine number="2"><span>&nbsp;</span></CodeLine>
            <CodeLine number="3"><span className="text-code-purple">export default function</span> <span className="text-code-orange">Lesson</span>() &#123;</CodeLine>
            <CodeLine number="4">&nbsp;&nbsp;<span className="text-code-purple">const</span> [count, setCount] = <span className="text-code-orange">useState</span>(0);</CodeLine>
            <CodeLine number="5">&nbsp;&nbsp;</CodeLine>
            <CodeLine number="6">&nbsp;&nbsp;<span className="text-code-purple">return</span> (</CodeLine>
            <CodeLine number="7">&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-code-blue">button</span></CodeLine>
            <CodeLine number="8">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-code-pink">onClick</span>=&#123;() =&gt; <span className="text-code-orange">setCount</span>(count + 1)&#125;</CodeLine>
            <CodeLine number="9">&nbsp;&nbsp;&nbsp;&nbsp;&gt;</CodeLine>
            <CodeLine number="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clicked &#123;count&#125; times</CodeLine>
            <CodeLine number="11">&nbsp;&nbsp;&nbsp;&nbsp;&lt;/<span className="text-code-blue">button</span>&gt;<span className="cc-cursor" /></CodeLine>
            <CodeLine number="12">&nbsp;&nbsp;);</CodeLine>
            <CodeLine number="13">&#125;</CodeLine>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border/70 px-4 pt-3 font-mono text-[9px] text-muted-foreground">
            <Terminal className="size-3 text-code-green" /> output
            <span className="ml-auto text-code-green">✓ all tests passed</span>
          </div>
        </div>
        <aside className="flex flex-col border-l border-border bg-card/60">
          <div className="flex items-center gap-2 border-b border-border px-3 py-3 font-medium text-foreground">
            <Sparkles className="size-3.5 text-violet" /> AI Tutor
            <span className="ml-auto size-1.5 rounded-full bg-code-green" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-3 font-sans text-[10px] leading-relaxed">
            <div className="rounded-md border border-primary/20 bg-primary/10 p-2.5 text-foreground">
              <span className="mb-1 block font-mono text-[8px] uppercase tracking-widest text-cyan">Nice work</span>
              Your component is rendering. Want to explore how state updates when the button is clicked?
            </div>
            <div className="flex gap-2 text-muted-foreground"><span className="mt-0.5 size-4 shrink-0 rounded-full bg-code-purple text-center text-[8px] leading-4 text-primary-foreground">AK</span> Why does the count start at zero?</div>
            <div className="rounded-md border border-border bg-secondary/60 p-2.5 text-muted-foreground">Because <span className="font-mono text-code-orange">useState(0)</span> sets the initial value. Try changing it to see what happens.</div>
          </div>
          <div className="border-t border-border p-2"><div className="flex items-center gap-2 rounded border border-border bg-background/60 px-2 py-1.5 text-[9px] text-muted-foreground">Ask a follow-up <ArrowRight className="ml-auto size-3" /></div></div>
        </aside>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <article className="cc-feature-card rounded-lg p-5 sm:p-6">
      <div className="cc-icon-box mb-5 flex size-10 items-center justify-center rounded-md"><Icon className="size-5" strokeWidth={1.7} /></div>
      <h3 className="cc-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function CodeCollabLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Technology", href: "#showcase" },
  ];

  return (
    <main className="cc-noise relative min-h-screen overflow-hidden bg-background">
      <div className="cc-page-grid pointer-events-none absolute inset-x-0 top-0 h-[720px]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10" aria-label="Main navigation">
        <a href="#top" className="flex items-center gap-2.5" onClick={closeMenu}>
          <LogoMark />
          <span className="cc-display text-[1.05rem] font-semibold tracking-tight text-foreground">CodeCollab<span className="text-primary">.</span></span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => <a key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{item.label}</a>)}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild><a href="#footer">Sign in</a></Button>
          <Button asChild><a href="#final-cta">Get started <ArrowRight /></a></Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </Button>
        {menuOpen && <div className="absolute inset-x-5 top-[4.5rem] rounded-lg border border-border bg-card p-3 shadow-xl md:hidden"><div className="flex flex-col gap-1">{navItems.map((item) => <a key={item.href} href={item.href} onClick={closeMenu} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{item.label}</a>)}<a href="#footer" onClick={closeMenu} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Sign in</a><Button asChild className="mt-2"><a href="#final-cta" onClick={closeMenu}>Get started <ArrowRight /></a></Button></div></div>}
      </nav>

      <section id="top" className="relative z-[1] mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="cc-eyebrow mb-6 inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-cyan" /> the collaborative coding classroom</div>
          <h1 className="cc-display text-5xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-7xl">Code together.<br /><span className="text-primary">Learn together.</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">One focused workspace for remote STEM education — collaborative code, live execution, real conversation, and an AI tutor that helps every learner find the answer.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild><a href="#final-cta">Get started <ArrowRight /></a></Button>
            <Button size="lg" variant="outline" asChild><a href="#showcase"><Play className="fill-current" /> Explore platform</a></Button>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-5xl sm:mt-20"><WorkspaceMockup /></div>
      </section>

      <section className="relative z-[1] border-y border-border bg-card/35" aria-label="CodeCollab capabilities">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 py-6 sm:grid-cols-4 sm:px-8 lg:px-10">
          {["Real-time collaboration", "AI-powered learning", "Live code execution", "Integrated communication"].map((item, index) => <div key={item} className={`flex items-center gap-2 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:justify-center sm:text-[11px] ${index > 1 ? "hidden sm:flex" : ""}`}><Check className="size-3.5 text-code-green" />{item}</div>)}
        </div>
      </section>

      <section id="features" className="relative z-[1] mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-20">
          <div><div className="cc-eyebrow">everything in one room</div><h2 className="cc-display mt-4 max-w-md text-3xl font-semibold leading-tight text-foreground sm:text-4xl">A better place to learn how code works.</h2><p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">CodeCollab keeps the tools, the teacher, and the conversation close enough to make progress feel shared.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-[1] cc-section-rule mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28 lg:px-10">
        <div className="mb-14 max-w-xl"><div className="cc-eyebrow">a clear path forward</div><h2 className="cc-display mt-4 text-3xl font-semibold text-foreground sm:text-4xl">From first line to breakthrough.</h2></div>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">{steps.map((step, index) => <div key={step.number} className="relative"><div className="mb-6 flex items-center gap-4"><span className="font-mono text-sm text-cyan">{step.number}</span><div className="h-px flex-1 bg-border md:hidden" />{index < steps.length - 1 && <div className="cc-step-line absolute left-10 top-3 hidden h-px w-[calc(100%-2.5rem)] opacity-55 md:block" />}</div><h3 className="cc-display text-xl font-semibold text-foreground">{step.title}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{step.description}</p></div>)}</div>
      </section>

      <section id="showcase" className="relative z-[1] mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div><div className="cc-eyebrow">the whole classroom, connected</div><h2 className="cc-display mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Every insight has a place to land.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">See what your students see. Talk through the problem, run the code, and let the AI tutor meet the learner exactly where they are.</p><div className="mt-8 space-y-4">{["Shared context from the first line of code", "Hints that guide, not give away", "A calmer way to debug together"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-secondary-foreground"><span className="flex size-5 items-center justify-center rounded-full bg-secondary text-code-green"><Check className="size-3" /></span>{item}</div>)}</div><a href="#final-cta" className="mt-9 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-cyan">See how it works <ChevronRight className="size-4" /></a></div>
          <WorkspaceMockup compact />
        </div>
      </section>

      <section id="final-cta" className="relative z-[1] mx-5 mb-20 overflow-hidden rounded-xl border border-primary/20 bg-card px-6 py-16 text-center sm:mx-8 sm:px-10 sm:py-20 lg:mx-auto lg:max-w-7xl lg:px-20"><div className="pointer-events-none absolute inset-0 bg-primary/[0.04]" /><div className="relative"><div className="cc-eyebrow">ready when you are</div><h2 className="cc-display mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">Turn remote coding into collaborative learning.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">Give every learner a place to experiment, ask questions, and build confidence together.</p><Button size="lg" className="mt-8" asChild><a href="#top">Start coding together <ArrowRight /></a></Button></div></section>

      <footer id="footer" className="relative z-[1] border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><a href="#top" className="flex items-center gap-2.5"><LogoMark /><span className="cc-display text-[1.05rem] font-semibold tracking-tight text-foreground">CodeCollab<span className="text-primary">.</span></span></a><div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"><a href="#features" className="transition-colors hover:text-foreground">Features</a><a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a><a href="#showcase" className="transition-colors hover:text-foreground">Technology</a></div><span className="text-xs text-muted-foreground">Built for better learning.</span></div></footer>
    </main>
  );
}