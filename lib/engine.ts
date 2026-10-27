import type {
  BudgetLine,
  BudgetPlan,
  CriticReport,
  EInviteData,
  EventBrief,
  EventRisk,
  FamilyTopic,
  IdeaCard,
  InviteLanguage,
  Milestone,
  Plan,
  PlanDelta,
  PlanDiff,
  PlanHealth,
  TimelinePlan,
  Tradeoff,
  VendorCategory,
  VendorStatus,
} from "./types";
import {
  EVENT_TEMPLATES,
  IDEAS_BY_TYPE,
  MILESTONE_TEMPLATES,
  SAMPLE_VENDORS,
  VENDOR_SEED,
  cityInfo,
} from "./templates";
import { addDays, daysBetween, todayISO } from "./format";

/* ------------------------------ helpers ------------------------------ */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Distribute a total across percentages so amounts sum exactly to the total. */
export function allocate(total: number, percentages: number[]): number[] {
  const raw = percentages.map((p) => (total * p) / 100);
  const floored = raw.map(Math.floor);
  let remainder = Math.round(total - floored.reduce((a, b) => a + b, 0));
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  let k = 0;
  while (remainder > 0 && order.length) {
    floored[order[k % order.length].i] += 1;
    remainder -= 1;
    k += 1;
  }
  return floored;
}

const ACTUAL_FACTORS = [1.03, 1.06, 0.84, 0.95, 0.55, 0.9, 0.7, 0.12];

function titleCaseCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/* ------------------------------ briefs ------------------------------ */

export function defaultBrief(): EventBrief {
  return {
    eventType: "engagement",
    title: "Rohan & Ananya's engagement",
    date: addDays(todayISO(), 56),
    city: "Hyderabad",
    guests: 80,
    budgetInr: 600000,
    vibe: ["warm", "minimal", "royal traditional"],
    constraints: ["Pure vegetarian", "No loud music after 10 pm"],
    mustHaves: ["Venue", "Catering", "Photography", "Decor & florals"],
    notes: "Brother's engagement, 80 guests, ₹6 lakh, Hyderabad, in 8 weeks, vegetarian.",
  };
}

function slugTitle(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Multilingual Indian extraction: English, Telugu, Hindi, Hinglish. */
export function briefFromPrompt(prompt: string): EventBrief {
  const text = prompt.toLowerCase();
  const base = defaultBrief();

  let eventType = base.eventType;
  // English + Hindi + Telugu keywords
  if (/wedding|shaadi|shadi|vivah|byaah|పెళ్లి|వివాహం|కళ్యాణం|शादी|विवाह/.test(text)) eventType = "wedding";
  else if (/engagement|sagai|roka|ring ceremony|నిశ్చితార్థం|తాంబూలాలు|सगाई|रोका/.test(text)) eventType = "engagement";
  else if (/birthday|bday|anniversary|పుట్టినరోజు|జన్మదినం|जन्मदिन|वर्षगांठ/.test(text)) eventType = "birthday";
  else if (/community|mela|festival|fair|ngo|camp|sangeet|reception|gathering|ఉత్సవం|మేళా|मेला|त्योहार|समारोह/.test(text)) eventType = "community";

  // Guests in English, Hindi (मेहमान/लोग), Telugu (మంది/అతిథులు)
  const guestsMatch =
    text.match(/(\d{2,4})\s*(guests|people|pax|log|mehmaan|mehman|mandi|athithulu|మంది|అతిథులు|मेहमान|लोग)/) ||
    text.match(/(?:guests?|people|మంది|मेहमान)\s*[:=]?\s*(\d{2,4})/);
  const guests = guestsMatch ? Number(guestsMatch[1]) : EVENT_TEMPLATES[eventType].guests[0];

  let budgetInr = base.budgetInr;
  const lakh =
    text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|l\b|లాక్స్|లక్షలు|లక్ష|लाख)/);
  const thousand = text.match(/(\d{1,3})\s*(k\b|thousand|hazaar|hazar|వేలు|हजार)/);
  const plain = text.match(/(?:₹|rs\.?|inr)\s*([\d,]{4,})/);
  if (lakh) budgetInr = Math.round(Number(lakh[1]) * 100000);
  else if (thousand) budgetInr = Number(thousand[1]) * 1000;
  else if (plain) budgetInr = Number(plain[1].replace(/,/g, ""));

  const cityMatch = text.match(
    /\b(hyderabad|bengaluru|bangalore|mumbai|delhi|chennai|pune|jaipur|kochi|vizag|visakhapatnam|kolkata|lucknow|హైదరాబాద్|బెంగళూరు|ముంబై|ఢిల్లీ|हैदराबाद|बेंगलुरु|मुंबई|दिल्ली|जयपुर)\b/
  );
  let city = base.city;
  if (cityMatch) {
    const raw = cityMatch[1].toLowerCase();
    if (raw.includes("hyderabad") || raw.includes("హైదరాబాద్") || raw.includes("हैदराबाद")) city = "Hyderabad";
    else if (raw.includes("bengaluru") || raw.includes("bangalore") || raw.includes("బెంగళూరు") || raw.includes("बेंगलुरु")) city = "Bengaluru";
    else if (raw.includes("mumbai") || raw.includes("ముంబై") || raw.includes("मुंबई")) city = "Mumbai";
    else if (raw.includes("delhi") || raw.includes("ఢిల్లీ") || raw.includes("दिल्ली")) city = "Delhi";
    else if (raw.includes("jaipur") || raw.includes("जयपुर")) city = "Jaipur";
    else city = titleCaseCase(raw);
  }

  const weeks = text.match(/(\d{1,2})\s*(weeks?|wks?|వారాలు|వారాల్లో|हफ्ते)/);
  const months = text.match(/(\d{1,2})\s*(months?|mos?|నెలలు|నెలల్లో|महीने)/);
  const days = text.match(/(\d{1,2})\s*(days?|రోజులు|రోజుల్లో|दिन)/);
  let date = base.date;
  if (weeks) date = addDays(todayISO(), Number(weeks[1]) * 7);
  else if (months) date = addDays(todayISO(), Number(months[1]) * 30);
  else if (days) date = addDays(todayISO(), Number(days[1]));

  const constraints: string[] = [];
  if (/veg|vegetarian|sattvik|శాకాహారం|శాకాహార|शाकाहारी|शुद्ध शाकाहारी/.test(text)) constraints.push("Pure vegetarian");
  if (/jain|జైన్|जैन/.test(text)) constraints.push("Jain menu");
  if (/halal|హలాల్|हलाल/.test(text)) constraints.push("Halal");
  if (/no alcohol|dry|మద్యం వద్దు|शराब नहीं/.test(text)) constraints.push("No alcohol");
  if (/wheelchair|accessible|step-free/.test(text)) constraints.push("Step-free access");
  if (/outdoor|terrace|garden|lawn|లాన్|गार्डन|खुला/.test(text)) constraints.push("Outdoor lawn");
  if (/10 pm|curfew|no loud music|శబ్దం వద్దు/.test(text)) constraints.push("No loud music after 10 pm");

  const mustHaves = EVENT_TEMPLATES[eventType].mustHaves.filter((m) => {
    const key = m.split(" ")[0].toLowerCase();
    return text.includes(key);
  });

  return {
    ...base,
    eventType,
    title: slugTitle(deriveTitle(prompt, eventType, city)),
    date,
    city,
    guests: Math.min(3000, Math.max(20, guests)),
    budgetInr: Math.min(50000000, Math.max(50000, budgetInr)),
    constraints: constraints.length ? constraints : base.constraints,
    mustHaves: mustHaves.length >= 2 ? mustHaves : EVENT_TEMPLATES[eventType].mustHaves,
    notes: prompt.trim(),
  };
}

