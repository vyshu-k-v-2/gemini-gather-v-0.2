"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/lib/plan-store";
import { Icon, Sparkle } from "@/components/ui";
import { MultimodalStudioModal } from "@/components/multimodal-studio";
import { scanAndHardenPrompt } from "@/lib/security";
import { promptRateLimiter } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

const SUGGESTIONS = [
  { label: "Engagement (80 pax)", icon: "diamond", prompt: "Plan my brother's engagement, 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, vegetarian" },
  { label: "Sangeet & Reception", icon: "music_note", prompt: "Plan a royal sangeet and reception, 180 guests, ₹14 lakh, Hyderabad Banjara Hills, in 3 months, vegetarian" },
  { label: "Telugu Brief (తెలుగు)", icon: "record_voice_over", prompt: "మా అన్నయ్య నిశ్చితార్థం, 80 మంది అతిథులు, ₹6 లక్షల బడ్జెట్, హైదరాబాద్, 8 వారాల్లో, శాకాహారం" },
  { label: "Hindi Brief (हिन्दी)", icon: "translate", prompt: "मेरे भाई की सगाई, 120 मेहमान, ₹8 लाख बजट, हैदराबाद जुबली हिल्स, 6 हफ्ते में, रॉयल थीम" },
  { label: "Wedding (Jaipur)", icon: "celebration", prompt: "Plan a royal wedding, 250 guests, ₹25 lakh, Jaipur, in 6 months, pure vegetarian" },
  { label: "Birthday", icon: "cake", prompt: "Plan a 7th birthday party, 40 guests, ₹1.2 lakh, Bengaluru, in 3 weeks" },
];

const DEMO_PROMPT =
  "Plan my brother's engagement, 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, vegetarian";

