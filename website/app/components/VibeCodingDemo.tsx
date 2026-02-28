"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const SCENARIOS = [
  {
    raw: "Um, hey Claude, can you add a WebSocket connection handler to the voice service and uh make sure it handles reconnection with exponential backoff",
    clean: "Add a WebSocket handler to the voice service with reconnection using exponential backoff.",
    terminalCmd: "Add WebSocket handler to voice-service.ts with exponential backoff reconnection",
    agentSteps: [
      "Reading voice-service.ts...",
      "Adding WebSocket connection manager with auto-reconnect...",
      "Implementing exponential backoff (1s to 30s cap)...",
      "Writing tests for reconnection logic...",
    ],
    codeFile: "voice-service.ts",
    codeLines: [
      `interface WSConfig {`,
      `  url: string;`,
      `  maxRetries: number;`,
      `  baseDelay: number;`,
      `}`,
      ``,
      `class VoiceWebSocket {`,
      `  private ws: WebSocket | null = null;`,
      `  private retryCount = 0;`,
      ``,
      `  constructor(private config: WSConfig) {}`,
      ``,
      `  async connect(): Promise<void> {`,
      `    const delay = Math.min(`,
      `      this.config.baseDelay * 2 ** this.retryCount,`,
      `      30_000`,
      `    );`,
      ``,
      `    this.ws = new WebSocket(this.config.url);`,
      `    this.ws.onopen = () => {`,
      `      this.retryCount = 0;`,
      `    };`,
      `    this.ws.onclose = () => {`,
      `      if (this.retryCount < this.config.maxRetries) {`,
      `        this.retryCount++;`,
      `        setTimeout(() => this.connect(), delay);`,
      `      }`,
      `    };`,
      `  }`,
      `}`,
    ],
  },
  {
    raw: "Okay so run the test suite for the transcription module and if anything fails just go ahead and fix it, you know, don't ask me",
    clean: "Run tests for the transcription module. Auto-fix any failures without asking.",
    terminalCmd: "Run transcription tests, auto-fix failures",
    agentSteps: [
      "Running vitest src/transcription/...",
      "Found 1 failure in streaming.test.ts",
      "Fixing flush interval timing (200ms to 250ms)...",
      "Re-running... All 12 passed",
    ],
    codeFile: "streaming.test.ts",
    codeLines: [
      `describe('StreamingTranscription', () => {`,
      `  it('flushes at correct interval', async () => {`,
      `    const stream = new TranscriptionStream({`,
      `      flushInterval: 250, // fixed: was 200`,
      `      bufferSize: 4096,`,
      `    });`,
      ``,
      `    await stream.start();`,
      `    stream.push(mockAudioChunk);`,
      ``,
      `    await vi.advanceTimersByTimeAsync(250);`,
      `    expect(stream.getBuffer()).toHaveLength(0);`,
      `    expect(stream.flushCount).toBe(1);`,
      `  });`,
      ``,
      `  it('handles concurrent streams', async () => {`,
      `    const streams = Array.from(`,
      `      { length: 3 },`,
      `      () => new TranscriptionStream()`,
      `    );`,
      `    await Promise.all(`,
      `      streams.map(s => s.start())`,
      `    );`,
      `    streams.forEach(s =>`,
      `      expect(s.isActive).toBe(true)`,
      `    );`,
      `  });`,
      `});`,
    ],
  },
  {
    raw: "Hey uh refactor the audio pipeline to use a producer consumer pattern and split the chunking logic into its own module",
    clean: "Refactor audio pipeline to producer-consumer pattern. Extract chunking into a dedicated module.",
    terminalCmd: "Refactor audio-pipeline.ts with producer-consumer + separate chunk module",
    agentSteps: [
      "Analyzing audio-pipeline.ts dependencies...",
      "Creating chunk-processor.ts module...",
      "Refactoring pipeline to producer-consumer...",
      "Updating references and running type check...",
    ],
    codeFile: "audio-pipeline.ts",
    codeLines: [
      `const CHUNK_SIZE = 4096;`,
      `const MAX_QUEUE = 64;`,
      ``,
      `type AudioCallback = (chunk: Int16Array) => void;`,
      ``,
      `class AudioProducer {`,
      `  private queue: Int16Array[] = [];`,
      `  private consumers: AudioCallback[] = [];`,
      ``,
      `  enqueue(pcm: Int16Array) {`,
      `    if (this.queue.length >= MAX_QUEUE) {`,
      `      this.queue.shift();`,
      `    }`,
      `    this.queue.push(pcm);`,
      `    this.notify();`,
      `  }`,
      ``,
      `  subscribe(cb: AudioCallback) {`,
      `    this.consumers.push(cb);`,
      `  }`,
      ``,
      `  private notify() {`,
      `    const chunk = this.queue.shift();`,
      `    if (!chunk) return;`,
      `    this.consumers.forEach(cb => cb(chunk));`,
      `  }`,
      `}`,
    ],
  },
];

