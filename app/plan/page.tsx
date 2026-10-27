"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, TopBar } from "@/components/app-shell";
import { ChatPanel } from "@/components/chat-panel";
import { OverviewTab } from "@/components/tabs/overview";
import { BudgetTab } from "@/components/tabs/budget";
import { TimelineTab } from "@/components/tabs/timeline";
import { VendorsTab } from "@/components/tabs/vendors";
import { IdeasTab } from "@/components/tabs/ideas";
import { FamilyTab } from "@/components/tabs/family";
import { ActionsTab } from "@/components/tabs/actions";
import { WhatIfSheet } from "@/components/what-if-sheet";
import { ExportDialog } from "@/components/export-dialog";
import { PlanDiffModal } from "@/components/living-replanner";
import { MultimodalStudioModal } from "@/components/multimodal-studio";
import { usePlanStore } from "@/lib/plan-store";
import { Dialog, Icon, Sparkle } from "@/components/ui";

const TABS = [
  { id: "overview", label: "Overview", icon: "space_dashboard" },
  { id: "budget", label: "Budget", icon: "donut_large" },
  { id: "timeline", label: "Timeline", icon: "timeline" },
  { id: "vendors", label: "Vendors", icon: "storefront" },
  { id: "ideas", label: "Ideas", icon: "lightbulb" },
  { id: "family", label: "Family Mode", icon: "family_restroom" },
  { id: "actions", label: "Google Actions", icon: "apps" },
] as const;

export default function PlanPage() {
  const { plan, ready, generating, tab, setTab, generatePlan, agents, lastDiff, dismissDiff, setDiffModalOpen } =
    usePlanStore();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    document.querySelector(".canvas")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const index = Number(e.key);
      if (index >= 1 && index <= TABS.length) {
        e.preventDefault();
        setTab(TABS[index - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTab]);

  return (
    <AppShell>
      <TopBar />

      {!ready ? (
        <WorkspaceSkeleton />
      ) : !plan ? (
        generating ? (
          <WorkspaceSkeleton agents={agents} />
        ) : (
          <EmptyState
            onStart={() => {
              void generatePlan(
                "Plan my brother's engagement, 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, vegetarian"
              );
            }}
            onHome={() => router.push("/")}
          />
        )
      ) : (
        <div className="workspace">
          <div className="chat-slot">
            <ChatPanel />
          </div>

          <section
            className="canvas"
            id="main-content"
            role="region"
            aria-label={`Plan canvas — ${TABS.find((t) => t.id === tab)?.label ?? "Overview"}`}
          >
            <div className="canvas__body" tabIndex={0}>
              {lastDiff && tab === "overview" ? (
                <div className="diffbar" role="status" style={{ marginBottom: 18 }}>
                  <Icon name="auto_awesome" size={17} />
                  <span style={{ flex: 1 }}>
                    <strong>{lastDiff.label}</strong> — {lastDiff.deltas.length} lines moved,{" "}
                    {lastDiff.guestsDelta !== 0
                      ? `${lastDiff.guestsDelta > 0 ? "+" : "−"}${Math.abs(lastDiff.guestsDelta)} guests`
                      : "same guest count"}
                    .
                  </span>
                  <button
                    type="button"
                    className="btn btn--text btn--xs"
                    onClick={() => setDiffModalOpen(true)}
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    View Diff &amp; Trade-offs
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: "inherit" }}
                    onClick={dismissDiff}
                    aria-label="Dismiss change summary"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ) : null}

              {generating ? <CanvasSkeleton /> : null}

              {tab === "overview" && <OverviewTab />}
              {tab === "budget" && <BudgetTab />}
              {tab === "timeline" && <TimelineTab />}
              {tab === "vendors" && <VendorsTab />}
              {tab === "ideas" && <IdeasTab />}
              {tab === "family" && <FamilyTab />}
              {tab === "actions" && <ActionsTab />}

              <div className="canvas__foot">
                <Sparkle size={11} />
                Powered by Gemini Gather &amp; Imagen 3 · synchronized {new Date(plan.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </section>
        </div>
      )}

      {plan ? (
        <>
          <button
            type="button"
            className="chat-fab"
            onClick={() => setChatOpen(true)}
            aria-label="Open planning copilot"
          >
            <Icon name="forum" size={24} />
          </button>
          <Dialog
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            labelledBy="mobile-chat-title"
            kind="sheet"
          >
            <div className="row" style={{ justifyContent: "flex-end", marginTop: -6 }}>
              <h2 className="sr-only" id="mobile-chat-title">
                Planning copilot
              </h2>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close copilot"
                onClick={() => setChatOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="chat-in-dialog" style={{ height: "68dvh", display: "flex" }}>
              <ChatPanel />
            </div>
          </Dialog>
        </>
      ) : null}

      <WhatIfSheet />
      <ExportDialog />
      <PlanDiffModal />
      <MultimodalStudioModal />
    </AppShell>
  );
}

function WorkspaceSkeleton({ agents }: { agents?: { id: string; label: string; state: string }[] }) {
  return (
    <div className="workspace">
      <aside className="chat" aria-hidden="true">
        <div className="chat__head">
          <div className="skeleton" style={{ width: 150, height: 18 }} />
          <div className="chat__agents">
            {(agents ?? []).map((a) => (
              <span
                key={a.id}
                className={`agentchip ${a.state === "done" ? "agentchip--done" : a.state === "running" ? "agentchip--run" : ""}`}
              >
                <Icon
                  name={
                    a.state === "done"
                      ? "check_circle"
                      : a.state === "running"
                        ? "progress_activity"
                        : "radio_button_unchecked"
                  }
                />
                {a.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton" style={{ height: 64, borderRadius: 18 }} />
          <div className="skeleton" style={{ height: 92, width: "80%", borderRadius: 18 }} />
        </div>
      </aside>
      <section className="canvas">
        <div className="canvas__body">
          <CanvasSkeleton />
        </div>
      </section>
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div aria-live="polite" aria-busy="true">
      <div className="skeleton" style={{ height: 168, borderRadius: 28, marginBottom: 16 }} />
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="skeleton" style={{ height: 96, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 96, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 96, borderRadius: 16 }} />
      </div>
      <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      <p className="caption muted" style={{ marginTop: 12 }}>
        Gemini Gather agents are synchronizing in parallel — budget, timeline, vendors, risk radar and family collaboration.
      </p>
    </div>
  );
}

function EmptyState({ onStart, onHome }: { onStart: () => void; onHome: () => void }) {
  return (
    <main className="home__main" style={{ maxWidth: 620, paddingTop: 80 }}>
      <h1 className="greeting" style={{ fontSize: 30, lineHeight: 40 }}>
        <Sparkle size={28} />
        <span>No plan loaded yet</span>
      </h1>
      <p className="home__lede">
        Start with the demo brief — 80 guests, ₹6 lakh, Hyderabad, eight weeks out — or write your own
        on the home screen with voice in Telugu or Hindi.
      </p>
      <div className="row gap-8" style={{ justifyContent: "center" }}>
        <button type="button" className="btn btn--filled" onClick={onStart}>
          <Icon name="auto_awesome" size={18} />
          Try the demo brief (80 guests)
        </button>
        <button type="button" className="btn btn--outlined" onClick={onHome}>
          Write my own
        </button>
      </div>
    </main>
  );
}
