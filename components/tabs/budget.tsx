"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Donut, Legend } from "@/components/donut";
import { Icon, PriorityTag } from "@/components/ui";
import { formatCompactINR, formatINR } from "@/lib/format";

export function BudgetTab() {
  const { plan, updateLineAmount, setWhatIfOpen } = usePlanStore();
  if (!plan) return null;

  const budget = plan.budget;
  const planned = budget.lines.reduce((a, l) => a + l.amountInr, 0);
  const actual = budget.lines.reduce((a, l) => a + l.actualInr, 0);
  const ratio = planned ? actual / planned : 0;
  const tone = ratio > 1.08 ? "over" : ratio > 1 ? "warn" : "ok";
  const toneColor = tone === "over" ? "var(--red)" : tone === "warn" ? "var(--yellow)" : "var(--green)";

  return (
    <div className="stack gap-16">
      <div className="budget-top">
        <section className="card donut-card" aria-label="Budget distribution">
          <Donut lines={budget.lines} total={budget.totalInr} />
          <Legend lines={budget.lines} />
        </section>

        <section className="card card--pad stack gap-16" aria-labelledby="pv-title">
          <div>
            <div className="section-head" style={{ marginBottom: 10 }}>
              <div>
                <h3 className="section-title" id="pv-title">
                  Planned vs actual
                </h3>
                <p className="section-sub">Actuals update as quotes land</p>
              </div>
              <span className="chip chip--xs">
                <Icon name="receipt_long" size={14} />
                {tone === "over" ? "Over plan" : tone === "warn" ? "At the edge" : "On track"}
              </span>
            </div>

            <div className="pv-row">
              <span className="muted">Committed</span>
              <span>
                <b>{formatINR(actual)}</b>{" "}
                <span className="muted">of {formatINR(planned)}</span>
              </span>
            </div>
            <div className="meter" style={{ marginBottom: 6 }}>
              <div
                className={`meter__fill ${
                  tone === "over" ? "bg-over" : tone === "warn" ? "bg-warn" : "bg-ok"
                }`}
                style={{ width: `${Math.min(ratio * 100, 100)}%` }}
              />
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="caption muted">{Math.round(ratio * 100)}% committed</span>
              <span className="caption" style={{ color: toneColor }}>
                {planned - actual >= 0
                  ? `${formatCompactINR(planned - actual)} uncommitted`
                  : `${formatCompactINR(actual - planned)} over plan`}
              </span>
            </div>
          </div>

          <div>
            <div className="pv-row">
              <span className="muted">Contingency held</span>
              <b>{budget.contingencyPercent}%</b>
            </div>
            <div className="meter meter--sm">
              <div
                className="meter__fill bg-primary"
                style={{ width: `${Math.min(budget.contingencyPercent * 6, 100)}%` }}
              />
            </div>
            <p className="caption muted" style={{ marginTop: 6 }}>
              Anything you edit below is absorbed by contingency first, then by the largest flexible
              line.
            </p>
          </div>

          <div className="budget-note">
            <Icon name="lightbulb" size={18} />
            <span>{budget.note}</span>
          </div>

          <div className="row gap-8">
            <button type="button" className="btn btn--tonal btn--sm" onClick={() => setWhatIfOpen(true)}>
              <Icon name="tune" size={17} />
              What if guests change?
            </button>
            <span className="spacer" />
            <span className="caption muted">Editable amounts</span>
          </div>
        </section>
      </div>

      <section className="card" aria-labelledby="lines-title">
        <div className="section-head" style={{ padding: "18px 18px 0", marginBottom: 12 }}>
          <div>
            <h3 className="section-title" id="lines-title">
              Budget lines
            </h3>
            <p className="section-sub">
              Click an amount to edit. Must-haves are protected; contingency takes the swing.
            </p>
          </div>
          <span className="chip chip--ai chip--xs">
            <Icon name="auto_awesome" size={13} />
            Gemini allocated
          </span>
        </div>

        <div className="btable">
          <div className="btable__head" aria-hidden="true">
            <span>Line item</span>
            <span>Priority</span>
            <span style={{ textAlign: "right" }}>Planned</span>
            <span style={{ textAlign: "center" }}>Actual</span>
            <span style={{ textAlign: "right" }}>Share</span>
          </div>

          {budget.lines.map((line) => {
            const over = line.actualInr > line.amountInr;
            const pct = line.amountInr ? Math.min(100, (line.actualInr / line.amountInr) * 100) : 0;
            return (
              <div className="brow" key={line.id}>
                <div className="brow__cat">
                  <span className="brow__dot" style={{ background: line.color }} />
                  <div style={{ minWidth: 0 }}>
                    <div className="brow__name">{line.category}</div>
                    <div className="brow__why">{line.rationale}</div>
                  </div>
                </div>

                <div className="brow__pri">
                  <PriorityTag priority={line.priority} />
                </div>

                <AmountInput
                  value={line.amountInr}
                  label={`${line.category} planned amount`}
                  onCommit={(next) => updateLineAmount(line.id, next)}
                />

                <div className="brow__actual" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    className="mono caption"
                    style={{ color: over ? "var(--red)" : "var(--text-2)" }}
                  >
                    {formatCompactINR(line.actualInr)}
                  </span>
                  <div className="meter meter--sm" style={{ width: "100%" }}>
                    <div
                      className={`meter__fill ${over ? "bg-over" : pct > 60 ? "bg-warn" : "bg-ok"}`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>

                <div className="row brow__share" style={{ justifyContent: "flex-end", gap: 4 }}>
                  <span className="brow__pct" style={{ textAlign: "right" }}>
                    {line.percent}%
                  </span>
                </div>
              </div>
            );
          })}

          <div
            className="brow"
            style={{ background: "var(--surface-1)", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
          >
            <div className="brow__cat">
              <span className="brow__dot" style={{ background: "var(--text-3)" }} />
              <div>
                <div className="brow__name">Total</div>
                <div className="brow__why">Sum of every line, held exactly at 100%</div>
              </div>
            </div>
            <div />
            <div className="mono label" style={{ textAlign: "right" }}>
              {formatINR(planned)}
            </div>
            <div className="mono caption muted" style={{ textAlign: "center" }}>
              {formatCompactINR(actual)}
            </div>
            <div className="mono label" style={{ textAlign: "right" }}>
              {Math.round(budget.lines.reduce((a, l) => a + l.percent, 0))}%
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AmountInput({
  value,
  label,
  onCommit,
}: {
  value: number;
  label: string;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value.toLocaleString("en-IN");

  return (
    <div className="brow__amount">
      <span aria-hidden="true">₹</span>
      <input
        aria-label={label}
        inputMode="numeric"
        value={shown}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => {
          if (draft !== null) onCommit(Number(draft) || 0);
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        style={{ width: 92 }}
      />
    </div>
  );
}
