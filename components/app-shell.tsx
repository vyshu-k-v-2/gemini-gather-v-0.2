"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePlanStore, type TabId } from "@/lib/plan-store";
import { Icon, Sparkle } from "./ui";
import { formatDate, formatDateShort, weekday } from "@/lib/format";

const NAV: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Plan", icon: "space_dashboard" },
  { id: "budget", label: "Budget", icon: "donut_large" },
  { id: "timeline", label: "Timeline", icon: "timeline" },
  { id: "vendors", label: "Vendors", icon: "storefront" },
  { id: "ideas", label: "Ideas", icon: "lightbulb" },
  { id: "family", label: "Family Mode", icon: "family_restroom" },
  { id: "actions", label: "Google Actions", icon: "apps" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { tab, setTab } = usePlanStore();

  return (
    <div className="shell">
      <NavigationRail tab={tab} setTab={setTab} />
      <div className="app-main">{children}</div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function NavigationRail({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const pathname = usePathname();
  const { setMultimodalOpen } = usePlanStore();

  return (
    <nav className="rail" aria-label="Primary">
      <Link href="/" className="rail__logo" aria-label="Gemini Gather home" title="Gemini Gather">
        <Sparkle size={26} />
      </Link>

      <div className="rail__nav" role="tablist" aria-label="Plan views navigation">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={pathname === "/" ? "/" : "/plan"}
            className="rail__item"
            role="tab"
            id={`nav-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-current={tab === item.id && pathname === "/plan" ? "page" : undefined}
            title={item.label}
            onClick={() => setTab(item.id)}
          >
            <span className="rail__icon">
              <Icon name={item.icon} filled={tab === item.id} />
            </span>
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <button
          type="button"
          className="rail__item"
          title="Multimodal Voice & Photo Studio"
          aria-label="Voice & Photo Input"
          onClick={() => setMultimodalOpen(true)}
          style={{ color: "var(--gemini-b)" }}
        >
          <span className="rail__icon" style={{ background: "var(--surface-tint)" }}>
            <Icon name="mic" />
          </span>
          Studio
        </button>
      </div>
    </nav>
  );
}

function BottomNav({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const router = useRouter();

  return (
    <nav className="bottomnav" role="tablist" aria-label="Mobile plan navigation">
      {NAV.slice(0, 5).map((item) => (
        <button
          key={item.id}
          type="button"
          className="bottomnav__item"
          role="tab"
          aria-selected={tab === item.id}
          aria-current={tab === item.id ? "page" : undefined}
          aria-label={item.label}
          onClick={() => {
            setTab(item.id);
            router.push("/plan");
          }}
        >
          <span className="bottomnav__icon">
            <Icon name={item.icon} filled={tab === item.id} />
          </span>
          {item.label}
        </button>
      ))}
      <button
        type="button"
        className="bottomnav__item"
        role="tab"
        aria-selected={tab === "family"}
        aria-current={tab === "family" ? "page" : undefined}
        aria-label="Family Mode"
        onClick={() => {
          setTab("family");
          router.push("/plan");
        }}
      >
        <span className="bottomnav__icon">
          <Icon name="family_restroom" filled={tab === "family"} />
        </span>
        Family
      </button>
    </nav>
  );
}

export function TopBar() {
  const { plan, theme, toggleTheme, setExportOpen, setMultimodalOpen, showSnack, tab, setTab } = usePlanStore();
  const router = useRouter();

  if (!plan) {
    return (
      <header className="appbar">
        <div className="appbar__title">Drafting your plan with Gemini Gather…</div>
        <div className="spacer" />
        <div className="skeleton" style={{ width: 120, height: 30, borderRadius: 999 }} />
      </header>
    );
  }

  const b = plan.brief;

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      showSnack("Gemini Gather plan link copied to clipboard!");
    } catch {
      showSnack("Copy page URL to share this plan.");
    }
  };

  return (
    <header className="appbar">
      <button
        type="button"
        className="icon-btn hide-desktop"
        aria-label="Back to home"
        title="Home"
        onClick={() => router.push("/")}
      >
        <Icon name="arrow_back" />
      </button>

      <div style={{ minWidth: 0 }}>
        <div className="row gap-8" style={{ alignItems: "center" }}>
          <div className="appbar__title">{b.title}</div>
          <span className="chip chip--ai chip--xs hide-mobile" style={{ height: 22 }}>
            <Sparkle size={11} />
            Gemini Gather
          </span>
        </div>
        <div className="appbar__sub">
          <Icon name="event" size={13} />
          <span>
            {weekday(b.date)}, {formatDate(b.date)}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {b.guests} guests · {b.city}
          </span>
          <span aria-hidden="true" className="hide-mobile">·</span>
          <span className="hide-mobile" style={{ color: plan.health.score > 80 ? "var(--green)" : "var(--yellow)", fontWeight: 600 }}>
            Health: {plan.health.score}/100
          </span>
        </div>
      </div>

      <div className="spacer" />

      <div className="appbar__actions">
        <button
          type="button"
          className="btn btn--tonal btn--sm hide-mobile"
          onClick={() => setMultimodalOpen(true)}
          title="Multimodal Voice (Telugu/Hindi) and Photo Studio"
        >
          <Icon name="mic" size={16} />
          <span>Voice &amp; Photo</span>
        </button>

        <button
          type="button"
          className={`btn btn--sm hide-mobile ${tab === "family" ? "btn--filled" : "btn--tonal"}`}
          onClick={() => setTab("family")}
        >
          <Icon name="family_restroom" size={16} />
          <span>Family Mode</span>
        </button>

        <button
          type="button"
          className={`btn btn--sm ${tab === "actions" ? "btn--filled" : "btn--outlined"}`}
          onClick={() => setTab("actions")}
        >
          <Icon name="apps" size={16} />
          <span className="hide-xs">Google Tools</span>
          <span className="show-xs">Tools</span>
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title="Theme"
        >
          <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} />
        </button>

        <button type="button" className="btn btn--text hide-mobile" onClick={share}>
          <Icon name="share" size={18} />
          Share
        </button>

        <button
          type="button"
          className="btn btn--filled btn--sm"
          onClick={() => setExportOpen(true)}
        >
          <Icon name="ios_share" size={17} />
          <span className="hide-xs">Export</span>
        </button>
      </div>
      <span className="sr-only">Current view: {tab}</span>
    </header>
  );
}