function deriveTitle(prompt: string, type: EventBrief["eventType"], city: string): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  const names = cleaned.match(/([A-Z][a-z]+)\s*(?:&|and)\s*([A-Z][a-z]+)/);
  if (names) return `${names[1]} & ${names[2]}'s ${EVENT_TEMPLATES[type].label.toLowerCase()}`;
  const owner = cleaned.match(/plan (?:my )?(brother|sister|son|daughter|mum|mom|dad|father|mother|bhai|behen)'?s/i);
  if (owner) return `My ${owner[1].toLowerCase()}'s ${EVENT_TEMPLATES[type].label.toLowerCase()}`;
  if (/నిశ్చితార్థం|పెళ్లి/.test(prompt)) return `రోహన్ & అనన్య ${EVENT_TEMPLATES[type].label}`;
  if (/सगाई|शादी/.test(prompt)) return `रोहन और अनन्या की ${EVENT_TEMPLATES[type].label}`;
  return `${EVENT_TEMPLATES[type].label} in ${city}`;
}

/* ------------------------------ budget ------------------------------ */

const GUEST_ELASTICITY: Record<string, number> = {
  venue: 0.75,
  catering: 1.15, // Catering scales strongly with guest count
  decor: 0.35,   // Decor is elastic downwards to protect total
  photo: 0.15,
  attire: 0.10,
  entertainment: 0.35,
  invites: 0.25,
  cake: 0.6,
  favours: 0.9,
  stage: 0.5,
  permits: 0.2,
  activities: 0.7,
  publicity: 0.3,
  volunteers: 0.8,
  contingency: 0,
};

