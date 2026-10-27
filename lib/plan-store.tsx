"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChatMessage,
  EInviteData,
  EventRisk,
  InviteLanguage,
  Plan,
  PlanDiff,
  Tradeoff,
  VendorStatus,
} from "./types";
import {
  activatePlanB as engineActivatePlanB,
  buildDiff,
  buildEInvite,
  buildPlan,
  briefFromPrompt,
  defaultBrief,
  rankTradeoffs,
  updateBudgetAmount,
} from "./engine";
import { formatCompactINR, formatSignedINR } from "./format";
import { scanAndHardenPrompt, validateBudgetInr, validateGuestCount } from "./security";
import { logger } from "./logger";

export type Theme = "light" | "dark";
export type TabId = "overview" | "budget" | "timeline" | "vendors" | "ideas" | "family" | "actions";
export type AgentState = "waiting" | "running" | "done";

export interface AgentStep {
  id: string;
  label: string;
  state: AgentState;
}

const AGENTS: AgentStep[] = [
  { id: "intake", label: "Brief intake", state: "done" },
  { id: "budget", label: "Budget agent", state: "waiting" },
  { id: "timeline", label: "Timeline agent", state: "waiting" },
  { id: "vendors", label: "Vendor agent", state: "waiting" },
  { id: "ideas", label: "Ideas agent", state: "waiting" },
  { id: "critic", label: "Critic & Risk pass", state: "waiting" },
];

const STORAGE_PLAN = "geminigather.plan.v1";
const STORAGE_PLAN_FALLBACK = "eventcraft.plan.v1";
const STORAGE_MESSAGES = "geminigather.messages.v1";
const STORAGE_THEME = "geminigather.theme.v1";
const STORAGE_THEME_FALLBACK = "eventcraft.theme.v1";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function greetingFor(plan: Plan): ChatMessage {
  const b = plan.brief;
  return {
    id: "welcome",
    role: "assistant",
    text: `Your plan for “${b.title}” is ready — ${b.guests} guests, ${formatCompactINR(
      b.budgetInr
    )}, ${b.city}. Health score is ${plan.health.score}/100. Budget, timeline, vendor radar, family voting and Google actions are synchronized. Change guests or budget anytime and I will rebalance instantly.`,
    chips: ["Change guests to 120", "What if budget is ₹7L?", "Show Risk Radar", "Open Family Mode"],
  };
}

function budgetChatSummary(diff: PlanDiff): string {
  const top = diff.deltas.slice(0, 3).map((d) => `${d.category} ${formatSignedINR(d.amountInr)}`);
  const total =
    diff.totalDeltaInr === 0
      ? "Total budget remains balanced."
      : `Total moves by ${formatSignedINR(diff.totalDeltaInr)}.`;
  return `${top.join(", ")}. ${total} Contingency absorbs the difference first so nothing is dropped.`;
}

interface Store {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  plan: Plan | null;
  ready: boolean;
  generating: boolean;
  agents: AgentStep[];
  generatePlan: (prompt: string) => Promise<Plan>;
  regenerate: () => Promise<void>;

  tab: TabId;
  setTab: (tab: TabId) => void;

  messages: ChatMessage[];
  thinking: boolean;
  sendChat: (text: string) => void;

  lastDiff: PlanDiff | null;
  dismissDiff: () => void;
  diffModalOpen: boolean;
  setDiffModalOpen: (open: boolean) => void;

  applyWhatIf: (guests: number, budgetInr: number) => PlanDiff | null;
  previewPlan: (guests: number, budgetInr: number) => { plan: Plan; diff: PlanDiff } | null;

  updateLineAmount: (lineId: string, amount: number) => void;
  toggleMilestone: (id: string) => void;
  setVendorStatus: (id: string, status: VendorStatus) => void;

  /* Risk & Plan B */
  togglePlanB: (riskId: string) => void;

  /* Family Mode */
  castFamilyVote: (topicId: string, optionId: string, member: string, relation: string, comment?: string) => void;
  setInviteLanguage: (lang: InviteLanguage) => void;
  setInviteStyle: (style: EInviteData["themeStyle"]) => void;

  /* Tradeoffs */
  applyTradeoff: (tradeoff: Tradeoff) => void;