type Phase = "idle" | "hotkey" | "listening" | "processing" | "sending" | "coding" | "done";

interface Scenario {
  raw: string;
  clean: string;
  terminalCmd: string;
  agentSteps: string[];
  codeFile: string;
  codeLines: string[];
}

/* ── Icons ── */
function StarburstIcon({ size = 24, color = "#d97757" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12.5 6 14 8 18 8.5C14 9.5 12.5 11 12 15C11.5 11 9.5 9.5 6 8.5C9.5 8 11.5 6 12 2Z" fill={color} opacity="0.9" />
      <path d="M18 14C18.3 16 19 17 21 17.2C19 17.6 18.3 18.5 18 20C17.7 18.5 17 17.6 15 17.2C17 17 17.7 16 18 14Z" fill={color} opacity="0.5" />
    </svg>
  );
}

function SquiggleLine({ width = 200, color = "#d97757", style = {} }: { width?: number; color?: string; style?: React.CSSProperties }) {
  const segs = Math.floor(width / 12);
  return (
    <svg width={width} height="8" viewBox={`0 0 ${width} 8`} fill="none" style={{ display: "block", ...style }}>
      <path
        d={`M0 4 ${Array.from({ length: segs }).map((_, i) => `Q${i * 12 + 6} ${i % 2 === 0 ? 0.5 : 7.5} ${(i + 1) * 12} 4`).join(" ")}`}
        stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.45"
      />
    </svg>
  );
}

/* ── Voice Capsule ── */
function VoiceCapsule({ visible, phase, rawText, cleanText, hotkeyPressed }: {
  visible: boolean;
  phase: string;
  rawText: string;
  cleanText: string;
  hotkeyPressed: boolean;
}) {
  return (
    <div style={{
      position: "absolute", bottom: 28, left: "50%",
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      zIndex: 50, width: "min(520px, calc(100% - 32px))", pointerEvents: "none",
    }}>
      <div style={{
        background: "#faf9f5", border: "1.5px solid #e8e6dc", borderRadius: 18,
        padding: "14px 18px",
        boxShadow: "0 12px 40px rgba(20,20,19,0.08), 0 0 0 1px rgba(20,20,19,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: rawText ? 10 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              backgroundColor: phase === "listening" ? "#d97757" : phase === "processing" ? "#6a9bcc" : "#788c5d",
              boxShadow: phase === "listening" ? "0 0 8px rgba(217,119,87,0.4)" : "none",
              animation: phase === "listening" ? "pulse 1.5s infinite" : "none",
            }} />
            <span className="font-poppins" style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const,
              color: phase === "listening" ? "#d97757" : phase === "processing" ? "#6a9bcc" : "#788c5d",
            }}>
              {phase === "listening" ? "Listening..." : phase === "processing" ? "Polishing..." : "Sending to Claude"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, height: 20 }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{
                width: 2, borderRadius: 3, height: phase === "listening" ? undefined : 3,
                backgroundColor: phase === "listening" ? "#d97757" : "#b0aea5",
                opacity: phase === "listening" ? 0.5 + (i % 3) * 0.2 : 0.2,
                animation: phase === "listening" ? `organicWave 1s ease-in-out ${i * 0.06}s infinite alternate` : "none",
                transition: "background-color 0.4s, opacity 0.4s",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {["Opt", "Space"].map(k => (
              <span key={k} className="font-mono-display" style={{
                fontSize: 10, fontWeight: 600,
                padding: "2px 7px", borderRadius: 5,
                color: hotkeyPressed ? "#faf9f5" : "#b0aea5",
                background: hotkeyPressed ? "#d97757" : "#f0eee6",
                border: hotkeyPressed ? "1px solid #c4633a" : "1px solid #e8e6dc",
                transition: "all 0.15s",
              }}>{k}</span>
            ))}
          </div>
        </div>
        {rawText && (
          <div className="font-mono-display" style={{
            fontSize: 12.5, color: cleanText ? "#b0aea5" : "#3d3929", lineHeight: 1.5,
            fontStyle: "italic",
            textDecoration: cleanText ? "line-through" : "none", textDecorationColor: "#ddd9ce",
            transition: "all 0.3s", marginBottom: cleanText ? 8 : 0,
          }}>{rawText}</div>
        )}
        {cleanText && (
          <div className="font-lora" style={{
            fontSize: 13.5, color: "#141413", lineHeight: 1.55,
            fontWeight: 500,
            padding: "8px 12px", background: "rgba(217,119,87,0.04)",
            borderRadius: 8, borderLeft: "2.5px solid #d97757",
          }}>{cleanText}</div>
        )}
      </div>
    </div>
  );
}