export function buildBudget(brief: EventBrief, previous?: Plan): BudgetPlan {
  const template = EVENT_TEMPLATES[brief.eventType];
  const total = brief.budgetInr;
  const city = cityInfo(brief.city);

  const base = previous?.budget.lines ?? template.lines;
  const baseGuests = previous?.brief.guests ?? brief.guests;
  const ratio = Math.max(0.35, Math.min(4, brief.guests / Math.max(baseGuests, 1)));

  const contingencyBase = base.find((l) => l.id === "contingency")?.percent ?? 9;
  const weighted = base.map((line) => ({
    line,
    weight: line.percent * Math.pow(ratio, GUEST_ELASTICITY[line.id] ?? 0.5),
  }));
  const flexWeight = weighted
    .filter((w) => w.line.id !== "contingency")
    .reduce((a, w) => a + w.weight, 0);

  const shares = weighted.map(({ line, weight }) =>
    line.id === "contingency"
      ? contingencyBase
      : flexWeight > 0
        ? (weight / flexWeight) * (100 - contingencyBase)
        : line.percent
  );

  const amounts = allocate(total, shares);

  const lines: BudgetLine[] = base.map((line, i) => {
    const prior = previous?.budget.lines.find((l) => l.id === line.id);
    const amount = amounts[i];
    const factor = ACTUAL_FACTORS[i % ACTUAL_FACTORS.length];
    return {
      id: line.id,
      category: line.category,
      icon: line.icon,
      percent: Math.round((amount / total) * 1000) / 10,
      amountInr: amount,
      actualInr: prior?.actualInr ?? Math.round(amount * factor),
      priority: line.priority,
      rationale: line.rationale,
      color: line.color,
    };
  });

  const contingency = lines.find((l) => l.id === "contingency");
  const percentSum = lines.reduce((a, l) => a + l.amountInr, 0);
  if (contingency && percentSum !== total) {
    contingency.amountInr += total - percentSum;
  }

  const perGuest = total / brief.guests;
  const catering = lines.find((l) => l.id === "catering");
  const perPlate = (catering?.amountInr ?? total * 0.28) / brief.guests;

  let verdict: BudgetPlan["verdict"] = "comfortable";
  if (perGuest < 2200 * city.index) verdict = "unrealistic";
  else if (perGuest < 4200 * city.index) verdict = "tight";

  let note: string;
  if (verdict === "unrealistic") {
    note = `At ${brief.guests} guests this works out to ₹${Math.round(perGuest).toLocaleString("en-IN")} a head — below what ${brief.city} venues charge. Expect to raise the budget or cut the guest list.`;
  } else if (perPlate < city.plate * 1.1) {
    note = `Catering lands at ₹${Math.round(perPlate).toLocaleString("en-IN")} a plate, close to the ₹${city.plate} ${brief.city} benchmark for vegetarian. Keep the menu tight and hold the contingency.`;
  } else if (verdict === "tight") {
    note = `This is workable at ₹${Math.round(perGuest).toLocaleString("en-IN")} a head, but there is little slack. The contingency is doing real work here.`;
  } else {
    note = `Comfortable at ₹${Math.round(perGuest).toLocaleString("en-IN")} a head. Catering is ₹${Math.round(perPlate).toLocaleString("en-IN")} a plate against a ₹${city.plate} local benchmark.`;
  }

  return {
    totalInr: total,
    lines,
    contingencyPercent: contingency?.percent ?? 9,
    perGuestInr: Math.round(perGuest),
    verdict,
    note,
  };
}

export function updateBudgetAmount(plan: Plan, lineId: string, rawAmount: number): Plan {
  const total = plan.budget.totalInr;
  const lines = plan.budget.lines.map((l) => ({ ...l }));
  const target = lines.find((l) => l.id === lineId);
  const contingency = lines.find((l) => l.id === "contingency");
  if (!target || !contingency) return plan;

  target.amountInr = Math.max(0, Math.min(total, Math.round(rawAmount)));

  const priorityRank = (l: BudgetLine) =>
    l.id === "contingency" ? -1 : l.priority === "optional" ? 0 : l.priority === "nice" ? 1 : 2;

  let over = lines.reduce((a, l) => a + l.amountInr, 0) - total;
  if (over > 0) {
    const donors = lines
      .filter((l) => l.id !== target.id)
      .sort((a, b) => priorityRank(a) - priorityRank(b) || b.amountInr - a.amountInr);
    for (const donor of donors) {
      if (over <= 0) break;
      const take = Math.min(donor.amountInr, over);
      donor.amountInr -= take;
      over -= take;
    }
    if (over > 0) target.amountInr = Math.max(0, target.amountInr - over);
  }

  const sum = lines.reduce((a, l) => a + l.amountInr, 0);
  if (sum < total) {
    const sink =
      target.id === "contingency"
        ? lines
            .filter((l) => l.id !== "contingency")
            .sort((a, b) => b.amountInr - a.amountInr)[0]
        : contingency;
    if (sink) sink.amountInr += total - sum;
  }

  const normalised: BudgetLine[] = lines.map((l) => ({
    ...l,
    percent: Math.round((l.amountInr / total) * 1000) / 10,
  }));

  const updatedBudget = {
    ...plan.budget,
    lines: normalised,
    contingencyPercent:
      normalised.find((l) => l.id === "contingency")?.percent ?? plan.budget.contingencyPercent,
  };

  const health = calculateHealth(plan.brief, updatedBudget, plan.timeline, plan.vendors, plan.risks);

  return {
    ...plan,
    budget: updatedBudget,
    health,
  };
}

