"use client";

import { usePlanStore } from "@/lib/plan-store";
import { Check, Icon, Sparkle } from "@/components/ui";
import { addDays, clamp, daysBetween, formatDate, formatDateShort, todayISO } from "@/lib/format";

export function TimelineTab() {
  const { plan, toggleMilestone, setExportOpen, showSnack } = usePlanStore();
  if (!plan) return null;

  const milestones = plan.timeline.milestones;
  const startISO = milestones[0] ? addDays(plan.brief.date, -milestones[0].tMinus) : todayISO();
  const totalDays = Math.max(daysBetween(startISO, plan.brief.date), 1);
  const weeks = clamp(Math.ceil(totalDays / 7), 1, 14);
  const labelEvery = weeks > 8 ? 2 : 1;
  const openCount = milestones.filter((m) => !m.done).length;

  const calendarUrl = (title: string, iso: string, details: string) => {
    const start = iso.replace(/-/g, "");
    const end = addDays(iso, 1).replace(/-/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;
  };

  return (
    <div className="stack gap-16">
      <section className="card card--pad" aria-labelledby="tl-head">
        <div className="section-head" style={{ marginBottom: 6 }}>
          <div>
            <h3 className="section-title" id="tl-head">
              Working backwards from {formatDateShort(plan.brief.date)}
            </h3>
            <p className="section-sub">
              {milestones.length} milestones · {openCount} open · {weeks} weeks of runway
            </p>
          </div>
          <div className="row gap-8">
            <button type="button" className="btn btn--outlined btn--sm" onClick={() => setExportOpen(true)}>
              <Icon name="calendar_month" size={17} />
              Add to Calendar
            </button>
          </div>
        </div>

        {plan.timeline.compressed ? (
          <div className="budget-note" style={{ marginTop: 10 }}>
            <Icon name="bolt" size={18} />
            <span>{plan.timeline.note}</span>
          </div>
        ) : (
          <p className="caption muted" style={{ marginTop: 6 }}>
            {plan.timeline.note}
          </p>
        )}
      </section>

      <section className="gantt" aria-label="Milestone timeline">
        <div className="gantt__ruler gantt__ruler--weeks">
          <span>Milestone</span>
          <div
            className="gantt__weekgrid"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {Array.from({ length: weeks }).map((_, i) => (
              <span key={i} className="gantt__weeklabel">
                {i % labelEvery === 0 ? formatDateShort(addDays(startISO, i * 7)) : ""}
              </span>
            ))}
          </div>
        </div>

        {milestones.map((m) => {
          const fraction = clamp(daysBetween(startISO, m.dueDate) / totalDays, 0, 1);
          const left = clamp(fraction * 100 - 6, 0, 84);
          return (
            <div className="gantt__track gantt__track--weeks" key={m.id}>
              <div className="gantt__label">
                <Check checked={m.done} onChange={() => toggleMilestone(m.id)} label={m.title} />
                <div style={{ minWidth: 0 }}>
                  <div
                    className="lbl"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      lineHeight: "17px",
                      textDecoration: m.done ? "line-through" : "none",
                      color: m.done ? "var(--text-2)" : "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={m.title}
                  >
                    {m.title}
                  </div>
                  <div className="caption muted" style={{ fontWeight: 400, fontSize: 10.5 }}>
                    {m.owner} · T-{m.tMinus}
                  </div>
                </div>
              </div>

              <div className="gantt__lane">
                <div
                  className="lane__grid"
                  style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
                  aria-hidden="true"
                >
                  {Array.from({ length: weeks }).map((_, i) => (
                    <span key={i} className="lane__cell" />
                  ))}
                </div>
                <div
                  className={`gantt__bar--abs ${m.done ? "is-done" : m.status === "due" ? "is-due" : ""}`}
                  style={{ left: `${left}%` }}
                  title={`${m.title} — due ${m.dueDate}`}
                >
                  {formatDateShort(m.dueDate)}
                  {m.status === "due" && !m.done ? " · due now" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 className="section-title">Milestone cards</h3>
        <span className="chip chip--ai chip--xs">
          <Sparkle size={12} />
          Dates computed, not guessed
        </span>
      </div>

      <div className="grid-2">
        {milestones.map((m) => (
          <section className="card ms-card" key={m.id} aria-label={m.title}>
            <Check checked={m.done} onChange={() => toggleMilestone(m.id)} label={m.title} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row gap-8" style={{ justifyContent: "space-between" }}>
                <div
                  className="ms-card__title"
                  style={{ textDecoration: m.done ? "line-through" : "none" }}
                >
                  {m.title}
                </div>
                <span
                  className={`status ${
                    m.done ? "st--booked" : m.status === "due" ? "st--quoted" : "st--idle"
                  }`}
                >
                  {m.done ? "Done" : m.status === "due" ? "Due now" : "Upcoming"}
                </span>
              </div>
              <div className="ms-card__meta">
                <span>{formatDate(m.dueDate)}</span>
                <span className="tminus">T-{m.tMinus}</span>
                <span>· {m.owner}</span>
                {m.dependsOn.length ? (
                  <span>
                    · after{" "}
                    {(milestones.find((x) => x.id === m.dependsOn[0])?.title ?? m.dependsOn[0]).toLowerCase()}
                  </span>
                ) : null}
              </div>
              <div className="row gap-8" style={{ marginTop: 10 }}>
                <a
                  className="chip chip--xs chip--action"
                  href={calendarUrl(
                    m.title,
                    m.dueDate,
                    `Gemini Gather milestone for ${plan.brief.title}. Owner: ${m.owner}. T-${m.tMinus}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="calendar_add_on" size={14} />
                  Add to Calendar
                </a>
                <button
                  type="button"
                  className="chip chip--xs chip--action"
                  onClick={() =>
                    showSnack(`Reminder set for ${m.title.toLowerCase()} on ${m.dueDate} (demo).`)
                  }
                >
                  <Icon name="notifications" size={14} />
                  Remind me
                </button>
              </div>
            </div>
          </section>
        ))}
      </div>

      <p className="caption muted" style={{ textAlign: "center" }}>
        Calendar links open a prefilled Google Calendar event. In the full build these are written
        with the Calendar API scope.
      </p>
    </div>
  );
}