const EXAMPLES = [
  {
    icon: "diamond",
    title: "The 8-week engagement (Demo Core)",
    text: "₹6 lakh · 80 guests · Hyderabad · vegetarian · Instant Replan 80 → 120",
    prompt: DEMO_PROMPT,
  },
  {
    icon: "celebration",
    title: "Royal Deccan Sangeet & Reception",
    text: "₹14 lakh · 180 guests · Hyderabad · Risk Radar & Family Mode",
    prompt: "Plan a royal sangeet and reception, 180 guests, ₹14 lakh, Hyderabad Banjara Hills, in 3 months, vegetarian",
  },
  {
    icon: "mic",
    title: "Telugu Voice & Photo Brief",
    text: "మా అన్నయ్య నిశ్చితార్థం · 80 మంది · ₹6 లక్షలు · Imagen E-Invite in Telugu",
    prompt: "మా అన్నయ్య నిశ్చితార్థం ప్లాన్ చేయండి, 80 మంది అతిథులు, ₹6 లక్షల బడ్జెట్, హైదరాబాద్, 8 వారాల్లో, స్వచ్ఛమైన శాకాహారం",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { generatePlan, theme, toggleTheme, showSnack, setMultimodalOpen } = usePlanStore();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const start = (rawText: string) => {
    const text = rawText.trim();
    if (!text || busy) return;

    // Rate Limiting Security Check
    const rateCheck = promptRateLimiter.tryAcquire();
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      showSnack(`Rate limit reached. Please wait ${waitSeconds} seconds before submitting.`);
      return;
    }

    // Prompt Hardening & Injection Defense
    const scan = scanAndHardenPrompt(text);
    if (!scan.isSafe) {
      logger.warn("Prompt injection threat intercepted", { threats: scan.detectedThreats });
      showSnack("Security Alert: Disallowed instruction patterns detected. Prompt hardened.");
    }

    setBusy(true);
    void generatePlan(scan.sanitizedPrompt);
    router.push("/plan");
  };

  return (
    <div className="home">
      <div className="home__glow" aria-hidden="true" />

      <header className="home__nav" role="banner">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Sparkle size={20} />
          </span>
          Gemini Gather
        </div>
        <div className="spacer" />
        <button
          type="button"
          className="btn btn--tonal btn--sm hide-mobile"
          onClick={() => setMultimodalOpen(true)}
          aria-label="Open Multimodal Voice and Photo Studio"
        >
          <Icon name="mic" size={15} />
          Voice (Telugu/Hindi) &amp; Photo Studio
        </button>
        <span className="chip chip--xs hide-mobile" style={{ height: 28 }}>
          <Icon name="bolt" size={14} />
          Living AI Planner
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title="Toggle Theme"
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
        </button>
        <button
          type="button"
          className="btn btn--filled btn--sm"
          onClick={() => start(DEMO_PROMPT)}
          aria-label="Open interactive demo plan with 80 guests"
        >
          Open demo plan (80 guests)
          <Icon name="arrow_forward" size={17} />
        </button>
      </header>

      <main className="home__main" id="main-content" role="main">
        <h1 className="greeting">
          <Sparkle size={34} />
          <span>
            Hi, what are we{" "}
            <span className="ai-text">celebrating?</span>
          </span>
        </h1>
        <p className="home__lede">
          Turn one sentence, a voice note in Telugu/Hindi, or an inspiration photo into a living plan.
          Rebalance instantly, monitor Plan Health &amp; Risk Radar, coordinate with Family Mode, and export to Google tools.
        </p>

        <form
          className="promptbox"
          role="search"
          aria-label="Event brief generation form"
          onSubmit={(e) => {
            e.preventDefault();
            start(prompt);
          }}
        >
          <label htmlFor="brief" className="sr-only">
            Describe your event or stadium gathering
          </label>
          <textarea
            id="brief"
            ref={textarea}
            value={prompt}
            placeholder="Plan my brother's engagement — 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, vegetarian"
            aria-required="true"
            aria-label="Event brief prompt"
            onChange={(e) => {
              setPrompt(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 220) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                start(prompt);
              }
            }}
            rows={2}
          />

          <div className="promptbox__row">
            <button
              type="button"
              className="icon-btn"
              aria-label="Voice input in Telugu, Hindi or Hinglish"
              title="Voice input in Telugu, Hindi or Hinglish"
              onClick={() => setMultimodalOpen(true)}
            >
              <Icon name="mic" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Upload an inspiration photo from Pinterest or Instagram"
              title="Inspiration photo from Pinterest/Instagram"
              onClick={() => setMultimodalOpen(true)}
            >
              <Icon name="image" />
            </button>

            <span className="spacer" />
            <span className="caption muted hide-mobile" style={{ marginRight: 8 }}>
              Enter to plan · Shift + Enter for a new line
            </span>
            <button
              type="submit"
              className="promptbox__go"
              aria-label={busy ? "Generating plan..." : "Generate my living plan"}
              disabled={!prompt.trim() || busy}
              style={!prompt.trim() ? { opacity: 0.5, pointerEvents: "none" } : undefined}
            >
              <Icon name={busy ? "progress_activity" : "arrow_upward"} size={22} />
            </button>
          </div>
        </form>

        <div className="suggests" role="group" aria-label="Event suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="suggest"
              onClick={() => {
                setPrompt(s.prompt);
                textarea.current?.focus();
              }}
              aria-label={`Suggestion: ${s.label}`}
            >
              <Icon name={s.icon} size={17} />
              {s.label}
            </button>
          ))}
        </div>

        <section className="home__section" aria-labelledby="examples-label">
          <div className="home__section-label" id="examples-label">
            <Icon name="history" size={14} />
            Start from a curated living plan
          </div>
          <div className="example-grid">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.title}
                type="button"
                className="example"
                onClick={() => start(ex.prompt)}
                aria-label={`Select example: ${ex.title}`}
              >
                <Icon name={ex.icon} size={22} className="example__icon" />
                <div className="example__title">{ex.title}</div>
                <div className="example__text">{ex.text}</div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="home__foot" role="contentinfo">
        <Sparkle size={12} />
        Gemini Gather · Powered by Multimodal Gemini 1.5 &amp; Imagen 3 · Living Indian Event Planning
      </footer>

      <MultimodalStudioModal />
    </div>
  );
}