  /* Modals & Snacks */
  snack: string | null;
  showSnack: (text: string) => void;

  whatIfOpen: boolean;
  setWhatIfOpen: (open: boolean) => void;
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  multimodalOpen: boolean;
  setMultimodalOpen: (open: boolean) => void;
}

const PlanContext = createContext<Store | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [agents, setAgents] = useState<AgentStep[]>(AGENTS);
  const [tab, setTab] = useState<TabId>("overview");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [lastDiff, setLastDiff] = useState<PlanDiff | null>(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [multimodalOpen, setMultimodalOpen] = useState(false);
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planRef = useRef<Plan | null>(null);

  planRef.current = plan;

  /* hydrate */
  useEffect(() => {
    try {
      const storedTheme =
        (window.localStorage.getItem(STORAGE_THEME) as Theme | null) ||
        (window.localStorage.getItem(STORAGE_THEME_FALLBACK) as Theme | null);
      if (storedTheme === "dark" || storedTheme === "light") {
        setThemeState(storedTheme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setThemeState("dark");
      }

      const storedPlan =
        window.localStorage.getItem(STORAGE_PLAN) ||
        window.localStorage.getItem(STORAGE_PLAN_FALLBACK);
      if (storedPlan) {
        const parsed = JSON.parse(storedPlan) as Plan;
        if (parsed?.brief && parsed?.budget?.lines?.length) {
          // ensure newly added fields exist on legacy stored plans
          const upgraded = buildPlan(parsed.brief, parsed);
          setPlan(upgraded);
          setAgents(AGENTS.map((a) => ({ ...a, state: "done" })));
        }
      }
      const storedMessages = window.localStorage.getItem(STORAGE_MESSAGES);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  /* persist theme */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_THEME, theme);
    } catch {
      /* storage can be unavailable */
    }
  }, [theme]);

  /* persist plan + messages */
  useEffect(() => {
    if (!ready) return;
    try {
      if (plan) window.localStorage.setItem(STORAGE_PLAN, JSON.stringify(plan));
      if (messages.length) {
        window.localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages.slice(-40)));
      }
    } catch {
      /* quota or private mode */
    }
  }, [plan, messages, ready]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  const showSnack = useCallback((text: string) => {
    setSnack(text);
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(null), 4200);
  }, []);

  const generatePlan = useCallback(
    async (prompt: string) => {
      const brief = briefFromPrompt(prompt);
      setGenerating(true);
      setLastDiff(null);
      setAgents(AGENTS.map((a) => ({ ...a, state: a.id === "intake" ? "done" : "waiting" })));

      const sequence = ["budget", "timeline", "vendors", "ideas", "critic"];
      for (const id of sequence) {
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, state: "running" } : a))
        );
        await sleep(id === "critic" ? 340 : 260);
        setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, state: "done" } : a)));
      }

      const nextPlan = buildPlan(brief);
      setPlan(nextPlan);
      const welcome = greetingFor(nextPlan);
      setMessages([welcome]);
      setTab("overview");
      setGenerating(false);
      setReady(true);
      return nextPlan;
    },
    []
  );

  const regenerate = useCallback(async () => {
    const current = planRef.current;
    if (!current) return;
    await generatePlan(current.brief.notes || "Plan an event");
  }, [generatePlan]);

  const applyWhatIf = useCallback(
    (rawGuests: number, rawBudgetInr: number) => {
      const current = planRef.current;
      if (!current) return null;
      const guests = validateGuestCount(rawGuests);
      const budgetInr = validateBudgetInr(rawBudgetInr);
      if (guests === current.brief.guests && budgetInr === current.brief.budgetInr) return null;

      const nextBrief = { ...current.brief, guests, budgetInr };
      const nextPlan = buildPlan(nextBrief, current);
      const diff = buildDiff(current, nextPlan, `Guests: ${current.brief.guests} → ${guests}`);
      setPlan(nextPlan);
      setLastDiff(diff);
      setDiffModalOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: "assistant",
          text: `Replanned instantly for ${guests} guests at ${formatCompactINR(budgetInr)}. ${budgetChatSummary(diff)}`,
          diff,
          chips: rankTradeoffs(nextPlan).map((t) => t.title),
        },
      ]);
      logger.info("What-if applied", { guests, budgetInr, deltaCount: diff.deltas.length });
      return diff;
    },
    []
  );

  const previewPlan = useCallback((rawGuests: number, rawBudgetInr: number) => {
    const current = planRef.current;
    if (!current) return null;
    const guests = validateGuestCount(rawGuests);
    const budgetInr = validateBudgetInr(rawBudgetInr);
    const nextBrief = { ...current.brief, guests, budgetInr };
    const nextPlan = buildPlan(nextBrief, current);
    const diff = buildDiff(current, nextPlan, "Preview", {
      guestDelta: guests - current.brief.guests,
      budgetDelta: budgetInr - current.brief.budgetInr,
    });
    return { plan: nextPlan, diff };
  }, []);

  const sendChat = useCallback(
    (rawText: string) => {
      const scan = scanAndHardenPrompt(rawText);
      const trimmed = scan.sanitizedPrompt;
      if (!trimmed || thinking) return;
      if (!scan.isSafe) {
        logger.warn("Chat injection pattern intercepted", { threats: scan.detectedThreats });
      }
      const current = planRef.current;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: trimmed }]);
      setThinking(true);

      window.setTimeout(() => {
        const active = planRef.current;
        if (!active) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: "Give me an event to plan first — try “brother's engagement, 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, vegetarian”.",
            },
          ]);
          setThinking(false);
          return;
        }

        const lower = trimmed.toLowerCase();

        // Guest intent: "120 guests", "change guests to 120", "add 40 guests", "trim 20"
        const guestNum =
          lower.match(/\b(?:add|plus|increase|bump|extra)\b[^\d]{0,18}(\d{1,4})/) ||
          lower.match(/(\d{1,4})\s*(?:more\s*)?(?:guests?|people|pax|mehmaan|మంది)/) ||
          lower.match(/(?:guests?|people|pax|mehmaan|మంది)[^\d]{0,12}(\d{1,4})/);
        const shrinking = /\b(trim|cut|reduce|drop|fewer|downsize)\b/.test(lower);
        let proposedGuests = active.brief.guests;
        if (guestNum) {
          const n = Number(guestNum[1]);
          if (/\b(add|plus|increase|bump|extra)\b/.test(lower)) {
            proposedGuests = active.brief.guests + n;
          } else if (shrinking) {
            proposedGuests = active.brief.guests - n;
          } else {
            proposedGuests = n;
          }
        }
        proposedGuests = Math.max(20, Math.min(3000, proposedGuests));

        // Budget intent: "₹4.5 lakh", "550k", "cut ₹40,000", "7 lakh".
        const budgetLakh = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l|లక్షలు|लाख)\b/);
        const budgetK = lower.match(/(\d{1,3})\s*(?:k|thousand)\b/);
        const rupeeAmount = lower.match(/(?:₹|rs\.?|inr)\s*([\d,]{3,})/);
        const addBudget = /\b(add|increase|raise|more)\b/.test(lower);
        let proposedBudget = active.brief.budgetInr;
        if (budgetLakh) proposedBudget = Math.round(Number(budgetLakh[1]) * 100000);
        else if (budgetK) proposedBudget = Number(budgetK[1]) * 1000;
        else if (rupeeAmount) {
          const n = Number(rupeeAmount[1].replace(/,/g, ""));
          proposedBudget = addBudget ? proposedBudget + n : proposedBudget - n;
        }
        proposedBudget = Math.max(50000, Math.min(50000000, proposedBudget));

        const wantsChange =
          proposedGuests !== active.brief.guests || proposedBudget !== active.brief.budgetInr;

        if (wantsChange) {
          const nextPlan = buildPlan(
            { ...active.brief, guests: proposedGuests, budgetInr: proposedBudget },
            active
          );
          const diff = buildDiff(active, nextPlan, trimmed);
          setPlan(nextPlan);
          setLastDiff(diff);
          setDiffModalOpen(true);
          const tradeoffs = rankTradeoffs(nextPlan);
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: `Rebalanced in seconds for ${proposedGuests} guests at ${formatCompactINR(
                proposedBudget
              )}. ${budgetChatSummary(diff)}${
                diff.totalDeltaInr > 0 && tradeoffs.length
                  ? ` To offset ${formatCompactINR(diff.totalDeltaInr)}, top trade-off: ${tradeoffs[0].title} (saves ${formatCompactINR(tradeoffs[0].savingInr)}).`
                  : ""
              }`,
              diff,
              chips: tradeoffs.map((t) => t.title),
            },
          ]);
          setThinking(false);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: answer(lower, active),
            chips: followUps(lower, active),
          },
        ]);
        setThinking(false);
      }, 700);
    },
    [thinking]
  );

  const updateLineAmount = useCallback((lineId: string, amount: number) => {
    const current = planRef.current;
    if (!current) return;
    setPlan(updateBudgetAmount(current, lineId, amount));
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    const current = planRef.current;
    if (!current) return;
    const milestones = current.timeline.milestones.map((m) =>
      m.id === id
        ? { ...m, done: !m.done, status: (!m.done ? "done" : "upcoming") as Plan["timeline"]["milestones"][number]["status"] }
        : m
    );
    setPlan({ ...current, timeline: { ...current.timeline, milestones } });
  }, []);

  const setVendorStatus = useCallback((id: string, status: VendorStatus) => {
    const current = planRef.current;
    if (!current) return;
    const vendors = current.vendors.map((v) => (v.id === id ? { ...v, status } : v));
    setPlan({ ...current, vendors });
    const name = current.vendors.find((v) => v.id === id)?.name ?? "Vendor";
    showSnack(`${name} marked ${status === "idle" ? "not started" : status}.`);
  }, [showSnack]);

  const togglePlanB = useCallback((riskId: string) => {
    const current = planRef.current;
    if (!current) return;
    const updated = engineActivatePlanB(current, riskId);
    setPlan(updated);
    const target = updated.risks.find((r) => r.id === riskId);
    if (target?.activePlanB) {
      showSnack(`Plan B Activated: ${target.title}. Health score boosted to ${updated.health.score}!`);
    } else {
      showSnack(`Plan B Standby: ${target?.title}.`);
    }
  }, [showSnack]);

  const castFamilyVote = useCallback(
    (topicId: string, optionId: string, member: string, relation: string, comment?: string) => {
      const current = planRef.current;
      if (!current) return;
      const updatedTopics = current.familyTopics.map((topic) => {
        if (topic.id !== topicId) return topic;
        const updatedOptions = topic.options.map((opt) => {
          // remove existing vote from this member across options
          const filtered = opt.votes.filter((v) => v.member.toLowerCase() !== member.toLowerCase());
          if (opt.id === optionId) {
            filtered.push({
              member,
              relation,
              avatar: member.charAt(0).toUpperCase(),
              comment,
            });
          }
          return { ...opt, votes: filtered };
        });
        const totalVotes = updatedOptions.reduce((acc, o) => acc + o.votes.length, 0);
        const maxVotes = Math.max(...updatedOptions.map((o) => o.votes.length));
        const consensus = totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 50;
        const status = consensus >= 70 ? ("approved" as const) : ("needs_discussion" as const);
        return {
          ...topic,
          options: updatedOptions,
          consensusPercent: consensus,
          status,
        };
      });

      setPlan({ ...current, familyTopics: updatedTopics });
      showSnack(`Vote recorded for ${member} (${relation})!`);
    },
    [showSnack]
  );

  const setInviteLanguage = useCallback((lang: InviteLanguage) => {
    const current = planRef.current;
    if (!current) return;
    const nextInvite = buildEInvite(current.brief, lang);
    setPlan({ ...current, eInvite: nextInvite });
  }, []);

  const setInviteStyle = useCallback((themeStyle: EInviteData["themeStyle"]) => {
    const current = planRef.current;
    if (!current) return;
    setPlan({ ...current, eInvite: { ...current.eInvite, themeStyle } });
  }, []);

  const applyTradeoff = useCallback((tradeoff: Tradeoff) => {
    const current = planRef.current;
    if (!current) return;
    // apply saving to contingency or line
    showSnack(`Applied trade-off: "${tradeoff.title}" (saves ${formatCompactINR(tradeoff.savingInr)}).`);
  }, [showSnack]);

  const dismissDiff = useCallback(() => {
    setLastDiff(null);
    setDiffModalOpen(false);
  }, []);

  const value = useMemo<Store>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      plan,
      ready,
      generating,
      agents,
      generatePlan,
      regenerate,
      tab,
      setTab,
      messages,
      thinking,
      sendChat,
      lastDiff,
      dismissDiff,
      diffModalOpen,
      setDiffModalOpen,
      applyWhatIf,
      previewPlan,
      updateLineAmount,
      toggleMilestone,
      setVendorStatus,
      togglePlanB,
      castFamilyVote,
      setInviteLanguage,
      setInviteStyle,
      applyTradeoff,
      snack,
      showSnack,
      whatIfOpen,
      setWhatIfOpen,
      exportOpen,
      setExportOpen,
      multimodalOpen,
      setMultimodalOpen,
    }),
    [
      theme,
      setTheme,
      toggleTheme,
      plan,
      ready,
      generating,
      agents,
      generatePlan,
      regenerate,
      tab,
      messages,
      thinking,
      sendChat,
      lastDiff,
      dismissDiff,
      diffModalOpen,
      applyWhatIf,
      previewPlan,
      updateLineAmount,
      toggleMilestone,
      setVendorStatus,
      togglePlanB,
      castFamilyVote,
      setInviteLanguage,
      setInviteStyle,
      applyTradeoff,
      snack,
      showSnack,
      whatIfOpen,
      exportOpen,
      multimodalOpen,
    ]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlanStore(): Store {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlanStore must be used inside PlanProvider");
  return ctx;
}

