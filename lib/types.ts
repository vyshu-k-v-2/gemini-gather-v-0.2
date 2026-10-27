export type EventType = "wedding" | "engagement" | "birthday" | "community";
export type Priority = "must" | "nice" | "optional";
export type VendorStatus = "idle" | "contacted" | "quoted" | "booked";

export interface EventBrief {
  eventType: EventType;
  title: string;
  date: string;
  city: string;
  guests: number;
  budgetInr: number;
  vibe: string[];
  constraints: string[];
  mustHaves: string[];
  notes: string;
}

export interface BudgetLine {
  id: string;
  category: string;
  icon: string;
  percent: number;
  amountInr: number;
  actualInr: number;
  priority: Priority;
  rationale: string;
  color: string;
}

export interface BudgetPlan {
  totalInr: number;
  lines: BudgetLine[];
  contingencyPercent: number;
  perGuestInr: number;
  verdict: "comfortable" | "tight" | "unrealistic";
  note: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  owner: string;
  tMinus: number;
  status: "done" | "due" | "upcoming";
  dependsOn: string[];
  vendorCategory?: string;
  done: boolean;
}

export interface TimelinePlan {
  milestones: Milestone[];
  compressed: boolean;
  note: string;
}

export interface VendorOption {
  id: string;
  name: string;
  area: string;
  rating: number;
  distanceKm: number;
  priceBand: string;
  priceIsEstimated: boolean;
}

export interface VendorCategory {
  id: string;
  name: string;
  icon: string;
  status: VendorStatus;
  checklist: string[];
  options: VendorOption[];
  note?: string;
}

export interface IdeaCard {
  id: string;
  title: string;
  tag: string;
  why: string;
  palette: string[];
  menu: string[];
  activities: string[];
  gradient: string;
}

export interface CriticCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export interface CriticReport {
  pass: boolean;
  checks: CriticCheck[];
}

export interface PlanDelta {
  lineId: string;
  category: string;
  amountInr: number;
  percent: number;
}

export interface Tradeoff {
  rank: number;
  title: string;
  detail: string;
  savingInr: number;
}

export interface PlanDiff {
  label: string;
  deltas: PlanDelta[];
  tradeoffs: Tradeoff[];
  totalDeltaInr: number;
  guestsDelta: number;
  budgetDeltaInr: number;
}

/* --- Plan Health & Risk Radar --- */
export interface PlanHealth {
  score: number; // 0 - 100
  budgetBufferScore: number; // 0 - 100
  timelineSlackScore: number; // 0 - 100
  vendorProgressScore: number; // 0 - 100
  verdict: "Strong" | "Moderate" | "Vulnerable";
  summary: string;
}

export interface EventRisk {
  id: string;
  title: string;
  category: "weather" | "vendor" | "permit" | "budget" | "logistics";
  severity: "high" | "medium" | "low";
  probabilityPercent: number;
  description: string;
  mitigation: string;
  planBAction: string;
  planBLabel: string;
  activePlanB: boolean;
  impactNote: string;
}

/* --- Family Mode & Imagen E-Invites --- */
export interface FamilyVoteOption {
  id: string;
  title: string;
  description: string;
  votes: { member: string; relation: string; avatar: string; comment?: string }[];
}

export interface FamilyTopic {
  id: string;
  category: "theme" | "venue" | "menu";
  title: string;
  status: "approved" | "needs_discussion";
  options: FamilyVoteOption[];
  consensusPercent: number;
  aiCompromiseNote?: string;
}

export type InviteLanguage = "te" | "hi" | "en" | "ta" | "kn";

export interface EInviteData {
  language: InviteLanguage;
  themeStyle: "temple_gold" | "royal_peacock" | "emerald_heritage" | "pastel_minimal";
  invitationText: string;
  hostNames: string;
  muhurthamTime: string;
  venueName: string;
  blessingText: string;
}

/* --- Multimodal Inspiration --- */
export interface ExtractedInspiration {
  sourceType: "voice" | "photo";
  language?: string;
  budgetInr: number;
  guests: number;
  vibe: string;
  palette: string[];
  decorStyle: string;
  rawPrompt: string;
}

export interface Plan {
  brief: EventBrief;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  vendors: VendorCategory[];
  ideas: IdeaCard[];
  critic: CriticReport;
  health: PlanHealth;
  risks: EventRisk[];
  familyTopics: FamilyTopic[];
  eInvite: EInviteData;
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  diff?: PlanDiff;
  chips?: string[];
}

export const EVENT_LABEL: Record<EventType, string> = {
  wedding: "Wedding",
  engagement: "Engagement",
  birthday: "Birthday",
  community: "Community event",
};
