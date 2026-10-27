"use client";

import { useEffect, useId, useRef } from "react";
import { usePlanStore } from "@/lib/plan-store";

export function Icon({
  name,
  filled,
  size,
  className,
  style,
}: {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded${filled ? " fill" : ""}${className ? " " + className : ""}`}
      style={{ fontSize: size ? `${size}px` : undefined, ...style }}
    >
      {name}
    </span>
  );
}

export function Sparkle({ size = 28, id }: { size?: number; id?: string }) {
  const auto = useId().replace(/:/g, "");
  const gid = id ?? `spark-${auto}`;
  return (
    <span className="sparkle" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id={gid} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4285F4" />
            <stop offset="0.52" stopColor="#9B72CB" />
            <stop offset="1" stopColor="#D96570" />
          </linearGradient>
        </defs>
        <path
          d="M12 1.8c.7 5.2 3.9 8.4 9.1 9.1.6.1.6 1 0 1.1-5.2.7-8.4 3.9-9.1 9.1-.1.6-1 .6-1.1 0-.7-5.2-3.9-8.4-9.1-9.1-.6-.1-.6-1 0-1.1 5.2-.7 8.4-3.9 9.1-9.1.1-.6 1-.6 1.1 0Z"
          fill={`url(#${gid})`}
        />
        <path
          d="M19.4 2.2c.24 1.7 1.3 2.76 3 3-.2.07-.2.34 0 .4-1.7.24-2.76 1.3-3 3-.07.2-.34.2-.4 0-.24-1.7-1.3-2.76-3-3-.2-.06-.2-.33 0-.4 1.7-.24 2.76-1.3 3-3 .06-.2.33-.2.4 0Z"
          fill={`url(#${gid})`}
          opacity="0.75"
        />
      </svg>
    </span>
  );
}

export function AIBadge({ label = "Gemini" }: { label?: string }) {
  return (
    <span className="chip chip--ai chip--xs">
      <Sparkle size={12} />
      {label}
    </span>
  );
}

export function Check({
  checked,
  onChange,
  label,
  size = 22,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: number;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      className="check"
      style={{ width: size, height: size }}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onChange();
        }
      }}
    >
      {checked ? <Icon name="check" size={15} /> : null}
    </span>
  );
}

export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  kind = "dialog",
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  kind?: "dialog" | "sheet";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const focusables = () =>
      Array.from(
        root?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    const timer = window.setTimeout(() => {
      focusables()[0]?.focus();
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={kind === "sheet" ? "sheet" : "dialog"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {kind === "sheet" ? <div className="sheet__grab" aria-hidden="true" /> : null}
        <div className={kind === "sheet" ? "sheet__inner" : undefined}>{children}</div>
      </div>
    </>
  );
}

export function SnackbarHost() {
  const { snack, showSnack } = usePlanStore();
  if (!snack) return null;
  return (
    <div className="snackbar" role="status" aria-live="polite">
      <span style={{ flex: 1 }}>{snack}</span>
      <button
        type="button"
        className="chip chip--xs"
        style={{ background: "transparent", borderColor: "currentColor", color: "inherit", opacity: 0.85 }}
        onClick={() => showSnack("")}
      >
        Dismiss
      </button>
    </div>
  );
}

export function PriorityTag({ priority }: { priority: "must" | "nice" | "optional" }) {
  const map = {
    must: { label: "Must", cls: "pri--must" },
    nice: { label: "Nice", cls: "pri--nice" },
    optional: { label: "Optional", cls: "pri--opt" },
  } as const;
  return <span className={`pri ${map[priority].cls}`}>{map[priority].label}</span>;
}
