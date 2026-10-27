"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Dialog, Icon, Sparkle } from "@/components/ui";
import { formatCompactINR, formatINR, formatSignedINR } from "@/lib/format";

export function WhatIfSheet() {
  const { whatIfOpen, setWhatIfOpen, plan, previewPlan, applyWhatIf, showSnack } = usePlanStore();
  const [guests, setGuests] = useState(plan?.brief.guests ?? 80);
  const [budget, setBudget] = useState(plan?.brief.budgetInr ?? 600000);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (whatIfOpen && plan) {
      setGuests(plan.brief.guests);
      setBudget(plan.brief.budgetInr);
    }
  }, [whatIfOpen, plan]);

  const budgetMax = useMemo(() => {
    const base = plan?.brief.budgetInr ?? 600000;
    return Math.max(Math.round(base * 2), 1000000);
  }, [plan]);

  const preview = previewPlan(guests, budget);
  const changed = preview
    ? guests !== plan?.brief.guests || budget !== plan?.brief.budgetInr
    : false;

  const guestFill = ((guests - 20) / (400 - 20)) * 100;
  const budgetFill = ((budget - 100000) / (budgetMax - 100000)) * 100;

  const close = () => setWhatIfOpen(false);

  return (
    <Dialog open={whatIfOpen} onClose={close} labelledBy="whatif-title" kind="sheet">
      <div className="dialog__head" style={{ marginBottom: 12 }}>
        <div className="row gap-8">
          <Sparkle size={22} />
          <div>
            <h2 className="title" id="whatif-title">
              What if…
            </h2>
            <p className="caption muted">
              Move a slider. Only the dependent lines change — and you see it before applying.
            </p>
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Close what-if" onClick={close}>
          <Icon name="close" />
        </button>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div className="stack gap-8">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <label className="label" htmlFor="guests-slider">
              Guests
            </label>
            <span className="mono label">{guests}</span>
          </div>
          <input
            id="guests-slider"
            className="slider"
            type="range"
            min={20}
            max={400}
            step={5}
            value={guests}
            style={{ "--fill": `${guestFill}%` } as React.CSSProperties}
            onChange={(e) => setGuests(Number(e.target.value))}
            aria-valuetext={`${guests} guests`}
          />
          <div className="row caption muted" style={{ justifyContent: "space-between" }}>
            <span>20</span>
            <span>400</span>
          </div>
        </div>

        <div className="stack gap-8">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <label className="label" htmlFor="budget-slider">
              Total budget
            </label>
            <span className="mono label">{formatCompactINR(budget)}</span>
          </div>
          <input
            id="budget-slider"
            className="slider"
            type="range"
            min={100000}
            max={budgetMax}
            step={10000}
            value={budget}
            style={{ "--fill": `${budgetFill}%` } as React.CSSProperties}
            onChange={(e) => setBudget(Number(e.target.value))}
            aria-valuetext={`${formatINR(budget)} total budget`}
          />
          <div className="row caption muted" style={{ justifyContent: "space-between" }}>
            <span>₹1 L</span>
            <span>{formatCompactINR(budgetMax)}</span>
          </div>
        </div>
      </div>

      <div
        className="card card--flat"
        style={{ marginTop: 18, padding: 16, borderRadius: 16, background: "var(--surface-1)" }}
      >
        {!changed || !preview ? (
          <div className="row gap-12" style={{ alignItems: "flex-start" }}>
            <Icon name="tune" size={20} style={{ color: "var(--text-2)" }} />
            <div>
              <div className="label">Nothing has moved yet</div>
              <p className="caption muted" style={{ fontWeight: 400 }}>
                Change the guest count or budget and the diff appears here — green where money is
                freed, red where it is needed.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="row" style={{ justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <div className="caption muted" style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Live diff
                </div>
                <div className="mono" style={{ fontSize: 20, fontWeight: 500 }}>
                  {preview.diff.budgetDeltaInr !== 0
                    ? formatSignedINR(preview.diff.totalDeltaInr)
                    : "Same total, rebalanced"}
                </div>
                <div className="caption muted" style={{ fontWeight: 400 }}>
                  {plan?.brief.guests} → {guests} guests ·{" "}
                  {formatCompactINR(plan?.brief.budgetInr ?? 0)} → {formatCompactINR(budget)}
                </div>
              </div>
              <span
                className={`status ${
                  preview.plan.budget.verdict === "comfortable"
                    ? "st--booked"
                    : preview.plan.budget.verdict === "tight"
                      ? "st--quoted"
                      : "st--idle"
                }`}
              >
                {preview.plan.budget.verdict === "comfortable"
                  ? "Comfortable"
                  : preview.plan.budget.verdict === "tight"
                    ? "Tight"
                    : "Unrealistic"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {!preview.diff.deltas.length ? (
                <p className="caption muted" style={{ padding: "4px 0" }}>
                  No line needs to move at this budget. Try a different guest count or total.
                </p>
              ) : null}
              {preview.diff.deltas.slice(0, 6).map((d) => (
                <div className="diffrow" key={d.lineId}>
                  <span
                    className="dot"
                    style={{ background: d.amountInr > 0 ? "var(--red)" : d.amountInr < 0 ? "var(--green)" : "var(--text-3)" }}
                  />
                  <span style={{ flex: 1 }}>{d.category}</span>
                  <span className={`delta ${d.amountInr > 0 ? "delta--up" : d.amountInr < 0 ? "delta--down" : "delta--flat"}`}>
                    {d.amountInr > 0 ? "+" : "−"}
                    {formatCompactINR(Math.abs(d.amountInr))}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="caption muted" style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ranked trade-offs
              </div>
              <div className="stack gap-8">
                {preview.diff.tradeoffs.map((t) => (
                  <div key={t.rank} className="tradeoff">
                    <span className="tradeoff__rank">{t.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div className="label">{t.title}</div>
                      <div className="caption muted" style={{ fontWeight: 400 }}>
                        {t.detail}
                      </div>
                    </div>
                    <span className="delta delta--down">−{formatCompactINR(t.savingInr)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="caption muted" style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <Icon name="info" size={14} />
              {preview.plan.budget.note}
            </p>
          </div>
        )}
      </div>

      <div className="row gap-8" style={{ marginTop: 18, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn--text btn--sm"
          onClick={() => {
            if (!plan) return;
            setGuests(plan.brief.guests);
            setBudget(plan.brief.budgetInr);
          }}
        >
          Reset
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn--outlined btn--sm" onClick={close}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--filled"
          disabled={!changed || !preview || applying}
          onClick={() => {
            if (!preview) return;
            setApplying(true);
            applyWhatIf(guests, budget);
            showSnack(
              `Plan rebalanced for ${guests} guests. ${preview.diff.deltas.length} lines moved.`
            );
            setApplying(false);
            close();
          }}
        >
          <Icon name="check" size={18} />
          Apply to plan
        </button>
      </div>
    </Dialog>
  );
}
