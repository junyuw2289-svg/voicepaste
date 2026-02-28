import {
  Zap,
  Sparkles,
  BookOpen,
  Lock,
  Monitor,
  History,
  Shield,
  Github,
} from "lucide-react";
import {
  ScrollObserver,
  FAQItem,
  CountUp,
  ParallaxDecoration,
} from "./components/motion";
import VibeCodingDemo from "./components/VibeCodingDemo";
import PolishDemo from "./components/PolishDemo";
import ItemizeDemo from "./components/ItemizeDemo";
import Link from "next/link";

const DOWNLOAD_URL =
  "https://github.com/junyuw2289-svg/voicepaste/releases/latest/download/VoicePaste.dmg";
const GITHUB_URL = "https://github.com/junyuw2289-svg/voicepaste";

/* ─── Waveform bars (decorative) ─── */
function Waveform({
  heights,
  className = "",
  animated = false,
}: {
  heights: number[];
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={`flex items-end gap-[6px] ${className}`}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[5px] rounded-sm bg-[var(--orange)]"
          style={{
            height: h,
            ...(animated && {
              animation: "waveform 1.8s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
              transformOrigin: "bottom",
            }),
          }}
        />
      ))}
    </div>
  );
}

/* ─── Badge pill ─── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[rgba(217,119,87,0.3)] bg-[rgba(217,119,87,0.1)] px-5 py-2 text-[13px] text-[var(--orange)]">
      {children}
    </span>
  );
}

/* ─── Open Source Banner ─── */
function OpenSourceBanner() {
  return (
    <div className="flex w-full items-center justify-center gap-3 bg-[var(--orange)] px-4 py-2.5">
      <span className="text-sm font-semibold text-white">
        Open Source &amp; Free Forever
      </span>
      <span className="text-sm text-white/80">—</span>
      <a
        href={GITHUB_URL}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white underline underline-offset-2 transition-opacity hover:opacity-80"
      >
        <Github className="h-3.5 w-3.5" />
        Star us on GitHub
      </a>
    </div>
  );
}