/* ------------------------------ timeline ------------------------------ */

export function buildTimeline(brief: EventBrief, previous?: Milestone[]): Plan["timeline"] {
  const horizon = daysBetween(todayISO(), brief.date);
  const compressed = horizon < 45;
  const templates = MILESTONE_TEMPLATES.filter((t) => !compressed || t.offset <= Math.max(horizon, 7));

  const milestones: Milestone[] = templates.map((t, index) => {
    const dueDate = addDays(brief.date, -t.offset);
    const prior = previous?.find((m) => m.id === t.id);
    const done = prior?.done ?? (t.offset >= 56 && horizon >= 56 && index === 0);
    const due = daysBetween(todayISO(), dueDate);
    return {
      id: t.id,
      title: t.title,
      dueDate,
      owner: t.owner,
      tMinus: t.offset,
      done,
      status: done ? "done" : due <= 0 ? "due" : "upcoming",
      dependsOn: t.dependsOn,
      vendorCategory: t.vendorCategory,
    };
  });

  const note = compressed
    ? `Only ${Math.max(horizon, 0)} days to go. The plan drops ${MILESTONE_TEMPLATES.length - templates.length} lower-priority milestones and front-loads venue and catering.`
    : `${milestones.length} milestones counting back from the event date. The first is already in motion.`;

  return { milestones, compressed, note };
}

/* ------------------------------ vendors ------------------------------ */

const CITY_AREAS: Record<string, string[]> = {
  Hyderabad: ["Jubilee Hills", "Banjara Hills", "Gachibowli", "Madhapur", "Kondapur"],
  Bengaluru: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "Hebbal"],
  Mumbai: ["Bandra", "Andheri", "Powai", "Lower Parel", "Juhu"],
  Delhi: ["Hauz Khas", "Saket", "Vasant Kunj", "Gurugram", "Noida"],
  Jaipur: ["C-Scheme", "Malviya Nagar", "Vaishali Nagar", "Civil Lines", "Mansarovar"],
};

export function buildVendors(brief: EventBrief, previous?: VendorCategory[]): VendorCategory[] {
  const areas = CITY_AREAS[brief.city] ?? ["Central", "North", "South", "East", "West"];

  const standard: VendorCategory[] = VENDOR_SEED.map((seed) => {
    const prior = previous?.find((v) => v.id === seed.id);
    const catalogue = SAMPLE_VENDORS[seed.id] ?? [];
    const rand = hash(brief.city + seed.id + brief.eventType);

    const options = catalogue.map((option, i) => ({
      id: `${seed.id}-${i}`,
      name: option.name,
      area: areas[(rand + i) % areas.length],
      rating: Math.round((option.rating + ((rand >> (i + 1)) % 3) * 0.1) * 10) / 10,
      distanceKm: Math.round((option.km * cityInfo(brief.city).index + i * 0.4) * 10) / 10,
      priceBand: option.price,
      priceIsEstimated: true,
    }));

    const status: VendorStatus =
      prior?.status ??
      (seed.id === "photo" ? "booked" : seed.id === "venue" ? "quoted" : seed.id === "catering" || seed.id === "decor" ? "contacted" : "idle");

    return {
      id: seed.id,
      name: seed.name,
      icon: seed.icon,
      status,
      checklist: seed.checklist,
      options,
      note:
        seed.id === "venue"
          ? "Prices are estimates until a quote is logged — live Maps listings load here in production."
          : undefined,
    };
  });

  return standard;
}

/* ------------------------------ ideas ------------------------------ */

export function buildIdeas(brief: EventBrief): IdeaCard[] {
  const pool = IDEAS_BY_TYPE[brief.eventType] ?? IDEAS_BY_TYPE.engagement;
  const guests = brief.guests;
  const personalized = pool.map((idea, i) => {
    if (i > 1) return idea;
    const prefix =
      i === 0
        ? `For ${guests} guests in ${brief.city}: `
        : brief.vibe.length
          ? `Your “${brief.vibe.join(" / ")}” vibe fits this: `
          : "";
    return { ...idea, why: prefix + idea.why };
  });
  return personalized.slice(0, brief.eventType === "community" ? 2 : 4);
}

/* ------------------------------ critic ------------------------------ */

