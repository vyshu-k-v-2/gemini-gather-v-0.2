"use client";

import { usePlanStore } from "@/lib/plan-store";
import { Donut, Legend } from "@/components/donut";
import { Check, Icon, Sparkle } from "@/components/ui";
import { daysBetween, formatCompactINR, formatDate, todayISO } from "@/lib/format";
import { EVENT_LABEL } from "@/lib/types";
import { PlanHealthSection } from "@/components/health-radar";
import { LivingReplannerBar } from "@/components/living-replanner";

export function OverviewTab() {
  const { plan, setTab, setWhatIfOpen, toggleMilestone, setMultimodalOpen } = usePlanStore();
  if (!plan) return null;
  const b = plan.brief;
  const days = daysBetween(todayISO(), b.date);
  const nextUp = plan.timeline.milestones.filter((m) => !m.done).slice(0, 3);
  const open = plan.timeline.milestones.filter((m) => !m.done).length;

  return (
    <div className="stack gap-16">
      {/* Hero Brief Section */}
      <section className="hero">
        <div className="hero__eyebrow">
          <Sparkle size={13} />
          {EVENT_LABEL[b.eventType]} · {days > 0 ? `${days} days out` : "today"}
          <span aria-hidden="true">·</span>
          <span>Powered by Gemini Gather</span>
        </div>
        <h2 className="hero__title">{b.title}</h2>
        <div className="hero__meta">
          <span className="chip">
            <Icon name="calendar_month" size={15} />
            {formatDate(b.date)}
          </span>
          <span className="chip">
            <Icon name="group" size={15} />
            {b.guests} guests
          </span>
          <span className="chip">
            <Icon name="payments" size={15} />
            {formatCompactINR(b.budgetInr)}
          </span>
          <span className="chip">
            <Icon name="location_on" size={15} />
            {b.city}
          </span>
          {b.constraints.slice(0, 2).map((c) => (
            <span key={c} className="chip">
              <Icon name="eco" size={15} />
              {c}
            </span>
          ))}
        </div>

        <div className="row gap-8" style={{ marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" className="btn btn--filled btn--sm" onClick={() => setWhatIfOpen(true)}>
            <Icon name="tune" size={17} />
            Simulate a change
          </button>
          <button type="button" className="btn btn--tonal btn--sm" onClick={() => setMultimodalOpen(true)}>
            <Icon name="mic" size={17} />
            Voice / Photo Studio
          </button>
          <button type="button" className="btn btn--outlined btn--sm" onClick={() => setTab("family")}>
            <Icon name="family_restroom" size={17} />
            Family Mode
          </button>
          <span className="spacer" />
          <span className="caption muted" style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="verified" size={14} />
            {plan.critic.checks.filter((c) => c.ok).length}/{plan.critic.checks.length} critic checks pass
          </span>
        </div>
      </section>

      {/* 1. Living Plan Instant Replanner Bar (Requirement 1: 80 -> 120 guests & diff) */}
      <LivingReplannerBar />

      {/* 2. Plan Health Score with Risk Radar (Requirement 2: 0-100 ring + top 5 risks & Plan B) */}
      <PlanHealthSection />


      {/* Key Numbers at a glance */}
      <section className="stat-grid" aria-label="Plan at a glance">
        <div className="stat">
          <div className="stat__label">
            <Icon name="account_balance_wallet" size={15} /> Budget
          </div>
          <div className="stat__value">{formatCompactINR(plan.budget.totalInr)}</div>
          <div className="stat__note">
            {plan.budget.lines.length} lines · {plan.budget.contingencyPercent}% held back
          </div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icon name="restaurant" size={15} /> Per guest
          </div>
          <div className="stat__value">₹{plan.budget.perGuestInr.toLocaleString("en-IN")}</div>
          <div className="stat__note">Food, venue and seating combined</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icon name="task_alt" size={15} /> Open milestones
          </div>
          <div className="stat__value">
            {open}/{plan.timeline.milestones.length}
          </div>
          <div className="stat__note">Next: {nextUp[0]?.title ?? "all clear"}</div>
        </div>
        <div className="stat">
          <div className="stat__label">
            <Icon name="storefront" size={15} /> Vendors
          </div>
          <div className="stat__value">
            {plan.vendors.filter((v) => v.status === "booked").length} booked
          </div>
          <div className="stat__note">
            {plan.vendors.filter((v) => v.status === "quoted").length} quoted ·{" "}
            {plan.vendors.filter((v) => v.status === "contacted").length} contacted
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="card card--pad" aria-labelledby="split-title">
          <div className="section-head" style={{ marginBottom: 8 }}>
            <div>
              <h3 className="section-title" id="split-title">
                Where the money goes
              </h3>
              <p className="section-sub">Tonal split, priority-led</p>
            </div>
            <button type="button" className="btn btn--text btn--sm" onClick={() => setTab("budget")}>
              Details
            </button>
          </div>
          <div className="row" style={{ gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <Donut lines={plan.budget.lines} total={plan.budget.totalInr} size={150} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <Legend lines={plan.budget.lines} />
            </div>
          </div>
        </section>

        <section className="card card--pad" aria-labelledby="nextup-title">
          <div className="section-head" style={{ marginBottom: 8 }}>
            <div>
              <h3 className="section-title" id="nextup-title">
                Next up
              </h3>
              <p className="section-sub">Working backwards from the event</p>
            </div>
            <button type="button" className="btn btn--text btn--sm" onClick={() => setTab("timeline")}>
              Timeline
            </button>
          </div>
          <div className="stack" style={{ gap: 2 }}>
            {nextUp.map((m) => (
              <div key={m.id} className="ms-card" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <Check checked={m.done} onChange={() => toggleMilestone(m.id)} label={m.title} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ms-card__title">{m.title}</div>
                  <div className="ms-card__meta">
                    <span>{formatDate(m.dueDate)}</span>
                    <span className="tminus">T-{m.tMinus}</span>
                    <span>· {m.owner}</span>
                  </div>
                </div>
              </div>
            ))}
            {!nextUp.length ? <p className="muted body">Every milestone is checked off.</p> : null}
          </div>
        </section>
      </div>

      <section className="card card--pad" aria-labelledby="critic-title">
        <div className="section-head">
          <div>
            <h3 className="section-title" id="critic-title">
              Critic pass
            </h3>
            <p className="section-sub">
              Math, dates and constraints checked before anything was shown to you
            </p>
          </div>
          <span className={`status ${plan.critic.pass ? "st--booked" : "st--quoted"}`}>
            {plan.critic.pass ? "Passed" : "Needs review"}
          </span>
        </div>
        <div className="grid-2" style={{ gap: 10 }}>
          {plan.critic.checks.map((c) => (
            <div key={c.label} className="row gap-8" style={{ alignItems: "flex-start" }}>
              <Icon
                name={c.ok ? "check_circle" : "error"}
                size={18}
                style={{ color: c.ok ? "var(--green)" : "var(--red)", marginTop: 1 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                <div className="caption muted" style={{ fontWeight: 400 }}>
                  {c.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card card--pad" aria-labelledby="notes-title" style={{ background: "var(--surface-1)" }}>
        <div className="row gap-8" style={{ marginBottom: 8 }}>
          <Sparkle size={16} />
          <h3 className="section-title" id="notes-title">
            What Gemini Gather noticed
          </h3>
        </div>
        <p className="body" style={{ color: "var(--text-2)" }}>
          {plan.budget.note}
        </p>
        <p className="body" style={{ color: "var(--text-2)", marginTop: 8 }}>
          {plan.timeline.note}
        </p>
      </section>
    </div>
  );
}