/* ─── Header ─── */
function Header() {
  return (
    <header className="flex h-[72px] w-full items-center justify-between bg-[var(--light)] px-5 md:px-10 lg:px-20">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl">&#127908;</span>
        <span className="font-serif-display text-[26px] text-[var(--dark)]">
          VoicePaste
        </span>
      </Link>

      {/* Nav */}
      <nav className="hidden lg:flex items-center gap-8">
        {[
          { label: "How It Works", href: "#how-it-works" },
          { label: "Features", href: "#features" },
          { label: "Privacy", href: "/privacy-security" },
          { label: "FAQ", href: "#faq" },
          { label: "GitHub", href: GITHUB_URL },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-sm text-[var(--mid-gray)] transition-colors duration-200 hover:text-[var(--dark)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* CTA */}
      <a
        href={DOWNLOAD_URL}
        className="flex h-11 items-center justify-center rounded-[10px] bg-[var(--orange)] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-[var(--orange-hover)] hover:shadow-lg hover:shadow-[var(--orange)]/20 hover:-translate-y-[1px]"
      >
        Download Free
      </a>
    </header>
  );
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center gap-10 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] pt-20 md:pt-[100px] lg:pt-[140px] pb-16 md:pb-20 lg:pb-[100px]">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_25%,rgba(217,119,87,0.35),transparent)]" />

      {/* Floating decorations */}
      <ParallaxDecoration speed={0.08} className="hidden md:block absolute top-[60px] left-[80px] opacity-10">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ animation: "float-slow 8s ease-in-out infinite" }}>
          <circle cx="60" cy="60" r="55" stroke="#d97757" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </ParallaxDecoration>
      <ParallaxDecoration speed={-0.06} className="hidden md:block absolute top-[120px] right-[100px] opacity-[0.07]">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ animation: "float 6s ease-in-out infinite 1s" }}>
          <circle cx="40" cy="40" r="35" stroke="#b0aea5" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </ParallaxDecoration>
      <ParallaxDecoration speed={0.12} className="hidden md:block absolute bottom-[80px] left-[200px] opacity-[0.06]">
        <div className="h-3 w-3 rounded-full bg-[var(--orange)]" style={{ animation: "breathe 4s ease-in-out infinite" }} />
      </ParallaxDecoration>

      <div className="relative z-10 flex flex-col items-center gap-10">
        <div className="hero-enter">
          <Badge>Now on macOS</Badge>
        </div>

        <div className="hero-enter" style={{ animationDelay: "0.1s" }}>
          <Waveform
            heights={[16, 28, 44, 22, 38, 50, 32, 44, 20, 38, 28, 16]}
            animated
          />
        </div>

        <h1
          className="hero-enter font-serif-display max-w-[1000px] text-center text-[40px] md:text-[64px] lg:text-[96px] leading-[1] tracking-[-1px] md:tracking-[-2px] lg:tracking-[-3px] text-white"
          style={{ animationDelay: "0.15s" }}
        >
          Speak naturally, paste perfectly.
        </h1>

        <p
          className="hero-enter max-w-[650px] text-center text-base md:text-lg lg:text-[22px] leading-[1.6] text-[var(--mid-gray)]"
          style={{ animationDelay: "0.25s" }}
        >
          Open-source voice-to-text for macOS. Your voice becomes polished text — instantly, in any app. 50+ languages. Free forever.
        </p>

        {/* CTA buttons */}
        <div
          className="hero-enter flex flex-col sm:flex-row items-center gap-4"
          style={{ animationDelay: "0.35s" }}
        >
          <a
            href={DOWNLOAD_URL}
            className="w-full sm:w-auto group flex h-14 items-center justify-center rounded-[14px] bg-[var(--orange)] px-10 text-[17px] font-semibold text-white transition-all duration-300 hover:bg-[var(--orange-hover)] hover:shadow-xl hover:shadow-[var(--orange)]/25 hover:-translate-y-[2px]"
          >
            Download for macOS
          </a>
          <a
            href={GITHUB_URL}
            className="w-full sm:w-auto flex h-14 items-center justify-center rounded-[14px] border-[1.5px] border-[var(--mid-gray)] px-10 text-[17px] text-[var(--mid-gray)] transition-all duration-300 hover:border-white hover:text-white hover:-translate-y-[1px]"
          >
            View on GitHub
          </a>
        </div>

        <p
          className="hero-enter text-sm text-[rgba(176,174,165,0.6)]"
          style={{ animationDelay: "0.45s" }}
        >
          100% open source &middot; Free forever &middot; No account required
        </p>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Hold Your Key",
      desc: "Press and hold your hotkey. VoicePaste starts listening instantly -- no menus, no clicks.",
      highlight: true,
    },
    {
      num: "2",
      title: "Speak Freely",
      desc: "Talk naturally. Ramble, pause, think out loud. AI handles the rest.",
      highlight: false,
    },
    {
      num: "3",
      title: "Text Appears",
      desc: "Polished, clean text lands at your cursor. In any app. Like magic.",
      highlight: false,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="flex w-full flex-col items-center gap-12 bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]"
    >
      <div className="fade-in">
        <Badge>How It Works</Badge>
      </div>
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-white">
        Three Steps. Zero Effort.
      </h2>
      <p className="fade-in max-w-[550px] text-center text-xl text-[rgba(176,174,165,0.8)]">
        No complex setup, no learning curve. Just bring your own OpenAI API key and start talking.
      </p>

      <div className="flex w-full flex-col md:flex-row gap-6">
        {steps.map((s, i) => (
          <div
            key={s.num}
            className={`slide-up group flex flex-1 flex-col gap-5 rounded-[20px] bg-[#1a1a19] p-6 md:p-8 lg:p-10 border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20 ${
              s.highlight
                ? "border-[rgba(217,119,87,0.2)] hover:border-[rgba(217,119,87,0.4)]"
                : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
            }`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--orange)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[var(--orange)]/30">
              <span className="text-[22px] font-bold text-white">{s.num}</span>
            </div>
            <h3 className="text-lg md:text-xl lg:text-[22px] font-semibold text-white">{s.title}</h3>
            <p className="text-sm leading-[1.6] text-[var(--mid-gray)]">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Vibe Coding Demo Section ─── */
function DemoShowcase() {
  return (
    <section className="relative flex w-full flex-col items-center gap-12 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(217,119,87,0.12),transparent)]" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="fade-in">
          <Badge>Live Demo</Badge>
        </div>
        <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-white">
          Voice to Code, In Seconds
        </h2>
        <p className="fade-in max-w-[600px] text-center text-xl text-[var(--mid-gray)]">
          Watch your natural speech transform into polished commands and production-ready code.
        </p>
      </div>

      {/* Demo container with glow effect */}
      <div className="scale-in relative z-10 w-full max-w-[1100px]" style={{ transitionDelay: "0.2s" }}>
        {/* Outer glow */}
        <div
          className="pointer-events-none absolute -inset-4 rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(217,119,87,0.15),transparent_70%)]"
          style={{ animation: "glow-pulse 4s ease-in-out infinite" }}
        />
        {/* Demo wrapper */}
        <div className="relative overflow-hidden rounded-[20px] border border-[rgba(217,119,87,0.15)] shadow-2xl shadow-black/30">
          <VibeCodingDemo />
        </div>
      </div>
    </section>
  );
}

/* ─── Core Features ─── */
function CoreFeatures() {
  return (
    <section
      id="features"
      className="relative flex w-full flex-col items-center gap-8 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]"
    >
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,rgba(217,119,87,0.15),transparent)]" />

      <div className="relative z-10 flex w-full flex-col items-center gap-8">
        <div className="fade-in">
          <Badge>Features</Badge>
        </div>
        <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-white">
          Your Voice, Perfected
        </h2>
        <p className="fade-in max-w-[650px] text-center text-xl text-[var(--mid-gray)]">
          VoicePaste doesn&apos;t just transcribe — it thinks. Your messy
          thoughts become clear, polished writing. All running locally on your machine.
        </p>

        <div className="flex w-full flex-col gap-16 lg:gap-24">
          {/* Feature 1: AI Polish */}
          <div className="flex w-full flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="slide-in-left flex flex-1 flex-col gap-6">
              <h3 className="text-2xl md:text-[28px] lg:text-[32px] font-semibold text-white">
                AI That Thinks Like You
              </h3>
              <p className="text-[17px] leading-[1.7] text-[var(--mid-gray)]">
                Speak naturally -- with pauses, corrections, and filler words. VoicePaste understands context and delivers text that reads like you spent time writing it.
              </p>
              <div className="flex flex-col gap-3 mt-2">
                {[
                  "Removes filler words, false starts, and repetitions",
                  "Preserves your meaning and natural tone",
                  "Works across 90+ languages seamlessly",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(217,119,87,0.12)]">
                      <span className="text-[10px] text-[var(--orange)]">&#10003;</span>
                    </div>
                    <span className="text-sm text-[rgba(176,174,165,0.8)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="scale-in h-[300px] md:h-[350px] lg:h-[400px] w-full lg:w-[540px] shrink-0 overflow-hidden rounded-[20px] border border-[rgba(217,119,87,0.15)] transition-all duration-500 hover:border-[rgba(217,119,87,0.3)] hover:shadow-xl hover:shadow-[var(--orange)]/10" style={{ transitionDelay: "0.1s" }}>
              <PolishDemo />
            </div>
          </div>

          {/* Feature 2: Smart Itemize */}
          <div className="flex w-full flex-col-reverse lg:flex-row items-center gap-8 lg:gap-16">
            <div className="scale-in h-[300px] md:h-[350px] lg:h-[400px] w-full lg:w-[540px] shrink-0 overflow-hidden rounded-[20px] border border-[rgba(120,140,93,0.15)] transition-all duration-500 hover:border-[rgba(120,140,93,0.3)] hover:shadow-xl hover:shadow-[var(--green)]/10" style={{ transitionDelay: "0.1s" }}>
              <ItemizeDemo />
            </div>
            <div className="slide-in-right flex flex-1 flex-col gap-6">
              <h3 className="text-2xl md:text-[28px] lg:text-[32px] font-semibold text-white">
                From Stream of Thought to Structure
              </h3>
              <p className="text-[17px] leading-[1.7] text-[var(--mid-gray)]">
                Say &ldquo;first, second, and third&rdquo; -- VoicePaste detects the pattern and organizes your speech into clean, numbered lists automatically. No formatting needed.
              </p>
              <div className="flex flex-col gap-3 mt-2">
                {[
                  "Auto-detects sequential patterns in natural speech",
                  "Converts rambling into structured action items",
                  "Perfect for meeting notes, to-dos, and brainstorms",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(120,140,93,0.12)]">
                      <span className="text-[10px] text-[var(--green)]">&#10003;</span>
                    </div>
                    <span className="text-sm text-[rgba(176,174,165,0.8)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Feature Grid ─── */
const gridCards = [
  {
    icon: Zap,
    title: "Instant Polish",
    desc: "Every 'um', 'like', and filler word vanishes. What's left reads like you meant every word.",
  },
  {
    icon: Sparkles,
    title: "Auto Punctuation",
    desc: "Commas, periods, question marks -- all placed perfectly. You just talk.",
  },
  {
    icon: BookOpen,
    title: "Your Dictionary",
    desc: "Teach VoicePaste your jargon, product names, and technical terms. It learns your language.",
  },
  {
    icon: Lock,
    title: "Private by Design",
    desc: "Your voice data is never stored. Audio is processed and deleted instantly. Always.",
  },
  {
    icon: Monitor,
    title: "Lives in Your Menu Bar",
    desc: "No windows to manage. VoicePaste sits quietly in your menu bar, always one key press away.",
  },
  {
    icon: History,
    title: "Full History",
    desc: "Every transcription saved locally. Browse, search, and revisit your voice notes anytime.",
  },
];

function FeatureGrid() {
  return (
    <section className="flex w-full flex-col items-center gap-14 bg-[var(--light)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-[var(--dark)]">
        Built for Your Daily Flow
      </h2>

      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gridCards.map((c, i) => (
          <div
            key={c.title}
            className="slide-up group flex flex-col gap-5 rounded-3xl border border-[var(--light-gray)] bg-white p-6 md:p-8 lg:p-9 transition-[box-shadow,border-color] duration-500 hover:shadow-xl hover:shadow-black/5 hover:border-[var(--orange)]/20"
            style={{ transitionDelay: `${i * 0.06}s` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--orange-light)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--orange)] group-hover:shadow-lg group-hover:shadow-[var(--orange)]/20">
              <c.icon className="h-6 w-6 text-[var(--orange)] transition-colors duration-300 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--dark)]">
              {c.title}
            </h3>
            <p className="text-sm leading-[1.6] text-[var(--mid-gray)]">
              {c.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Stats() {
  return (
    <section className="relative flex w-full flex-col items-center gap-12 md:gap-16 lg:gap-20 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_20%_30%,rgba(217,119,87,0.12),transparent)]" />

      {/* Stats with count-up */}
      <div className="fade-in relative z-10 flex w-full flex-col md:flex-row gap-8 md:gap-12">
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="font-mono-display text-[40px] md:text-[52px] lg:text-[64px] font-bold text-white">
            <CountUp value={50} suffix="+" />
          </span>
          <span className="text-base text-[var(--mid-gray)]">Languages Supported</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="font-mono-display text-[40px] md:text-[52px] lg:text-[64px] font-bold text-white">
            <CountUp value={2} prefix="~" suffix="s" />
          </span>
          <span className="text-base text-[var(--mid-gray)]">End-to-End Latency</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="font-mono-display text-[40px] md:text-[52px] lg:text-[64px] font-bold text-white">
            100%
          </span>
          <span className="text-base text-[var(--mid-gray)]">Open Source &amp; Free</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Open Source ─── */
function OpenSource() {
  return (
    <section
      id="open-source"
      className="flex w-full flex-col items-center gap-12 bg-[var(--light)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]"
    >
      <div className="fade-in">
        <Badge>Open Source</Badge>
      </div>
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-[var(--dark)]">
        Free Forever. No Catch.
      </h2>
      <p className="fade-in max-w-[600px] text-center text-xl text-[var(--mid-gray)]">
        VoicePaste is 100% open source under the MIT license. No subscription, no usage limits, no account required. Just bring your own OpenAI API key.
      </p>

      <div
        className="fade-in flex gap-8"
        style={{ transitionDelay: "0.1s" }}
      >
        <div className="group flex w-full max-w-[520px] flex-col gap-6 rounded-[28px] border border-[var(--light-gray)] bg-white p-6 md:p-8 lg:p-11 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5">
          <div className="flex items-end gap-1">
            <span className="font-mono-display text-[40px] md:text-[48px] lg:text-[56px] text-[var(--dark)]">
              $0
            </span>
            <span className="mb-2 text-base text-[var(--mid-gray)]">
              forever
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              "Unlimited transcriptions",
              "AI speech polish (GPT-powered)",
              "50+ languages with auto-detection",
              "Custom dictionary",
              "Local history & stats",
              "Context-aware transcription",
              "Fully customizable polish prompt",
            ].map((f) => (
              <div key={f} className="flex items-center gap-[10px]">
                <span className="text-sm text-[var(--green)]">&#10003;</span>
                <span className="text-sm text-[var(--dark)]">{f}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={DOWNLOAD_URL}
              className="flex h-12 flex-1 items-center justify-center rounded-[10px] bg-[var(--orange)] text-sm font-bold text-white transition-all duration-300 hover:bg-[var(--orange-hover)] hover:shadow-lg hover:shadow-[var(--orange)]/20"
            >
              Download for macOS
            </a>
            <a
              href={GITHUB_URL}
              className="flex h-12 flex-1 items-center justify-center rounded-[10px] border-[1.5px] border-[var(--orange)] text-sm font-bold text-[var(--orange)] transition-all duration-300 hover:bg-[var(--orange)] hover:text-white"
            >
              View Source on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  {
    q: "How does VoicePaste work?",
    a: "VoicePaste is a macOS desktop app that runs in your menu bar. Press the backtick key (`), speak naturally, and AI-polished text appears at your cursor in any app.",
  },
  {
    q: "Is VoicePaste really free?",
    a: "Yes, 100%. VoicePaste is fully open source under the MIT license — free forever, no usage limits, no subscription. You just need your own OpenAI API key (which has its own usage costs).",
  },
  {
    q: "Is my data private?",
    a: "Yes. All data (history, dictionary, settings) is stored locally on your machine as JSON files. Audio goes to OpenAI's API for transcription and is not stored. The code is open source — you can verify this yourself.",
  },
  {
    q: "What languages does VoicePaste support?",
    a: "VoicePaste supports 50+ languages with automatic detection. You can switch languages mid-sentence (code-switching) and each word stays in its original language.",
  },
  {
    q: "Which apps does VoicePaste work with?",
    a: "Any app on macOS that accepts text input — Slack, Gmail, VS Code, Notes, Notion, anything. Text appears wherever your cursor is.",
  },
  {
    q: "Can I customize how the AI polishes my text?",
    a: "Yes. The polish prompt is fully customizable — edit src/main/openai-service.ts to tune how your speech gets cleaned up. It's your code.",
  },
];

function FAQ() {
  return (
    <section
      id="faq"
      className="flex w-full flex-col items-center gap-14 bg-[var(--light)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]"
    >
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-[var(--dark)]">
        Questions? Answers.
      </h2>

      <div
        className="fade-in flex w-full max-w-[800px] flex-col gap-4"
        style={{ transitionDelay: "0.1s" }}
      >
        {faqs.map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="relative flex w-full flex-col items-center gap-9 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[120px]">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(217,119,87,0.3),transparent)]" />

      <div className="relative z-10 flex flex-col items-center gap-9">
        <div className="fade-in">
          <Waveform heights={[20, 36, 48, 36, 20]} animated />
        </div>

        <h2 className="fade-in font-serif-display text-center text-3xl md:text-[40px] lg:text-[56px] leading-[1.1] tracking-tight lg:tracking-[-1px] text-white">
          Start Using VoicePaste Today.
        </h2>

        <p
          className="fade-in max-w-[550px] text-center text-xl text-[var(--mid-gray)]"
          style={{ transitionDelay: "0.1s" }}
        >
          Quicker thoughts, easier capture, better writing. Open source and free forever.
        </p>

        <div
          className="fade-in flex flex-col sm:flex-row items-center gap-4"
          style={{ transitionDelay: "0.2s" }}
        >
          <a
            href={DOWNLOAD_URL}
            className="w-full sm:w-auto flex h-[60px] items-center justify-center rounded-[14px] bg-[var(--orange)] px-12 text-lg font-semibold text-white transition-all duration-300 hover:bg-[var(--orange-hover)] hover:shadow-xl hover:shadow-[var(--orange)]/25 hover:-translate-y-[2px]"
          >
            Download for macOS
          </a>
          <a
            href={GITHUB_URL}
            className="w-full sm:w-auto flex h-[60px] items-center justify-center rounded-[14px] border-[1.5px] border-[var(--mid-gray)] px-10 text-lg text-[var(--mid-gray)] transition-all duration-300 hover:border-white hover:text-white hover:-translate-y-[1px]"
          >
            View on GitHub
          </a>
        </div>

        <p
          className="fade-in text-sm text-[rgba(176,174,165,0.6)]"
          style={{ transitionDelay: "0.3s" }}
        >
          macOS app &middot; 100% open source &middot; No account required
        </p>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const columns = [
    {
      header: "PRODUCT",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Download", href: DOWNLOAD_URL },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      header: "OPEN SOURCE",
      links: [
        { label: "GitHub", href: GITHUB_URL },
        { label: "Issues", href: `${GITHUB_URL}/issues` },
        { label: "MIT License", href: `${GITHUB_URL}/blob/main/LICENSE` },
      ],
    },
    {
      header: "LEGAL",
      links: [
        { label: "Privacy & Security", href: "/privacy-security" },
      ],
    },
  ];

  return (
    <footer className="flex w-full flex-col gap-12 bg-[var(--canvas-dark)] px-6 md:px-10 lg:px-16 py-8 md:py-12">
      {/* Top */}
      <div className="flex w-full flex-col md:flex-row gap-8 md:gap-16">
        {/* Brand */}
        <div className="flex flex-1 flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">&#127908;</span>
            <span className="font-serif-display text-xl text-white">VoicePaste</span>
          </Link>
          <p className="text-sm text-[var(--mid-gray)]">
            Speak naturally, paste perfectly.
          </p>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.header} className="flex flex-1 flex-col gap-3">
            <span className="text-xs font-bold tracking-[1px] text-white">
              {col.header}
            </span>
            {col.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm transition-colors hover:text-white ${
                  link.label === "Privacy & Security"
                    ? "text-[var(--green)]"
                    : "text-[var(--mid-gray)]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[#333333]" />

      {/* Bottom */}
      <div className="flex w-full flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-[13px] text-[var(--mid-gray)]">
          &copy; 2026 VoicePaste. Open source under MIT license.
        </span>
        <div className="flex items-center gap-6">
          <a
            href={GITHUB_URL}
            className="flex items-center gap-2 text-[13px] text-[var(--mid-gray)] transition-colors hover:text-white"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          <Link
            href="/privacy-security"
            className="flex items-center gap-2 text-[13px] text-[var(--green)] transition-colors hover:text-white"
          >
            <Shield className="h-3.5 w-3.5" />
            Privacy & Security
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <ScrollObserver />
      <OpenSourceBanner />
      <Header />
      <Hero />
      <HowItWorks />
      <DemoShowcase />
      <CoreFeatures />
      <FeatureGrid />
      <Stats />
      <OpenSource />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