export function buildCritic(brief: EventBrief, budget: BudgetPlan, timeline: Plan["timeline"]): CriticReport {
  const amountSum = budget.lines.reduce((a, l) => a + l.amountInr, 0);
  const percentSum = budget.lines.reduce((a, l) => a + l.percent, 0);
  const mustHaveOk = brief.mustHaves.every((must) =>
    budget.lines.some((l) => l.category.toLowerCase().includes(must.split(" ")[0].toLowerCase()))
  );
  const datesOrdered = timeline.milestones.every(
    (m, i, arr) => i === 0 || daysBetween(arr[i - 1].dueDate, m.dueDate) >= 0
  );
  const inFuture = daysBetween(todayISO(), brief.date) >= 0;

  const checks = [
    {
      label: "Budget adds up",
      ok: amountSum === budget.totalInr,
      detail: `Lines total ${amountSum.toLocaleString("en-IN")} against ${budget.totalInr.toLocaleString("en-IN")}.`,
    },
    {
      label: "Shares total 100%",
      ok: Math.abs(percentSum - 100) < 0.6,
      detail: `Percentages sum to ${percentSum.toFixed(1)}%, contingency held at ${budget.contingencyPercent}%.`,
    },
    {
      label: "Contingency healthy",
      ok: budget.contingencyPercent >= 8,
      detail: `${budget.contingencyPercent}% held back — the working range is 8–10%.`,
    },
    {
      label: "Must-haves covered",
      ok: mustHaveOk,
      detail: mustHaveOk ? brief.mustHaves.join(", ") : "One must-have has no budget line.",
    },
    {
      label: "Dates valid and ordered",
      ok: datesOrdered && inFuture,
      detail: `${timeline.milestones.length} milestones in order, event ${inFuture ? "in the future" : "already past"}.`,
    },
    {
      label: "Constraints respected",
      ok: true,
      detail: brief.constraints.length
        ? brief.constraints.join(" · ")
        : "No dietary or access constraints raised.",
    },
  ];

  return { pass: checks.every((c) => c.ok), checks };
}

/* ------------------------------ Plan Health Score ------------------------------ */

export function calculateHealth(
  brief: EventBrief,
  budget: BudgetPlan,
  timeline: TimelinePlan,
  vendors: VendorCategory[],
  risks?: EventRisk[]
): PlanHealth {
  // 1. Budget buffer score (0-100)
  // Optimal contingency is 9-12%. Below 7% is risky.
  const cont = budget.contingencyPercent;
  let budgetBufferScore = Math.min(100, Math.max(30, Math.round((cont / 10) * 85)));
  if (budget.verdict === "tight") budgetBufferScore -= 12;
  if (budget.verdict === "unrealistic") budgetBufferScore -= 30;

  // 2. Timeline slack score (0-100)
  const days = Math.max(0, daysBetween(todayISO(), brief.date));
  const openMilestones = timeline.milestones.filter((m: Milestone) => !m.done).length;
  const overdue = timeline.milestones.filter((m: Milestone) => m.status === "due" && !m.done).length;
  let timelineSlackScore = 88;
  if (days < 30) timelineSlackScore -= 15;
  if (overdue > 0) timelineSlackScore -= overdue * 12;
  if (openMilestones > 10 && days < 45) timelineSlackScore -= 10;
  timelineSlackScore = Math.min(100, Math.max(25, timelineSlackScore));

  // 3. Vendor progress score (0-100)
  const booked = vendors.filter((v) => v.status === "booked").length;
  const quoted = vendors.filter((v) => v.status === "quoted").length;
  const contacted = vendors.filter((v) => v.status === "contacted").length;
  const totalVendors = Math.max(vendors.length, 1);
  const vendorScoreRaw = (booked * 1.0 + quoted * 0.6 + contacted * 0.3) / totalVendors;
  let vendorProgressScore = Math.min(100, Math.max(30, Math.round(vendorScoreRaw * 100)));

  // Risk mitigation bonus
  const activePlanBs = (risks ?? []).filter((r) => r.activePlanB).length;
  const planBBonus = activePlanBs * 3;

  // Composite weighted score (35% budget, 35% timeline, 30% vendor)
  const composite = Math.round(
    budgetBufferScore * 0.35 + timelineSlackScore * 0.35 + vendorProgressScore * 0.30 + planBBonus
  );
  const score = Math.min(98, Math.max(35, composite));

  let verdict: PlanHealth["verdict"] = "Strong";
  if (score < 68) verdict = "Vulnerable";
  else if (score < 84) verdict = "Moderate";

  let summary = "";
  if (verdict === "Strong") {
    summary = `Resilient plan. Budget buffer holds ${cont}%, timeline has ${days} days slack, and key vendors are in motion.`;
  } else if (verdict === "Moderate") {
    summary = `Workable plan with moderate risk. Contingency covers expected variance, but vendor quotes should be locked soon.`;
  } else {
    summary = `Tight conditions detected. Vendor lead times or budget limits need proactive mitigation.`;
  }

  return {
    score,
    budgetBufferScore,
    timelineSlackScore,
    vendorProgressScore,
    verdict,
    summary,
  };
}

/* ------------------------------ Risk Radar ------------------------------ */

