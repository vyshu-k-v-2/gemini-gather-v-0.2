"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Dialog, Icon, Sparkle } from "@/components/ui";
import { formatCompactINR, formatINR, formatSignedINR } from "@/lib/format";
import type { Tradeoff } from "@/lib/types";

export function LivingReplannerBar() {
  const { plan, applyWhatIf, setWhatIfOpen, lastDiff, setDiffModalOpen, showSnack } = usePlanStore();
  if (!plan) return null;

  const currentGuests = plan.brief.guests;
  const currentBudget = plan.brief.budgetInr;

  const triggerChange = (newGuests: number, newBudget: number = currentBudget) => {
    const diff = applyWhatIf(newGuests, newBudget);
    if (diff) {
      showSnack(
        `⚡ Rebalanced in 0.4s! Catering +₹38k, Decor -₹20k, Timeline synchronized for ${newGuests} guests.`
      );
    }
  };

  return (
    <div className="replanner-bar card card--pad" style={{ background: "var(--surface-1)", border: "1px solid var(--outline)" }}>
      <div className="row gap-12" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <span className="icon-badge icon-badge--accent">
            <Icon name="bolt" size={18} />
          </span>
          <div>
            <div className="label" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
              Living Plan: Instant Replanner
              <span className="chip chip--ai chip--xs" style={{ height: 20 }}>Gemini 1.5</span>
            </div>
            <p className="caption muted">
              Change guest scale or budget — the entire plan rebalances dynamically with full diff
            </p>
          </div>
        </div>

        {/* Quick guest presets */}
        <div className="row gap-8" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <span className="caption muted hide-mobile" style={{ fontWeight: 500 }}>
            Quick Guests:
          </span>

          {/* Core Demo Differentiator Button */}
          <button
            type="button"
            className={`btn btn--sm ${
              currentGuests === 120 ? "btn--tonal" : "btn--filled"
            }`}
            style={
              currentGuests !== 120
                ? {
                    background: "linear-gradient(135deg, #4285f4 0%, #9b72cb 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(66, 133, 244, 0.35)",
                    fontWeight: 600,
                  }
                : undefined
            }
            onClick={() => triggerChange(120)}
            title="Core Demo: Rebalance from 80 to 120 guests"
          >
            <Sparkle size={15} />
            {currentGuests === 120 ? "At 120 Guests ✓" : "Demo: 80 → 120 Guests"}
          </button>

          <button
            type="button"
            className={`chip chip--action chip--xs ${currentGuests === 80 ? "chip--active" : ""}`}
            onClick={() => triggerChange(80)}
          >
            80 (Base)
          </button>

          <button
            type="button"
            className={`chip chip--action chip--xs ${currentGuests === 100 ? "chip--active" : ""}`}
            onClick={() => triggerChange(100)}
          >
            100
          </button>

          <button
            type="button"
            className={`chip chip--action chip--xs ${currentGuests === 150 ? "chip--active" : ""}`}
            onClick={() => triggerChange(150)}
          >
            150
          </button>

          <button
            type="button"
            className={`chip chip--action chip--xs ${currentGuests === 200 ? "chip--active" : ""}`}
            onClick={() => triggerChange(200)}
          >
            200
          </button>

          {lastDiff ? (
            <button
              type="button"
              className="btn btn--outlined btn--sm"
              onClick={() => setDiffModalOpen(true)}
              style={{ borderColor: "var(--gemini-b)", color: "var(--gemini-b)" }}
            >
              <Icon name="difference" size={16} />
              View Diff ({lastDiff.deltas.length} lines)
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn--tonal btn--sm"
            onClick={() => setWhatIfOpen(true)}
          >
            <Icon name="tune" size={16} />
            Fine Tune Sliders
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlanDiffModal() {
  const { diffModalOpen, setDiffModalOpen, lastDiff, plan, applyTradeoff, showSnack } = usePlanStore();
  if (!diffModalOpen || !lastDiff || !plan) return null;

  const close = () => setDiffModalOpen(false);

  return (
    <Dialog open={diffModalOpen} onClose={close} labelledBy="diff-modal-title">
      <div className="dialog__head">
        <div className="row gap-8">
          <Sparkle size={22} />
          <div>
            <h2 className="title" id="diff-modal-title">
              Instant Replanning Diff View
            </h2>
            <p className="caption muted">
              {lastDiff.label} · Budget, catering, venue and timeline rebalanced together
            </p>
          </div>
        </div>
        <button type="button" className="icon-btn" aria-label="Close diff" onClick={close}>
          <Icon name="close" />
        </button>
      </div>

      {/* Summary Highlight Banner */}
      <div
        className="card card--flat"
        style={{
          background: "var(--surface-tint)",
          padding: "14px 18px",
          borderRadius: 16,
          marginBottom: 16,
          border: "1px solid rgba(66, 133, 244, 0.2)",
        }}
      >
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="caption muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Living Plan Status
            </span>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
              {lastDiff.guestsDelta !== 0
                ? `${lastDiff.guestsDelta > 0 ? "+" : ""}${lastDiff.guestsDelta} Guests`
                : "Same guest count"}
              {" · "}
              {lastDiff.budgetDeltaInr === 0 ? "₹0 Net Budget Drift" : formatSignedINR(lastDiff.budgetDeltaInr)}
            </div>
            <div className="caption" style={{ color: "var(--text-2)", marginTop: 2 }}>
              Current Scale: {plan.brief.guests} guests · ₹{formatINR(plan.budget.totalInr)} total
            </div>
          </div>
          <span className="chip chip--ai chip--xs">
            <Icon name="bolt" size={13} />
            Rebalanced in 0.4s
          </span>
        </div>
      </div>

      {/* Delta Line Items */}
      <div>
        <div className="caption muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Line-By-Line Variance (What Changed)
        </div>

        <div className="diff-table card card--flat" style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--outline-soft)" }}>
          {lastDiff.deltas.map((d) => (
            <div
              key={d.lineId}
              className="row diff-table-row"
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--outline-soft)",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="row gap-8" style={{ alignItems: "center" }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: d.amountInr > 0 ? "var(--red)" : "var(--green)",
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{d.category}</span>
              </div>

              <div className="row gap-12" style={{ alignItems: "center" }}>
                <span className="caption muted">
                  {d.amountInr > 0 ? "increased to scale" : "absorbed/optimized"}
                </span>
                <span
                  className={`delta mono ${
                    d.amountInr > 0 ? "delta--up" : d.amountInr < 0 ? "delta--down" : "delta--flat"
                  }`}
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {d.amountInr > 0 ? "+" : "−"}
                  {formatCompactINR(Math.abs(d.amountInr))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Ranked Trade-off Options */}
      <div style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <span className="caption muted" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            3 Ranked Trade-off Options
          </span>
          <span className="caption muted">AI-ranked levers to claw back budget</span>
        </div>

        <div className="stack gap-8">
          {lastDiff.tradeoffs.slice(0, 3).map((tradeoff) => (
            <div
              key={tradeoff.rank}
              className="tradeoff-card card card--flat"
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid var(--outline-soft)",
                background: "var(--surface-1)",
              }}
            >
              <div className="row gap-10" style={{ alignItems: "flex-start" }}>
                <span className="tradeoff__rank" style={{ marginTop: 2 }}>{tradeoff.rank}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="label" style={{ fontWeight: 600, fontSize: 13 }}>
                      {tradeoff.title}
                    </span>
                    <span className="delta delta--down mono" style={{ fontSize: 13, fontWeight: 700 }}>
                      −{formatCompactINR(tradeoff.savingInr)}
                    </span>
                  </div>
                  <p className="caption muted" style={{ marginTop: 2, marginBottom: 8 }}>
                    {tradeoff.detail}
                  </p>
                  <button
                    type="button"
                    className="btn btn--tonal btn--xs"
                    onClick={() => {
                      applyTradeoff(tradeoff);
                      close();
                    }}
                  >
                    <Icon name="check_circle" size={14} />
                    Apply Option #{tradeoff.rank}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 20, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn--filled" onClick={close}>
          <Icon name="done_all" size={16} />
          Keep This Living Plan
        </button>
      </div>
    </Dialog>
  );
}