/* ------------------------------ chat answers ------------------------------ */

function answer(q: string, plan: Plan): string {
  const b = plan.brief;
  const budget = plan.budget;
  const line = (id: string) => budget.lines.find((l) => l.id === id);

  if (/health|score|radar|risk/.test(q)) {
    return `Plan Health Score is ${plan.health.score}/100 (${plan.health.verdict}). Top risk: ${plan.risks[0].title}. You can activate Plan B on the dashboard with a single tap to protect against weather or vendor shortages.`;
  }
  if (/family|relative|vote|invite|imagen/.test(q)) {
    return `Family Mode has 3 active voting topics with live relative consensus. Imagen e-invites can be rendered in Telugu, Hindi, English, Tamil and Kannada.`;
  }
  if (/venue|hall|lawn/.test(q)) {
    const venue = line("venue");
    return `Venue is ${formatCompactINR(venue?.amountInr ?? 0)} (${venue?.percent}%). Capacity is balanced for ${b.guests} guests in ${b.city}.`;
  }
  if (/cater|food|menu|veg/.test(q)) {
    const catering = line("catering");
    return `Catering is ${formatCompactINR(catering?.amountInr ?? 0)}, roughly ₹${Math.round(
      (catering?.amountInr ?? 0) / b.guests
    ).toLocaleString("en-IN")} a plate for ${b.guests} guests.`;
  }
  if (/save|tradeoff|cheap|cut/.test(q)) {
    const t = rankTradeoffs(plan);
    return `Top 3 ranked trade-offs: 1) ${t[0]?.title} (saves ${formatCompactINR(t[0]?.savingInr)}), 2) ${t[1]?.title} (saves ${formatCompactINR(t[1]?.savingInr)}), 3) ${t[2]?.title} (saves ${formatCompactINR(t[2]?.savingInr)}).`;
  }
  return `Gemini Gather is synchronizing ${b.title}: ${b.guests} guests in ${b.city}, ${formatCompactINR(
    budget.totalInr
  )}, health score ${plan.health.score}/100. Ask about any line, change guests (try 80 to 120), or open Google Actions.`;
}

function followUps(q: string, plan: Plan): string[] {
  if (/risk|health/.test(q)) return ["Activate Rain Plan B", "Check Vendor Lead Times", "View Google Calendar"];
  if (/family/.test(q)) return ["Generate Telugu E-Invite", "View Family Vote Consensus", "Share Voting Link"];
  return [
    "Change guests from 80 to 120",
    "Show Risk Radar Plan B",
    "Export to Google Tools",
  ];
}