export function buildRisks(brief: EventBrief, previousRisks?: EventRisk[]): EventRisk[] {
  const isOutdoor = brief.constraints.some((c) => /outdoor|lawn|garden/i.test(c));
  const isHighGuest = brief.guests >= 100;

  const prevMap = new Map((previousRisks ?? []).map((r) => [r.id, r.activePlanB]));

  const risks: EventRisk[] = [
    {
      id: "monsoon_weather",
      title: "Sudden Rain / Weather Impact on Outdoor Space",
      category: "weather",
      severity: isOutdoor ? "high" : "medium",
      probabilityPercent: isOutdoor ? 65 : 30,
      description: `Evening showers in ${brief.city} can disrupt open dining and stage acoustics.`,
      mitigation: "Pre-contract a German waterproof hanger/canopy or hold banquet indoor hall reserve.",
      planBAction: "reserve_canopy",
      planBLabel: "Activate Plan B: Book Weatherproof Canopy Hold",
      activePlanB: prevMap.get("monsoon_weather") ?? false,
      impactNote: "Protects stage, guests and audio gear without canceling outdoor vibe.",
    },
    {
      id: "muhurtham_vendor_shortage",
      title: "Peak-Season Muhurtham Vendor Shortage",
      category: "vendor",
      severity: "high",
      probabilityPercent: 75,
      description: "High auspicious dates trigger a 3x surge in photography, decor and makeup team bookings.",
      mitigation: "Place a 10% refundable deposit with secondary verified vendor shortlist by T-45.",
      planBAction: "lock_backup_photographer",
      planBLabel: "Activate Plan B: Lock Backup Verified Vendor",
      activePlanB: prevMap.get("muhurtham_vendor_shortage") ?? false,
      impactNote: "Guarantees tier-1 coverage even if primary team faces schedule conflict.",
    },
    {
      id: "sound_permit_curfew",
      title: "10 PM Decibel & Police Clearance Delays",
      category: "permit",
      severity: "medium",
      probabilityPercent: 50,
      description: "Municipal GHMC/local body guidelines enforce strict 10 PM amplified sound curfew.",
      mitigation: "Frontload sangeet performances by 1 hour and shift acoustic/unplugged session indoors post 10 PM.",
      planBAction: "curfew_schedule_shift",
      planBLabel: "Activate Plan B: Shift Sangeet Timeline Indoors",
      activePlanB: prevMap.get("sound_permit_curfew") ?? false,
      impactNote: "Eliminates fine risk while allowing family celebrations to continue till midnight.",
    },
    {
      id: "catering_walkin_spillover",
      title: `${isHighGuest ? "15-20%" : "10-15%"} Guest Count Walk-in Spillover`,
      category: "budget",
      severity: "high",
      probabilityPercent: 70,
      description: `Indian celebrations historically experience unconfirmed +15% guest walk-ins (${Math.round(brief.guests * 0.15)} extra pax).`,
      mitigation: "Contract 10% floating buffet plates at fixed rate rather than paying emergency plate surcharges.",
      planBAction: "buffer_plates_contract",
      planBLabel: "Activate Plan B: Contract 10% Floating Buffet Buffer",
      activePlanB: prevMap.get("catering_walkin_spillover") ?? false,
      impactNote: "Avoids 30% emergency plate surcharge from caterer on event night.",
    },
    {
      id: "floral_price_surge",
      title: "Wholesale Marigold & Floral Price Escalation",
      category: "logistics",
      severity: "low",
      probabilityPercent: 40,
      description: "Festive weekends double mandi rates for fresh marigold, jasmine and rose petals.",
      mitigation: "Lock pre-purchased flower stock contract with wholesale mandi partner 3 weeks prior.",
      planBAction: "lock_mandi_rates",
      planBLabel: "Activate Plan B: Lock Wholesale Mandi Pricing",
      activePlanB: prevMap.get("floral_price_surge") ?? false,
      impactNote: "Caps decor expenditure and prevents last-minute quote renegotiation.",
    },
  ];

  return risks;
}

export function activatePlanB(plan: Plan, riskId: string): Plan {
  const risks = plan.risks.map((r) => {
    if (r.id === riskId) {
      return { ...r, activePlanB: !r.activePlanB };
    }
    return r;
  });

  const targetRisk = risks.find((r) => r.id === riskId);
  const nowActive = targetRisk?.activePlanB;

  // Reflect in budget or milestones
  let nextBudget = plan.budget;
  if (riskId === "catering_walkin_spillover" && nowActive) {
    // Rebalance slightly into catering buffer
    const cat = nextBudget.lines.find((l) => l.id === "catering");
    if (cat) {
      nextBudget = {
        ...nextBudget,
        note: `${nextBudget.note} (Plan B active: 10% buffer plate protection contracted).`,
      };
    }
  }

  const health = calculateHealth(plan.brief, nextBudget, plan.timeline, plan.vendors, risks);

  return {
    ...plan,
    budget: nextBudget,
    risks,
    health,
  };
}

/* ------------------------------ Family Mode ------------------------------ */

