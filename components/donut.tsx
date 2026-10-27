"use client";

import { useState } from "react";
import type { BudgetLine } from "@/lib/types";
import { formatCompactINR } from "@/lib/format";

const R = 54;
const C = 2 * Math.PI * R;

export function Donut({
  lines,
  total,
  size = 196,
  onSelect,
}: {
  lines: BudgetLine[];
  total: number;
  size?: number;
  onSelect?: (id: string | null) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  let offset = 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" role="img" aria-label={`Budget split across ${lines.length} categories`}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="17" />
        {lines.map((line) => {
          const fraction = line.amountInr / (total || 1);
          const length = Math.max(fraction * C - 2.4, 0.8);
          const dash = `${length} ${C - length}`;
          const rotation = -90 + (offset / C) * 360;
          offset += fraction * C;
          const isActive = active === line.id;
          return (
            <circle
              key={line.id}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={line.color}
              strokeWidth={isActive ? 21 : 17}
              strokeLinecap="round"
              strokeDasharray={dash}
              transform={`rotate(${rotation} 70 70)`}
              style={{
                transition: "stroke-width 180ms cubic-bezier(0.2,0,0,1), opacity 180ms",
                opacity: active && !isActive ? 0.42 : 1,
                cursor: onSelect ? "pointer" : "default",
              }}
              onMouseEnter={() => {
                setActive(line.id);
                onSelect?.(line.id);
              }}
              onMouseLeave={() => {
                setActive(null);
                onSelect?.(null);
              }}
            >
              <title>{`${line.category}: ${formatCompactINR(line.amountInr)} (${line.percent}%)`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="donut__center">
        <div className="donut__total">
          {active ? formatCompactINR(lines.find((l) => l.id === active)?.amountInr ?? 0) : formatCompactINR(total)}
        </div>
        <div className="donut__label">
          {active ? lines.find((l) => l.id === active)?.percent + "%" : "Total budget"}
        </div>
      </div>
    </div>
  );
}

export function Legend({ lines }: { lines: BudgetLine[] }) {
  return (
    <div className="legend">
      {lines.map((line) => (
        <div key={line.id} className="legend__row">
          <span className="legend__swatch" style={{ background: line.color }} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 150,
            }}
          >
            {line.category}
          </span>
          <span className="legend__val">{line.percent}%</span>
        </div>
      ))}
    </div>
  );
}
