"use client";

import { useEffect, useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Dialog, Icon, Sparkle } from "@/components/ui";

const TARGETS = [
  {
    id: "calendar",
    title: "Google Calendar",
    desc: "Every milestone as an all-day event, with T-minus reminders.",
    icon: "calendar_month",
    color: "#1a73e8",
    tint: "#e8f0fe",
  },
  {
    id: "sheets",
    title: "Google Sheets",
    desc: "Budget lines with priority, planned vs actual, and totals.",
    icon: "table_chart",
    color: "#1e8e3e",
    tint: "#e6f4ea",
  },
  {
    id: "docs",
    title: "Google Docs",
    desc: "The brief, the rationale and the vendor checklist.",
    icon: "description",
    color: "#1a73e8",
    tint: "#e8f0fe",
  },
  {
    id: "gmail",
    title: "Gmail drafts",
    desc: "One quote request per vendor category, ready to review.",
    icon: "mail",
    color: "#c5221f",
    tint: "#fce8e6",
  },
];

export function ExportDialog() {
  const { exportOpen, setExportOpen, plan, showSnack } = usePlanStore();
  const [selected, setSelected] = useState<string[]>(TARGETS.map((t) => t.id));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (exportOpen) {
      setSelected(TARGETS.map((t) => t.id));
      setBusy(false);
      setDone(false);
    }
  }, [exportOpen]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const run = () => {
    if (!selected.length || !plan) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setDone(true);
      setExportOpen(false);
      showSnack(
        `Exported to ${selected
          .map((id) => TARGETS.find((t) => t.id === id)?.title.replace("Google ", ""))
          .join(", ")} · demo mode.`
      );
    }, 1100);
  };

  return (
    <Dialog open={exportOpen} onClose={() => setExportOpen(false)} labelledBy="export-title">
      <div className="dialog__head">
        <div className="row gap-8">
          <Sparkle size={22} />
          <div>
            <h2 className="title" id="export-title">
              Export to Google
            </h2>
            <p className="caption muted">Pick what to send. Nothing leaves this device in demo mode.</p>
          </div>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close export"
          onClick={() => setExportOpen(false)}
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="stack gap-8">
        {TARGETS.map((t) => {
          const on = selected.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              className="export-opt"
              data-selected={on}
              onClick={() => toggle(t.id)}
            >
              <span
                className="export-opt__icon"
                style={{ background: t.tint, color: t.color }}
                aria-hidden="true"
              >
                <Icon name={t.icon} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="export-opt__title" style={{ display: "block" }}>
                  {t.title}
                </span>
                <span className="export-opt__desc" style={{ display: "block" }}>
                  {t.desc}
                </span>
              </span>
              <span className="checkbox" data-checked={on} aria-hidden="true">
                <Icon name="check" size={15} />
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="row gap-8"
        style={{ marginTop: 16, padding: "10px 12px", borderRadius: 12, background: "var(--surface-1)" }}
      >
        <Icon name="info" size={16} style={{ color: "var(--text-2)" }} />
        <span className="caption muted" style={{ fontWeight: 400 }}>
          {plan
            ? `${plan.timeline.milestones.length} milestones · ${plan.budget.lines.length} budget lines · ${plan.vendors.length} vendor categories`
            : "No plan loaded"}
        </span>
      </div>

      <div className="row gap-8" style={{ marginTop: 20, flexWrap: "wrap" }}>
        <span className="caption muted">{selected.length} selected</span>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn--outlined btn--sm"
          onClick={() => setExportOpen(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--filled btn--sm"
          disabled={!selected.length || busy}
          onClick={run}
        >
          <Icon name={busy ? "progress_activity" : done ? "check" : "ios_share"} size={17} />
          {busy ? "Exporting…" : `Export ${selected.length || ""}`}
        </button>
      </div>

      <p className="caption muted" style={{ marginTop: 12, textAlign: "center" }}>
        Calendar, Sheets, Docs and Gmail scopes are wired on the FastAPI backend; this build stops at
        the hand-off.
      </p>
    </Dialog>
  );
}