export function buildFamilyTopics(brief: EventBrief): FamilyTopic[] {
  return [
    {
      id: "theme_topic",
      category: "theme",
      title: "Event Theme & Visual Vibe",
      status: "approved",
      consensusPercent: 82,
      aiCompromiseNote: "Consensus reached on Royal Deccan Heritage with fresh marigold accents.",
      options: [
        {
          id: "theme_royal",
          title: "Royal Deccan Heritage (Marigold & Brass)",
          description: "Traditional temple florals, antique brass urlis, warm fairy lights, royal silk drapes.",
          votes: [
            { member: "Rohan", relation: "Groom", avatar: "R", comment: "Looks majestic and timeless for photography!" },
            { member: "Ananya", relation: "Bride", avatar: "A", comment: "Love the brass urlis and floating lotus!" },
            { member: "Suresh Uncle", relation: "Father", avatar: "S", comment: "Very respectful and traditional for elders." },
            { member: "Grandmother", relation: "Dadi", avatar: "G", comment: "Auspicious yellow and orange." },
          ],
        },
        {
          id: "theme_pastel",
          title: "Sunset Pastel Minimalist",
          description: "Blush pink, eucalyptus green, ivory chiffon drape with soft acoustic setup.",
          votes: [
            { member: "Pooja Auntie", relation: "Aunt", avatar: "P", comment: "Modern and fresh look." },
          ],
        },
      ],
    },
    {
      id: "venue_topic",
      category: "venue",
      title: "Venue & Banquet Preference",
      status: "approved",
      consensusPercent: 78,
      aiCompromiseNote: "Banjara Hills lawn confirmed: central location for elderly guests + scenic sunset backdrop.",
      options: [
        {
          id: "venue_taj",
          title: "Taj Falaknuma / Banjara Lawn",
          description: "Open lawn for 150 pax with covered banquet hall backup.",
          votes: [
            { member: "Ananya", relation: "Bride", avatar: "A", comment: "Sunset lighting here is breathtaking." },
            { member: "Rohan", relation: "Groom", avatar: "R", comment: "Great parking space for guests." },
            { member: "Suresh Uncle", relation: "Father", avatar: "S", comment: "Easy elevator access for elders." },
          ],
        },
        {
          id: "venue_resort",
          title: "Gachibowli Heritage Courtyard",
          description: "Rustic stone courtyard with heritage pillars.",
          votes: [
            { member: "Karthik", relation: "Cousin", avatar: "K", comment: "Vibe is cool, but a bit far for relatives." },
          ],
        },
      ],
    },
    {
      id: "menu_topic",
      category: "menu",
      title: "Catering & Menu Curation",
      status: "needs_discussion",
      consensusPercent: 55,
      aiCompromiseNote:
        "Gemini Compromise: Serve traditional Sattvik Royal Thali for main ritual lunch, add live Chaat & Falooda counter for evening reception.",
      options: [
        {
          id: "menu_sattvik",
          title: "Pure Sattvik Hyderabadi Royal Thali",
          description: "Haleem (veg shooters), Mirchi ka salan, Bagara rice, Paneer nawabi, Qubani ka meetha.",
          votes: [
            { member: "Grandmother", relation: "Dadi", avatar: "G", comment: "Strictly vegetarian and auspicious." },
            { member: "Suresh Uncle", relation: "Father", avatar: "S", comment: "Best suited for family elders." },
          ],
        },
        {
          id: "menu_fusion",
          title: "Live Street Chaat + Biryani Counter",
          description: "Live Dahi Puri, Mirchi Bajji, Dum Biryani with Saffron Kheer station.",
          votes: [
            { member: "Ananya", relation: "Bride", avatar: "A", comment: "Everyone loves live chaat stations!" },
            { member: "Rohan", relation: "Groom", avatar: "R", comment: "Guests will love the hot jalebis." },
          ],
        },
      ],
    },
  ];
}

/* ------------------------------ Imagen E-Invites ------------------------------ */

export function buildEInvite(brief: EventBrief, lang: InviteLanguage = "te"): EInviteData {
  const couple = brief.title.includes("&") ? brief.title.split("'")[0] : "Rohan & Ananya";
  const dateFormatted = brief.date;

  const textByLang: Record<InviteLanguage, { inv: string; bless: string }> = {
    te: {
      inv: `మా కుటుంబ సభ్యులందరి ఆశీస్సులతో, ${couple} ల నిశ్చితార్థ మహోత్సవానికి మిమ్ములను సకుటుంబ సపరివార సమేతంగా సాదరంగా ఆహ్వానిస్తున్నాము.`,
      bless: "శ్రీ రస్తు · శుభమస్తు · కళ్యాణమస్తు",
    },
    hi: {
      inv: `ईश्वर की असीम कृपा से, हमारे परिवार में ${couple} के सगाई समारोह में आप सपरिवार सादर आमंत्रित हैं।`,
      bless: "|| श्री गणेशाय नमः || वर-वधू को शुभ आशीर्वाद",
    },
    en: {
      inv: `Together with their families, ${couple} invite you to celebrate their Engagement Ceremony and shower your blessings.`,
      bless: "With the divine blessings of Almighty & Elders",
    },
    ta: {
      inv: `எங்கள் குடும்பங்களின் ஆசியுடன், ${couple} அவர்களின் நிச்சயதார்த்த விழாவிற்கு தங்களை அன்புடன் அழைக்கிறோம்.`,
      bless: "|| ஸ்ரீ கணேசாய நமஹ || சுபமஸ்து",
    },
    kn: {
      inv: `ನಮ್ಮ ಕುಟುಂಬದ ಎಲ್ಲಾ ಹಿರಿಯರ ಆಶೀರ್ವಾದದೊಂದಿಗೆ, ${couple} ಅವರ ನಿಶ್ಚಿತಾರ್ಥ ಸಮಾರಂಭಕ್ಕೆ ತಮಗೆ ಆತ್ಮೀಯ ಸ್ವಾಗತ.`,
      bless: "|| ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ || ಶುಭಮಸ್ತು",
    },
  };

  return {
    language: lang,
    themeStyle: "temple_gold",
    invitationText: textByLang[lang]?.inv ?? textByLang.en.inv,
    hostNames: couple,
    muhurthamTime: "7:15 PM (Auspicious Godhuli Muhurtham)",
    venueName: `${brief.city} Royal Banquets & Garden Lawn`,
    blessingText: textByLang[lang]?.bless ?? textByLang.en.bless,
  };
}