/* ── Code color helpers ── */
function codeColor(line: string): string {
  const t = line.trim();
  if (t.startsWith("//")) return "#788c5d";
  if (/^(interface|class|type|const|let|async|await|return|if|private|new|describe|it|expect)\b/.test(t)) return "#6a9bcc";
  if (t.includes("'") || t.includes('"') || t.includes('`')) return "#d97757";
  if (/^\d/.test(t)) return "#d97757";
  if (t === "" || t === "{" || t === "}" || t === ");") return "#4a4940";
  return "#c8c5bc";
}

function termColor(line: string): string {
  if (line.startsWith("\u276F")) return "#788c5d";
  if (line.includes("\u2713")) return "#788c5d";
  if (line.includes("failure") || line.includes("Error")) return "#d97757";
  if (line.includes("Writing") || line.includes("Fixing") || line.includes("Refactoring")) return "#6a9bcc";
  if (line.startsWith("  \u251C") || line.startsWith("  \u2570")) return "#94938c";
  return "#7a796f";
}

/* ── IDE Window ── */
function IDEWindow({ scenario, terminalLines, codeVisible, codeLinesCount, activeStep }: {
  scenario: Scenario;
  terminalLines: string[];
  codeVisible: boolean;
  codeLinesCount: number;
  activeStep: number;
}) {
  return (
    <div style={{
      width: "100%", height: "100%", borderRadius: 14, overflow: "hidden",
      background: "#1a1a18", border: "1.5px solid #2a2a26",
      boxShadow: "0 20px 60px rgba(20,20,19,0.12), 0 0 0 1px rgba(255,255,255,0.02)",
      display: "flex", flexDirection: "column" as const,
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "9px 14px",
        borderBottom: "1px solid #2a2a26", background: "#1f1e1b", flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 6, marginRight: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#d97757", opacity: 0.8 }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a36" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a36" }} />
        </div>
        <div style={{ display: "flex", gap: 1 }}>
          <div className="font-poppins" style={{
            padding: "4px 14px", borderRadius: "6px 6px 0 0", fontSize: 11, fontWeight: 500,
            background: "#1a1a18", color: "#94938c", borderTop: "2px solid #d97757",
          }}>Terminal</div>
          {codeVisible && (
            <div className="font-poppins" style={{
              padding: "4px 14px", borderRadius: "6px 6px 0 0", fontSize: 11, fontWeight: 500,
              background: "#252520", color: "#64635c",
              animation: "fadeIn 0.4s ease",
            }}>{scenario.codeFile}</div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Terminal */}
        <div style={{
          flex: codeVisible ? "0 0 42%" : 1, padding: "16px 18px", overflow: "auto",
          transition: "flex 0.5s ease", borderRight: codeVisible ? "1px solid #2a2a26" : "none",
        }}>
          {terminalLines.map((line, i) => (
            <div key={`${i}-${line.slice(0, 10)}`} className="font-mono-display" style={{
              fontSize: 12, lineHeight: 1.7,
              color: termColor(line), whiteSpace: "pre-wrap" as const,
              opacity: 0, animation: `termIn 0.3s ease ${i * 0.06}s forwards`,
            }}>{line || "\u00A0"}</div>
          ))}
          {terminalLines.length > 0 && activeStep < scenario.agentSteps.length && (
            <div style={{ marginTop: 2 }}>
              <span style={{
                display: "inline-block", width: 7, height: 14,
                backgroundColor: "#d97757", borderRadius: 1,
                animation: "blink 0.9s step-end infinite",
              }} />
            </div>
          )}
        </div>

        {/* Code */}
        {codeVisible && (
          <div style={{ flex: 1, padding: "16px 18px", overflow: "auto", animation: "slideIn 0.5s ease" }}>
            <div className="font-mono-display" style={{
              fontSize: 10.5, color: "#64635c",
              marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
            }}>
              <StarburstIcon size={12} color="#788c5d" />
              <span>{scenario.codeFile}</span>
              {codeLinesCount < scenario.codeLines.length
                ? <span style={{ color: "#788c5d", marginLeft: "auto", fontSize: 10, fontStyle: "italic" }}>writing...</span>
                : <span style={{ color: "#788c5d", marginLeft: "auto", fontSize: 10 }}>done</span>
              }
            </div>
            {scenario.codeLines.slice(0, codeLinesCount).map((line, i) => (
              <div key={i} className="font-mono-display" style={{
                display: "flex", gap: 14,
                fontSize: 11.5, lineHeight: 1.7,
                opacity: 0, animation: `codeIn 0.2s ease ${i * 0.03}s forwards`,
              }}>
                <span style={{ color: "#3a3a36", width: 22, textAlign: "right" as const, flexShrink: 0, userSelect: "none" as const, fontSize: 10.5 }}>{i + 1}</span>
                <span style={{ color: codeColor(line) }}>{line || "\u00A0"}</span>
              </div>
            ))}
            {codeLinesCount < scenario.codeLines.length && (
              <div style={{ display: "flex", gap: 14, marginTop: 2 }}>
                <span style={{ width: 22 }} />
                <span style={{
                  display: "inline-block", width: 7, height: 15, backgroundColor: "#788c5d",
                  animation: "blink 0.8s step-end infinite", borderRadius: 1,
                }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        padding: "6px 16px", borderTop: "1px solid #2a2a26", background: "#1f1e1b",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarburstIcon size={11} color={activeStep >= 0 ? "#d97757" : "#3a3a36"} />
          <span className="font-mono-display" style={{
            fontSize: 10.5, color: activeStep >= 0 ? "#94938c" : "#3a3a36",
          }}>
            {activeStep >= 0 && activeStep < scenario.agentSteps.length
              ? scenario.agentSteps[activeStep]
              : activeStep >= scenario.agentSteps.length ? "Changes applied" : "Waiting for input..."}
          </span>
        </div>
        <span className="font-mono-display" style={{ fontSize: 10, color: "#3a3a36" }}>claude-code v1.2</span>
      </div>
    </div>
  );
}

/* ── Flow Steps ── */
function FlowSteps({ phase }: { phase: Phase }) {
  const steps = [
    { label: "Speak", phases: ["hotkey", "listening"] },
    { label: "Polish", phases: ["processing"] },
    { label: "Command", phases: ["sending"] },
    { label: "Code", phases: ["coding", "done"] },
  ];
  const all: Phase[] = ["idle", "hotkey", "listening", "processing", "sending", "coding", "done"];
  const pi = all.indexOf(phase);

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {steps.map((step, i) => {
        const sS = all.indexOf(step.phases[0] as Phase);
        const sE = all.indexOf(step.phases[step.phases.length - 1] as Phase);
        const active = pi >= sS && pi <= sE;
        const past = pi > sE;
        const c = ["#d97757", "#6a9bcc", "#d97757", "#788c5d"][i];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <div style={{ width: 16, height: 1.5, borderRadius: 1, background: past || active ? `${c}50` : "#e8e6dc", transition: "all 0.4s" }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div className="font-mono-display" style={{
                width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700,
                background: active ? c : past ? `${c}12` : "transparent",
                color: active ? "#faf9f5" : past ? c : "#b0aea5",
                border: active ? `1.5px solid ${c}` : past ? `1.5px solid ${c}30` : "1.5px dashed #e8e6dc",
                transition: "all 0.35s",
              }}>{past ? "\u2713" : i + 1}</div>
              <span className="font-poppins" style={{
                fontSize: 11, fontWeight: active ? 600 : 400,
                color: active ? "#141413" : "#b0aea5",
                transition: "all 0.35s",
              }}>{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── MAIN COMPONENT ── */
export default function VibeCodingDemo() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [rawText, setRawText] = useState("");
  const [cleanText, setCleanText] = useState("");
  const [hotkeyPressed, setHotkeyPressed] = useState(false);
  const [termLines, setTermLines] = useState<string[]>([]);
  const [codeVis, setCodeVis] = useState(false);
  const [codeCount, setCodeCount] = useState(0);
  const [step, setStep] = useState(-1);
  const tRef = useRef<ReturnType<typeof setTimeout>[] | null>(null);

  const sc = SCENARIOS[idx];

  const clr = useCallback(() => {
    if (tRef.current) { tRef.current.forEach(clearTimeout); tRef.current = null; }
  }, []);

  const run = useCallback(() => {
    clr();
    const T: ReturnType<typeof setTimeout>[] = [];
    setPhase("idle"); setRawText(""); setCleanText(""); setHotkeyPressed(false);
    setTermLines([]); setCodeVis(false); setCodeCount(0); setStep(-1);

    const s = SCENARIOS[idx];
    let t = 0;

    t += 600;
    T.push(setTimeout(() => { setHotkeyPressed(true); setPhase("hotkey"); }, t));
    t += 400;
    T.push(setTimeout(() => setPhase("listening"), t));

    t += 300;
    const words = s.raw.split(" ");
    words.forEach((w, i) => {
      T.push(setTimeout(() => setRawText(p => p ? p + " " + w : w), t + i * 110));
    });
    t += words.length * 110;

    t += 200;
    T.push(setTimeout(() => { setHotkeyPressed(false); setPhase("processing"); }, t));
    t += 800;
    T.push(setTimeout(() => setCleanText(s.clean), t));

    t += 1000;
    T.push(setTimeout(() => {
      setPhase("sending");
      setTermLines([`\u276F ${s.terminalCmd}`]);
    }, t));

    t += 600;
    T.push(setTimeout(() => {
      setPhase("coding");
      setTermLines(p => [...p, ""]);
    }, t));

    s.agentSteps.forEach((st, i) => {
      t += 700;
      T.push(setTimeout(() => {
        setStep(i);
        const pfx = i === s.agentSteps.length - 1 ? "  \u2570\u2500 " : "  \u251C\u2500 ";
        setTermLines(p => [...p, `${pfx}${st}`]);
      }, t));
    });

    t += 600;
    T.push(setTimeout(() => {
      setCodeVis(true);
      setTermLines(p => [...p, "", `  \u2937 Writing ${s.codeFile}...`]);
    }, t));

    const total = s.codeLines.length;
    for (let i = 1; i <= total; i++) {
      T.push(setTimeout(() => setCodeCount(i), t + i * 80));
    }
    t += total * 80;

    t += 400;
    T.push(setTimeout(() => {
      setStep(s.agentSteps.length);
      setPhase("done");
      setTermLines(p => [...p, "", "  \u2713 Changes applied successfully."]);
    }, t));

    t += 3000;
    T.push(setTimeout(() => setIdx(p => (p + 1) % SCENARIOS.length), t));

    tRef.current = T;
  }, [idx, clr]);

  useEffect(() => { run(); return clr; }, [idx, run, clr]);

  const capsuleVis = ["listening", "processing", "sending"].includes(phase);

  return (
    <div style={{
      width: "100%", aspectRatio: "16 / 9",
      background: "#F5F5F0", position: "relative", overflow: "hidden",
      color: "#141413",
      display: "flex", flexDirection: "column" as const,
      borderRadius: 20,
    }}
    className="font-lora"
    >
      {/* Noise texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "256px",
      }} />
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: 18, right: 30, opacity: 0.07 }}>
        <svg width="55" height="55" viewBox="0 0 55 55"><circle cx="27" cy="27" r="25" fill="none" stroke="#d97757" strokeWidth="1.2" strokeDasharray="3 2" /></svg>
      </div>
      <div style={{ position: "absolute", bottom: 85, left: 25, opacity: 0.05 }}>
        <svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="#788c5d" strokeWidth="1" strokeDasharray="2 2" /></svg>
      </div>

      {/* Header */}
      <div style={{
        padding: "16px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StarburstIcon size={20} color="#d97757" />
          <span className="font-lora" style={{ fontSize: 14, fontWeight: 500, color: "#141413" }}>
            Voice <span style={{ color: "#d97757", fontStyle: "italic" }}>{"\u2192"}</span> Code
          </span>
          <SquiggleLine width={50} color="#d97757" style={{ marginLeft: 6, opacity: 0.4 }} />
        </div>
        <FlowSteps phase={phase} />
      </div>

      {/* IDE */}
      <div style={{ flex: 1, padding: "12px 28px 76px", minHeight: 0, zIndex: 1 }}>
        <IDEWindow scenario={sc} terminalLines={termLines} codeVisible={codeVis} codeLinesCount={codeCount} activeStep={step} />
      </div>

      {/* Voice capsule */}
      <VoiceCapsule visible={capsuleVis} phase={phase === "sending" ? "done" : phase} rawText={rawText} cleanText={cleanText} hotkeyPressed={hotkeyPressed} />

      {/* Scenario dots */}
      <div style={{
        position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, zIndex: 60,
      }}>
        {SCENARIOS.map((_, i) => (
          <button key={i} onClick={() => { clr(); setIdx(i); }} style={{
            width: i === idx ? 20 : 7, height: 7, borderRadius: 4, border: "none", cursor: "pointer",
            background: i === idx ? "#d97757" : "#ddd9ce", transition: "all 0.35s",
          }} />
        ))}
      </div>
    </div>
  );
}
