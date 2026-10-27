"use client";

import { usePlanStore } from "@/lib/plan-store";
import { Icon, Sparkle } from "@/components/ui";

export function HealthScoreRing({ score, size = 130 }: { score: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const toneColor =
    score >= 82 ? "#1e8e3e" : score >= 65 ? "#b06000" : "#c5221f";
  const toneBg =
    score >= 82 ? "rgba(30, 142, 62, 0.12)" : score >= 65 ? "rgba(251, 188, 4, 0.15)" : "rgba(234, 67, 53, 0.15)";

  return (
    <div className="health-ring-container" style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="health-ring-svg">
        <defs>
          <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285f4" />
            <stop offset="50%" stopColor="#9b72cb" />
            <stop offset="100%" stopColor={toneColor} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--outline-soft)"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#healthGrad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.2, 0, 0, 1)",
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
          }}
        />
      </svg>
      <div
        className="health-ring-inner"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span className="mono" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: toneColor }}>
          {score}
        </span>
        <span className="caption muted" style={{ fontSize: 11, fontWeight: 500, marginTop: 3 }}>
          / 100 HEALTH
        </span>
      </div>
    </div>
  );
}

export function PlanHealthSection() {
  const { plan, togglePlanB } = usePlanStore();
  if (!plan) return null;

  const { health, risks } = plan;
  const activePlanBs = risks.filter((r) => r.activePlanB).length;

  return (
    <section className="card card--pad health-radar-card" aria-labelledby="health-radar-title">
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div className="row gap-8">
          <span className="icon-badge icon-badge--primary">
            <Icon name="shield" size={18} />
          </span>
          <div>
            <h3 className="section-title" id="health-radar-title">
              Plan Health & Risk Radar
            </h3>
            <p className="section-sub">
              Live protector score with 5 event-specific risks and one-tap Plan B mitigations
            </p>
          </div>
        </div>
        <div className="row gap-8">
          {activePlanBs > 0 ? (
            <span className="chip chip--xs" style={{ background: "var(--green-container)", color: "var(--green)", fontWeight: 600 }}>
              <Icon name="verified_user" size={14} />
              {activePlanBs} Plan B Active
            </span>
          ) : null}
          <span
            className={`status ${
              health.verdict === "Strong"
                ? "st--booked"
                : health.verdict === "Moderate"
                  ? "st--quoted"
                  : "st--idle"
            }`}
          >
            {health.verdict} Protection
          </span>
        </div>
      </div>

      <div className="health-grid">
        {/* Left: Health Ring & Sub-metrics */}
        <div className="health-overview-box">
          <div className="health-ring-row">
            <HealthScoreRing score={health.score} size={120} />
            <div className="health-overview-text">
              <div className="label" style={{ fontSize: 16, fontWeight: 600 }}>
                {health.verdict} Plan Health
              </div>
              <p className="caption muted" style={{ marginTop: 4, lineHeight: 1.45 }}>
                {health.summary}
              </p>
            </div>
          </div>

          <div className="sub-metrics-list">
            <div className="sub-metric">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className="caption">
                  <Icon name="savings" size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Budget Buffer
                </span>
                <span className="mono caption" style={{ fontWeight: 600 }}>
                  {health.budgetBufferScore}/100
                </span>
              </div>
              <div className="meter meter--sm">
                <div
                  className="meter__fill"
                  style={{
                    width: `${health.budgetBufferScore}%`,
                    background: health.budgetBufferScore > 75 ? "var(--green)" : "var(--yellow)",
                  }}
                />
              </div>
            </div>

            <div className="sub-metric">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className="caption">
                  <Icon name="hourglass_top" size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Timeline Slack
                </span>
                <span className="mono caption" style={{ fontWeight: 600 }}>
                  {health.timelineSlackScore}/100
                </span>
              </div>
              <div className="meter meter--sm">
                <div
                  className="meter__fill"
                  style={{
                    width: `${health.timelineSlackScore}%`,
                    background: health.timelineSlackScore > 75 ? "var(--primary)" : "var(--yellow)",
                  }}
                />
              </div>
            </div>

            <div className="sub-metric">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <span className="caption">
                  <Icon name="storefront" size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Vendor Progress
                </span>
                <span className="mono caption" style={{ fontWeight: 600 }}>
                  {health.vendorProgressScore}/100
                </span>
              </div>
              <div className="meter meter--sm">
                <div
                  className="meter__fill"
                  style={{
                    width: `${health.vendorProgressScore}%`,
                    background: health.vendorProgressScore > 70 ? "var(--gemini-b)" : "var(--yellow)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Risk Radar List */}
        <div className="risk-radar-box">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <span className="caption muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Top 5 Event-Specific Risks ({plan.brief.city})
            </span>
            <span className="caption muted">One-tap Plan B mitigates risk</span>
          </div>

          <div className="stack gap-8">
            {risks.map((risk) => {
              const categoryIcons: Record<string, string> = {
                weather: "thunderstorm",
                vendor: "event_busy",
                permit: "policy",
                budget: "groups",
                logistics: "local_florist",
              };
              const iconName = categoryIcons[risk.category] ?? "warning";

              return (
                <div
                  key={risk.id}
                  className={`risk-card ${risk.activePlanB ? "risk-card--mitigated" : ""}`}
                >
                  <div className="row gap-8" style={{ alignItems: "flex-start" }}>
                    <span
                      className={`risk-icon-pill ${
                        risk.activePlanB
                          ? "risk-icon-pill--ok"
                          : risk.severity === "high"
                            ? "risk-icon-pill--high"
                            : "risk-icon-pill--med"
                      }`}
                    >
                      <Icon name={risk.activePlanB ? "check_circle" : iconName} size={16} />
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row gap-8" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                        <span className="risk-title" style={{ fontWeight: 600, fontSize: 13 }}>
                          {risk.title}
                        </span>
                        <div className="row gap-6">
                          <span
                            className={`chip chip--xs ${
                              risk.activePlanB
                                ? "chip--ok"
                                : risk.severity === "high"
                                  ? "chip--high-risk"
                                  : "chip--med-risk"
                            }`}
                            style={{ height: 22, fontSize: 11 }}
                          >
                            {risk.activePlanB ? "Plan B Active" : `${risk.probabilityPercent}% Probability`}
                          </span>
                        </div>
                      </div>

                      <p className="caption muted" style={{ marginTop: 2, marginBottom: 6 }}>
                        {risk.description}
                      </p>

                      <div className="risk-mitigation-row">
                        <span className="caption" style={{ color: "var(--text-2)" }}>
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </span>
                      </div>

                      <div className="row gap-8" style={{ marginTop: 8, justifyContent: "space-between" }}>
                        <span className="caption muted" style={{ fontStyle: "italic", fontSize: 11 }}>
                          Impact: {risk.impactNote}
                        </span>
                        <button
                          type="button"
                          className={`btn btn--xs ${
                            risk.activePlanB ? "btn--tonal" : "btn--filled"
                          }`}
                          onClick={() => togglePlanB(risk.id)}
                        >
                          <Icon name={risk.activePlanB ? "check" : "auto_fix_high"} size={14} />
                          {risk.activePlanB ? "Plan B Active ✓" : risk.planBLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
