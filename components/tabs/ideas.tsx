"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Icon, Sparkle } from "@/components/ui";

export function IdeasTab() {
  const { plan, showSnack } = usePlanStore();
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  if (!plan) return null;

  const b = plan.brief;

  return (
    <div className="stack gap-16">
      <section className="card card--pad" aria-labelledby="ideas-head">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <div>
            <h3 className="section-title" id="ideas-head">
              Ideas that fit this brief
            </h3>
            <p className="section-sub">
              {b.guests} guests · {b.city} · {b.constraints[0] ?? "no dietary constraint"} ·{" "}
              {b.vibe.join(" / ") || "warm"}
            </p>
          </div>
          <div className="row gap-8">
            <span className="chip chip--ai chip--xs">
              <Sparkle size={12} />
              Gemini + Imagen
            </span>
            <button
              type="button"
              className="btn btn--outlined btn--sm"
              onClick={() => showSnack("Three more themes queued (demo). Imagen renders mood boards in production.")}
            >
              <Icon name="auto_awesome" size={16} />
              More ideas
            </button>
          </div>
        </div>
        <p className="caption muted" style={{ marginTop: 8 }}>
          Mood boards are generated previews, not vendor photos. Every card explains why it fits
          before you spend a rupee.
        </p>
      </section>

      <div className="idea-grid">
        {plan.ideas.map((idea) => (
          <article className="card idea" key={idea.id} aria-labelledby={`idea-${idea.id}`}>
            <div className="moodboard" style={{ background: idea.gradient }}>
              <span
                className="moodboard__blur"
                style={{ background: idea.palette[1], width: 150, height: 150, top: -40, right: -20 }}
                aria-hidden="true"
              />
              <span
                className="moodboard__blur"
                style={{ background: idea.palette[3], width: 110, height: 110, bottom: -30, left: 40 }}
                aria-hidden="true"
              />
              <span className="moodboard__tag">
                <Sparkle size={11} />
                {idea.tag}
              </span>
              <span className="spacer" />
              <button
                type="button"
                className="icon-btn moodboard__save"
                aria-label={saved[idea.id] ? `Remove ${idea.title} from saved ideas` : `Save ${idea.title}`}
                aria-pressed={!!saved[idea.id]}
                onClick={() => {
                  setSaved((prev) => ({ ...prev, [idea.id]: !prev[idea.id] }));
                  showSnack(saved[idea.id] ? "Idea removed." : "Idea saved to this plan.");
                }}
              >
                <Icon name={saved[idea.id] ? "bookmark_added" : "bookmark"} size={18} />
              </button>
            </div>

            <div className="idea__body">
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <h3 className="idea__title" id={`idea-${idea.id}`}>
                  {idea.title}
                </h3>
              </div>

              <p className="idea__why">
                <Sparkle size={11} /> {idea.why}
              </p>

              <div className="palette" aria-label="Colour palette">
                {idea.palette.map((color) => (
                  <span key={color} style={{ background: color }} title={color} />
                ))}
              </div>

              <div className="idea__row">
                {idea.menu.slice(0, 3).map((item) => (
                  <span key={item} className="chip chip--xs chip--assist">
                    <Icon name="restaurant" size={13} />
                    {item}
                  </span>
                ))}
              </div>

              <div className="idea__row">
                {idea.activities.slice(0, 2).map((item) => (
                  <span key={item} className="chip chip--xs chip--assist">
                    <Icon name="celebration" size={13} />
                    {item}
                  </span>
                ))}
              </div>

              <div className="row gap-8" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="btn btn--tonal btn--sm"
                  onClick={() => showSnack(`“${idea.title}” applied to the decor brief.`)}
                >
                  <Icon name="check" size={16} />
                  Use this theme
                </button>
                <button
                  type="button"
                  className="btn btn--text btn--sm"
                  onClick={() => showSnack("Full menu and shopping list open in the Docs export.")}
                >
                  Full menu
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="card card--pad" style={{ background: "var(--surface-1)" }}>
        <div className="row gap-8" style={{ marginBottom: 10 }}>
          <Sparkle size={16} />
          <h3 className="section-title">Why these, not a generic list</h3>
        </div>
        <ul className="body" style={{ color: "var(--text-2)", paddingLeft: 20, margin: 0 }}>
          <li>
            Culture-aware templates: multi-day functions and {b.eventType === "community" ? "permit and volunteer planning" : "regional menus"} are first-class, not an afterthought.
          </li>
          <li>
            Budget-tiered: every idea names the cost lever it uses, so a theme never quietly doubles the decor line.
          </li>
          <li>
            Constraint-checked: {b.constraints.join(", ") || "no constraints raised"} — the critic rejects an idea that breaks one.
          </li>
        </ul>
      </section>
    </div>
  );
}