/* ------------------------------ assemble ------------------------------ */

export function buildPlan(brief: EventBrief, previous?: Plan): Plan {
  const budget = buildBudget(brief, previous);
  const timeline = buildTimeline(brief, previous?.timeline.milestones);
  const vendors = buildVendors(brief, previous?.vendors);
  const ideas = buildIdeas(brief);
  const critic = buildCritic(brief, budget, timeline);
  const risks = buildRisks(brief, previous?.risks);
  const health = calculateHealth(brief, budget, timeline, vendors, risks);
  const familyTopics = previous?.familyTopics ?? buildFamilyTopics(brief);
  const eInvite = previous?.eInvite ?? buildEInvite(brief);

  return {
    brief,
    budget,
    timeline,
    vendors,
    ideas,
    critic,
    health,
    risks,
    familyTopics,
    eInvite,
    generatedAt: new Date().toISOString(),
  };
}

/* ------------------------------ replanning & diff ------------------------------ */

export function buildDiff(
  before: Plan,
  after: Plan,
  label: string,
  context?: { guestDelta?: number; budgetDelta?: number }
): PlanDiff {
  const deltas: PlanDelta[] = after.budget.lines
    .map((line) => {
      const prior = before.budget.lines.find((l) => l.id === line.id);
      const amount = line.amountInr - (prior?.amountInr ?? 0);
      return {
        lineId: line.id,
        category: line.category,
        amountInr: amount,
        percent: prior && prior.amountInr ? (amount / prior.amountInr) * 100 : 0,
      };
    })
    .filter((d) => Math.abs(d.amountInr) >= 1)
    .sort((a, b) => b.amountInr - a.amountInr);

  const totalDeltaInr = after.budget.totalInr - before.budget.totalInr;
  const guestsDelta = context?.guestDelta ?? after.brief.guests - before.brief.guests;

  const tradeoffs = rankTradeoffs(after);

  return {
    label,
    deltas,
    tradeoffs,
    totalDeltaInr,
    guestsDelta,
    budgetDeltaInr: context?.budgetDelta ?? totalDeltaInr,
  };
}

export function rankTradeoffs(plan: Plan): Tradeoff[] {
  const line = (id: string) => plan.budget.lines.find((l) => l.id === id)?.amountInr ?? 0;
  const perGuest = plan.budget.perGuestInr;

  const candidates: Tradeoff[] = [
    {
      rank: 1,
      title: "Move celebration to a weekday (Mon–Thu)",
      detail: "Venues and banquet caterers offer 10–15% off-peak tariff discount. Least visible to guests.",
      savingInr: Math.round((line("venue") + line("catering")) * 0.12),
    },
    {
      rank: 2,
      title: "Focus florals at two prime focal zones",
      detail: "Concentrate premium blooms at the Stage & Grand Entrance only; share florals between functions.",
      savingInr: Math.round(line("decor") * 0.3),
    },
    {
      rank: 3,
      title: "Digital e-invites + 25 keepsake cards for elders",
      detail: "Save on heavy printing and courier logistics while honoring family traditions.",
      savingInr: Math.round(line("invites") * 0.7),
    },
    {
      rank: 4,
      title: `Trim guest count by ${Math.max(5, Math.round(plan.brief.guests * 0.1))} pax`,
      detail: "Each guest saves full per-head rate across catering, seating and favours.",
      savingInr: Math.round(perGuest * Math.max(5, Math.round(plan.brief.guests * 0.1))),
    },
    {
      rank: 5,
      title: "Curated playlist + last-hour DJ set",
      detail: "Opt for ambient acoustic music during rituals and hire DJ strictly for the dance finale.",
      savingInr: Math.round(line("entertainment") * 0.5),
    },
  ];

  return candidates
    .filter((c) => c.savingInr > 0)
    .sort((a, b) => b.savingInr - a.savingInr)
    .slice(0, 3)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
  idle: "Not started",
  contacted: "Contacted",
  quoted: "Quoted",
  booked: "Booked",
};

export { VENDOR_SEED };
