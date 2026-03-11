import {
  Shield,
  Lock,
  Eye,
  Database,
  Trash2,
  CheckCircle,
  Send,
  Mic,
  HardDrive,
  FileSearch,
  ShieldCheck,
  ArrowRight,
  X,
  ChevronDown,
} from "lucide-react";
import { ScrollObserver, FAQItem } from "../components/motion";
import Link from "next/link";

const DOWNLOAD_URL = "/download";

/* ─── Header (shared) ─── */
function Header() {
  return (
    <header className="flex h-[72px] w-full items-center justify-between bg-[var(--light)] px-5 md:px-10 lg:px-20">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl">&#127908;</span>
        <span className="font-serif-display text-[26px] text-[var(--dark)]">
          One Percent
        </span>
      </Link>

      <nav className="hidden lg:flex items-center gap-8">
        {[
          { label: "How It Works", href: "/#how-it-works" },
          { label: "Features", href: "/#features" },
          { label: "Pricing", href: "/#pricing" },
          { label: "Privacy", href: "/privacy-security" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`text-sm transition-colors hover:text-[var(--dark)] ${
              item.label === "Privacy"
                ? "text-[var(--green)] font-medium"
                : "text-[var(--mid-gray)]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

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
function PrivacyHero() {
  return (
    <section className="relative flex w-full flex-col items-center gap-8 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] pt-20 md:pt-[100px] lg:pt-[120px] pb-16 md:pb-20 lg:pb-[80px]">
      {/* Background glow - green tinted */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_30%,rgba(120,140,93,0.25),transparent)]" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Shield icon with pulse */}
        <div
          className="hero-enter flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(120,140,93,0.15)] border border-[rgba(120,140,93,0.3)]"
          style={{ animation: "hero-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, shield-pulse 3s ease-in-out infinite 1s" }}
        >
          <Shield className="h-11 w-11 text-[var(--green)]" />
        </div>

        <span
          className="hero-enter inline-flex items-center rounded-full border border-[rgba(120,140,93,0.3)] bg-[rgba(120,140,93,0.1)] px-5 py-2 text-[13px] text-[var(--green)]"
          style={{ animationDelay: "0.1s" }}
        >
          Privacy & Security
        </span>

        <h1
          className="hero-enter font-serif-display max-w-[900px] text-center text-[36px] md:text-[52px] lg:text-[72px] leading-[1.05] tracking-[-1px] lg:tracking-[-2px] text-white"
          style={{ animationDelay: "0.15s" }}
        >
          Your data stays on <em className="text-[var(--green)]">your</em> device.
        </h1>

        <p
          className="hero-enter max-w-[600px] text-center text-base md:text-lg lg:text-[20px] leading-[1.7] text-[var(--mid-gray)]"
          style={{ animationDelay: "0.25s" }}
        >
          We built One Percent with a simple principle: your voice, your text, your data.
          Nothing leaves your Mac unless you choose to send it.
        </p>
      </div>
    </section>
  );
}

/* ─── Key Principles ─── */
function KeyPrinciples() {
  const principles = [
    {
      icon: HardDrive,
      title: "100% Local Storage",
      desc: "All transcription history lives on your device. Your Mac is the only server that matters.",
      delay: "0s",
    },
    {
      icon: Mic,
      title: "Audio Never Stored",
      desc: "Voice recordings are processed in real-time and deleted immediately. We never keep audio files.",
      delay: "0.08s",
    },
    {
      icon: Eye,
      title: "Full Transparency",
      desc: "View, search, edit, and delete your transcription history anytime. It is your data, you control it.",
      delay: "0.16s",
    },
    {
      icon: Lock,
      title: "No Cloud Storage",
      desc: "We do not store your personal data on any cloud servers. Zero data retention, period.",
      delay: "0.24s",
    },
    {
      icon: ShieldCheck,
      title: "No Third-Party Sharing",
      desc: "Your data is never sold, shared, or leaked to advertisers or third parties. Not now, not ever.",
      delay: "0.32s",
    },
    {
      icon: FileSearch,
      title: "You Own Your Data",
      desc: "Export, modify, or delete everything at any time. Full ownership means full control.",
      delay: "0.4s",
    },
  ];

  return (
    <section className="flex w-full flex-col items-center gap-14 bg-[var(--light)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-[var(--dark)]">
        Privacy is Not a Feature. It&apos;s a Promise.
      </h2>
      <p className="fade-in max-w-[600px] text-center text-lg text-[var(--mid-gray)]">
        Every design decision we make starts with one question: does this protect our users?
      </p>

      <div className="grid w-full max-w-[1100px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {principles.map((p) => (
          <div
            key={p.title}
            className="slide-up group flex flex-col gap-5 rounded-3xl border border-[var(--light-gray)] bg-white p-6 md:p-8 lg:p-9 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:border-[var(--green)]/20"
            style={{ transitionDelay: p.delay }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(120,140,93,0.1)] transition-all duration-300 group-hover:bg-[rgba(120,140,93,0.18)] group-hover:scale-110">
              <p.icon className="h-6 w-6 text-[var(--green)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--dark)]">{p.title}</h3>
            <p className="text-sm leading-[1.7] text-[var(--mid-gray)]">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Comparison ─── */
function Comparison() {
  const localData = [
    "Your transcription history (JSON files)",
    "Your custom dictionary",
    "Your settings & preferences",
    "Your OpenAI API key",
  ];

  const neverCollected = [
    "Your voice recordings",
    "Your transcribed text content",
    "Personal files or documents",
    "Usage analytics or telemetry",
    "Biometric or voiceprint data",
    "Any data shared with third parties",
  ];

  return (
    <section className="relative flex w-full flex-col items-center gap-14 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(120,140,93,0.1),transparent)]" />

      <h2 className="fade-in font-serif-display relative z-10 text-3xl md:text-4xl lg:text-5xl text-white">
        Complete Transparency
      </h2>

      <div className="fade-in relative z-10 flex w-full max-w-[900px] flex-col md:flex-row gap-8" style={{ transitionDelay: "0.1s" }}>
        {/* What stays on your device */}
        <div className="flex flex-1 flex-col gap-6 rounded-3xl border border-[rgba(120,140,93,0.2)] bg-[#1a1a19] p-6 md:p-8 lg:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(120,140,93,0.15)]">
              <HardDrive className="h-5 w-5 text-[var(--green)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--green)]">What Stays On Your Device</h3>
          </div>
          <div className="flex flex-col gap-4">
            {localData.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]" />
                <span className="text-sm leading-[1.6] text-[var(--mid-gray)]">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--mid-gray)]/60">
            * All data stored as local JSON files on your Mac
          </p>
        </div>

        {/* What we NEVER collect */}
        <div className="flex flex-1 flex-col gap-6 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a19] p-6 md:p-8 lg:p-9">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(217,119,87,0.12)]">
              <X className="h-5 w-5 text-[var(--orange)]" />
            </div>
            <h3 className="text-lg font-semibold text-white">What We Never Collect</h3>
          </div>
          <div className="flex flex-col gap-4">
            {neverCollected.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--orange)]/60" />
                <span className="text-sm leading-[1.6] text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Data Lifecycle Timeline ─── */
function DataLifecycle() {
  const steps = [
    {
      icon: Mic,
      title: "You Speak",
      desc: "Audio captured temporarily in memory",
      color: "var(--orange)",
      bgColor: "rgba(217,119,87,0.1)",
      borderColor: "rgba(217,119,87,0.2)",
    },
    {
      icon: Send,
      title: "Sent to OpenAI",
      desc: "Audio sent via your API key for transcription & polish",
      color: "#6a9bcc",
      bgColor: "rgba(106,155,204,0.1)",
      borderColor: "rgba(106,155,204,0.2)",
    },
    {
      icon: Trash2,
      title: "Audio Deleted",
      desc: "Voice recording purged immediately after processing",
      color: "var(--orange)",
      bgColor: "rgba(217,119,87,0.1)",
      borderColor: "rgba(217,119,87,0.2)",
    },
    {
      icon: HardDrive,
      title: "Text Saved Locally",
      desc: "Polished text stored on your Mac as JSON",
      color: "var(--green)",
      bgColor: "rgba(120,140,93,0.1)",
      borderColor: "rgba(120,140,93,0.2)",
    },
  ];

  return (
    <section className="flex w-full flex-col items-center gap-14 bg-[var(--light)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-[var(--dark)]">
        Your Data Lifecycle
      </h2>
      <p className="fade-in max-w-[550px] text-center text-lg text-[var(--mid-gray)]">
        From voice to text in seconds. Audio deleted instantly. Text stored only on your device.
      </p>

      <div className="fade-in relative flex w-full max-w-[1000px] flex-col md:flex-row items-center justify-between gap-8 md:gap-0" style={{ transitionDelay: "0.15s" }}>
        {/* Connecting line */}
        <div className="hidden md:block absolute top-[44px] left-[80px] right-[80px] h-[2px] bg-[var(--light-gray)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--orange)] via-[#6a9bcc] to-[var(--green)] opacity-40" />
        </div>

        {steps.map((s, i) => (
          <div key={s.title} className="relative z-10 flex w-full md:w-auto flex-col items-center gap-4" style={{ maxWidth: 200 }}>
            <div
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-2 bg-white"
              style={{
                borderColor: s.borderColor,
                animation: i === 3 ? "dot-pulse 2.5s ease-in-out infinite" : undefined,
              }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: s.bgColor }}
              >
                <s.icon className="h-6 w-6" style={{ color: s.color }} />
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight
                className="absolute top-[36px] -right-[18px] hidden md:block h-5 w-5 text-[var(--mid-gray)]"
                style={{ opacity: 0.4 }}
              />
            )}
            <h3 className="text-center text-base font-semibold text-[var(--dark)]">{s.title}</h3>
            <p className="text-center text-xs leading-[1.6] text-[var(--mid-gray)]">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Trust Badges ─── */
function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      desc: "All network communication uses TLS 1.3",
    },
    {
      icon: Database,
      title: "Zero Data Retention",
      desc: "No server-side storage of user content",
    },
    {
      icon: Lock,
      title: "Local-First Architecture",
      desc: "Your data never needs to leave your device",
    },
    {
      icon: ShieldCheck,
      title: "Regular Security Audits",
      desc: "Continuous review of security practices",
    },
  ];

  return (
    <section className="relative flex w-full flex-col items-center gap-14 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_80%_30%,rgba(120,140,93,0.1),transparent)]" />

      <h2 className="fade-in font-serif-display relative z-10 text-3xl md:text-4xl lg:text-5xl text-white">
        Built on Trust
      </h2>

      <div className="fade-in relative z-10 grid w-full max-w-[900px] grid-cols-1 md:grid-cols-2 gap-6" style={{ transitionDelay: "0.1s" }}>
        {badges.map((b) => (
          <div
            key={b.title}
            className="group flex items-start gap-5 rounded-2xl border border-[rgba(120,140,93,0.15)] bg-[#1a1a19] p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(120,140,93,0.3)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(120,140,93,0.12)] transition-all duration-300 group-hover:bg-[rgba(120,140,93,0.2)]">
              <b.icon className="h-6 w-6 text-[var(--green)]" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">{b.title}</h3>
              <p className="text-sm leading-[1.6] text-[var(--mid-gray)]">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Privacy FAQ ─── */
const privacyFaqs = [
  {
    q: "Where is my transcription data stored?",
    a: "All transcription data is stored locally on your Mac using secure local storage. It never leaves your device unless you explicitly copy and paste it somewhere.",
  },
  {
    q: "Is my voice recorded and saved?",
    a: "No. Audio is captured temporarily in memory for processing and is deleted immediately after transcription. We never save, store, or transmit audio recordings.",
  },
  {
    q: "Can One Percent access my other files or apps?",
    a: "No. One Percent only requests the Accessibility permission (to type text at your cursor) and Microphone permission (to hear your voice). It cannot read your files, emails, or any other app data.",
  },
  {
    q: "Do you use my data to train AI models?",
    a: "No. Your transcriptions are never used for AI training. Audio is processed through speech recognition APIs and immediately discarded. The polished text is only stored on your local device.",
  },
  {
    q: "What happens if I delete the app?",
    a: "All local data is removed with the app. Since we don't store anything in the cloud, uninstalling One Percent means all your data is completely gone. You can also manually clear your history at any time from within the app.",
  },
  {
    q: "Do you share data with third parties?",
    a: "Never. We do not sell, share, or provide access to any user data to advertisers, data brokers, or any third parties. Period.",
  },
  {
    q: "What analytics do you collect?",
    a: "We collect only anonymous, aggregated usage statistics (like feature popularity and crash reports) to improve the app. This is entirely opt-in, and no personal content is ever included.",
  },
];

function PrivacyFAQ() {
  return (
    <section className="flex w-full flex-col items-center gap-14 bg-[var(--light)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <h2 className="fade-in font-serif-display text-3xl md:text-4xl lg:text-5xl text-[var(--dark)]">
        Privacy Questions? Answers.
      </h2>

      <div
        className="fade-in flex w-full max-w-[800px] flex-col gap-4"
        style={{ transitionDelay: "0.1s" }}
      >
        {privacyFaqs.map((f, i) => (
          <FAQItem key={i} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function PrivacyCTA() {
  return (
    <section className="relative flex w-full flex-col items-center gap-9 overflow-hidden bg-[var(--dark)] px-6 md:px-16 lg:px-[120px] py-16 md:py-20 lg:py-[100px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(120,140,93,0.2),transparent)]" />

      <div className="relative z-10 flex flex-col items-center gap-9">
        <div className="fade-in flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(120,140,93,0.15)]">
          <Shield className="h-8 w-8 text-[var(--green)]" />
        </div>

        <h2 className="fade-in font-serif-display text-center text-3xl md:text-[40px] lg:text-[48px] leading-[1.1] tracking-tight lg:tracking-[-1px] text-white">
          Your Privacy. Our Priority.
        </h2>

        <p
          className="fade-in max-w-[500px] text-center text-lg text-[var(--mid-gray)]"
          style={{ transitionDelay: "0.1s" }}
        >
          Experience voice-to-text that respects your data as much as your time.
        </p>

        <a
          href={DOWNLOAD_URL}
          className="fade-in flex h-[56px] items-center justify-center rounded-[14px] bg-[var(--green)] px-10 text-lg font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[var(--green)]/20 hover:-translate-y-[1px]"
          style={{ transitionDelay: "0.2s" }}
        >
          Download One Percent Free
        </a>

        <p
          className="fade-in text-sm text-[rgba(176,174,165,0.6)]"
          style={{ transitionDelay: "0.3s" }}
        >
          macOS app &middot; Private by design &middot; Your data stays local
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
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/#pricing" },
        { label: "Download", href: DOWNLOAD_URL },
        { label: "Changelog", href: "#" },
      ],
    },
    {
      header: "COMPANY",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      header: "LEGAL",
      links: [
        { label: "Privacy & Security", href: "/privacy-security" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
      ],
    },
  ];

  return (
    <footer className="flex w-full flex-col gap-12 bg-[var(--canvas-dark)] px-6 md:px-10 lg:px-16 py-8 md:py-12">
      <div className="flex w-full flex-col md:flex-row gap-8 md:gap-16">
        <div className="flex flex-1 flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">&#127908;</span>
            <span className="font-serif-display text-xl text-white">One Percent</span>
          </Link>
          <p className="text-sm text-[var(--mid-gray)]">
            Progress, one percent at a time.
          </p>
        </div>

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

      <div className="h-px w-full bg-[#333333]" />

      <div className="flex w-full justify-center">
        <span className="text-[13px] text-[var(--mid-gray)]">
          &copy; 2026 One Percent. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function PrivacySecurityPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <ScrollObserver />
      <Header />
      <PrivacyHero />
      <KeyPrinciples />
      <Comparison />
      <DataLifecycle />
      <TrustBadges />
      <PrivacyFAQ />
      <PrivacyCTA />
      <Footer />
    </main>
  );
}
