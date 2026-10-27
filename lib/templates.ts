import type { EventType, IdeaCard, Priority, VendorStatus } from "./types";

export interface TemplateLine {
  id: string;
  category: string;
  icon: string;
  percent: number;
  priority: Priority;
  rationale: string;
  color: string;
}

export interface EventTemplate {
  label: string;
  icon: string;
  blurb: string;
  lines: TemplateLine[];
  mustHaves: string[];
  vibes: string[];
  guests: [number, number];
  dateWindow: string;
}

const M = "must" as Priority;
const N = "nice" as Priority;
const O = "optional" as Priority;

export const EVENT_TEMPLATES: Record<EventType, EventTemplate> = {
  engagement: {
    label: "Engagement",
    icon: "diamond",
    blurb: "One evening, two families, a lot of photos.",
    mustHaves: ["Venue", "Catering", "Photography", "Decor & florals"],
    vibes: ["warm", "minimal", "traditional", "garden"],
    guests: [80, 500],
    dateWindow: "6–12 weeks",
    lines: [
      { id: "venue", category: "Venue & banquet", icon: "apartment", percent: 24, priority: M, rationale: "8-week lead time means weekday dates are negotiable.", color: "#1a73e8" },
      { id: "catering", category: "Catering & beverages", icon: "restaurant", percent: 29, priority: M, rationale: "The largest line for Indian events, driven by guest count.", color: "#ea4335" },
      { id: "decor", category: "Decor & florals", icon: "local_florist", percent: 12, priority: N, rationale: "Two focal zones (stage + entrance) keep this lean.", color: "#fbbc04" },
      { id: "photo", category: "Photography & film", icon: "photo_camera", percent: 10, priority: M, rationale: "Half-day coverage covers ritual and portraits.", color: "#34a853" },
      { id: "attire", category: "Attire & styling", icon: "checkroom", percent: 7, priority: M, rationale: "One outfit each, plus hair and makeup.", color: "#9b72cb" },
      { id: "entertainment", category: "Music & entertainment", icon: "music_note", percent: 5, priority: N, rationale: "A three-piece live set costs less than a headline DJ.", color: "#12b5cb" },
      { id: "invites", category: "Invitations & gifting", icon: "mail", percent: 4, priority: O, rationale: "Digital invites for most, printed for elders.", color: "#f29900" },
      { id: "contingency", category: "Contingency", icon: "savings", percent: 9, priority: N, rationale: "Held back until vendor quotes are final.", color: "#80868b" },
    ],
  },
  wedding: {
    label: "Wedding",
    icon: "celebration",
    blurb: "Multi-day functions with distinct budgets.",
    mustHaves: ["Venue", "Catering", "Photography", "Decor & florals"],
    vibes: ["traditional", "royal", "garden", "minimal"],
    guests: [150, 800],
    dateWindow: "5–10 months",
    lines: [
      { id: "venue", category: "Venue & banquet", icon: "apartment", percent: 21, priority: M, rationale: "Three functions, one venue contract to simplify deposits.", color: "#1a73e8" },
      { id: "catering", category: "Catering & beverages", icon: "restaurant", percent: 27, priority: M, rationale: "Covers mehendi, sangeet, wedding and reception meals.", color: "#ea4335" },
      { id: "decor", category: "Decor & florals", icon: "local_florist", percent: 13, priority: N, rationale: "Shared floral between mehendi and haldi saves reuse cost.", color: "#fbbc04" },
      { id: "photo", category: "Photography & film", icon: "photo_camera", percent: 10, priority: M, rationale: "Two-day coverage plus a short film.", color: "#34a853" },
      { id: "attire", category: "Attire & styling", icon: "checkroom", percent: 9, priority: M, rationale: "Function-wise outfits with shared jewellery.", color: "#9b72cb" },
      { id: "entertainment", category: "Music & entertainment", icon: "music_note", percent: 7, priority: N, rationale: "Sangeet choreography and sound system.", color: "#12b5cb" },
      { id: "invites", category: "Invitations & gifts", icon: "redeem", percent: 4, priority: O, rationale: "Invite suite plus return gifts per household.", color: "#f29900" },
      { id: "contingency", category: "Contingency", icon: "savings", percent: 9, priority: N, rationale: "Guards against guest-count overruns.", color: "#80868b" },
    ],
  },
  birthday: {
    label: "Birthday",
    icon: "cake",
    blurb: "One afternoon that has to feel effortless.",
    mustHaves: ["Venue", "Catering", "Cake & desserts"],
    vibes: ["playful", "soft", "retro", "adventure"],
    guests: [30, 200],
    dateWindow: "2–8 weeks",
    lines: [
      { id: "venue", category: "Venue & play area", icon: "cottage", percent: 22, priority: M, rationale: "Two-hour slot keeps the venue fee low.", color: "#1a73e8" },
      { id: "catering", category: "Food & beverages", icon: "restaurant", percent: 26, priority: M, rationale: "Grazing menu suits mixed ages and picky eaters.", color: "#ea4335" },
      { id: "decor", category: "Theme & decor", icon: "celebration", percent: 14, priority: N, rationale: "Balloon arch, backdrop and table styling only.", color: "#fbbc04" },
      { id: "cake", category: "Cake & desserts", icon: "cake", percent: 8, priority: M, rationale: "One showpiece cake plus a dessert station.", color: "#34a853" },
      { id: "entertainment", category: "Entertainment", icon: "toys", percent: 10, priority: N, rationale: "Host-led games beat hired performers at this size.", color: "#9b72cb" },
      { id: "photo", category: "Photography", icon: "photo_camera", percent: 6, priority: N, rationale: "Two-hour candid coverage.", color: "#12b5cb" },
      { id: "favours", category: "Return favours", icon: "redeem", percent: 5, priority: O, rationale: "One useful takeaway per child.", color: "#f29900" },
      { id: "contingency", category: "Contingency", icon: "savings", percent: 9, priority: N, rationale: "Covers the last-minute add-ons.", color: "#80868b" },
    ],
  },
  community: {
    label: "Community event",
    icon: "groups",
    blurb: "Permits, volunteers and crowd planning.",
    mustHaves: ["Permits & safety", "Volunteers & logistics", "Staging & sound"],
    vibes: ["inclusive", "family", "cultural", "outdoor"],
    guests: [100, 2000],
    dateWindow: "4–10 weeks",
    lines: [
      { id: "venue", category: "Grounds & marquee", icon: "park", percent: 17, priority: M, rationale: "Open grounds with a rented marquee.", color: "#1a73e8" },
      { id: "catering", category: "Food & water", icon: "restaurant", percent: 23, priority: M, rationale: "Community kitchen at scale, plus water stations.", color: "#ea4335" },
      { id: "stage", category: "Staging & sound", icon: "campaign", percent: 14, priority: M, rationale: "Stage, backdrop, PA and two wireless mics.", color: "#fbbc04" },
      { id: "permits", category: "Permits & safety", icon: "verified_user", percent: 10, priority: M, rationale: "Licences, barricades, first aid and security.", color: "#34a853" },
      { id: "activities", category: "Activities & workshops", icon: "palette", percent: 10, priority: N, rationale: "Three parallel activity tents for age groups.", color: "#9b72cb" },
      { id: "publicity", category: "Publicity & printing", icon: "campaign", percent: 8, priority: N, rationale: "Posters, WhatsApp kit and a simple landing page.", color: "#12b5cb" },
      { id: "volunteers", category: "Volunteers & logistics", icon: "groups", percent: 9, priority: M, rationale: "Rosters, T-shirts and on-ground coordination.", color: "#f29900" },
      { id: "contingency", category: "Contingency", icon: "savings", percent: 9, priority: N, rationale: "Weather covers and crowd overflow are the usual surprises.", color: "#80868b" },
    ],
  },
};

export const CITIES: { name: string; index: number; lat: number; lng: number; plate: number }[] = [
  { name: "Hyderabad", index: 1, lat: 17.4126, lng: 78.4392, plate: 950 },
  { name: "Bengaluru", index: 1.15, lat: 12.9716, lng: 77.5946, plate: 1100 },
  { name: "Mumbai", index: 1.28, lat: 19.076, lng: 72.8777, plate: 1350 },
  { name: "Delhi", index: 1.18, lat: 28.6139, lng: 77.209, plate: 1250 },
  { name: "Chennai", index: 1.06, lat: 13.0827, lng: 80.2707, plate: 1000 },
  { name: "Pune", index: 1.05, lat: 18.5204, lng: 73.8567, plate: 1000 },
  { name: "Jaipur", index: 0.92, lat: 26.9124, lng: 75.7873, plate: 850 },
  { name: "Kochi", index: 0.95, lat: 9.9312, lng: 76.2673, plate: 900 },
];

export function cityInfo(name: string) {
  const match = CITIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  return match ?? { name: name || "Hyderabad", index: 1, lat: 17.4126, lng: 78.4392, plate: 950 };
}

export interface MilestoneTemplate {
  id: string;
  title: string;
  offset: number;
  owner: string;
  dependsOn: string[];
  vendorCategory?: string;
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  { id: "guestlist", title: "Lock guest list & budget", offset: 56, owner: "You", dependsOn: [] },
  { id: "shortlist", title: "Shortlist 3 venues", offset: 49, owner: "You", dependsOn: ["guestlist"], vendorCategory: "venue" },
  { id: "bookvenue", title: "Book venue & pay deposit", offset: 42, owner: "You", dependsOn: ["shortlist"], vendorCategory: "venue" },
  { id: "savedate", title: "Send save-the-dates", offset: 35, owner: "You", dependsOn: ["bookvenue"], vendorCategory: "invites" },
  { id: "caterer", title: "Finalise caterer & tasting", offset: 30, owner: "Family", dependsOn: ["bookvenue"], vendorCategory: "catering" },
  { id: "photographer", title: "Book photographer", offset: 24, owner: "You", dependsOn: ["bookvenue"], vendorCategory: "photo" },
  { id: "decor", title: "Decor & floral walkthrough", offset: 21, owner: "Decorator", dependsOn: ["bookvenue"], vendorCategory: "decor" },
  { id: "invites", title: "Send invitations", offset: 14, owner: "You", dependsOn: ["guestlist"], vendorCategory: "invites" },
  { id: "attire", title: "Attire final fitting", offset: 10, owner: "You", dependsOn: [] },
  { id: "seating", title: "Seating plan & run-of-show", offset: 7, owner: "Family", dependsOn: ["guestlist"] },
  { id: "headcount", title: "Headcount to caterer", offset: 3, owner: "You", dependsOn: ["caterer"], vendorCategory: "catering" },
  { id: "event", title: "Event day", offset: 0, owner: "Everyone", dependsOn: ["headcount"] },
];

export const VENDOR_SEED: {
  id: string;
  name: string;
  icon: string;
  status: VendorStatus;
  checklist: string[];
}[] = [
  { id: "venue", name: "Venue", icon: "apartment", status: "quoted", checklist: ["Seating capacity", "In-house catering policy", "Parking & valet", "Power backup", "Cancellation terms"] },
  { id: "catering", name: "Caterer", icon: "restaurant", status: "contacted", checklist: ["Veg / non-veg split", "Per-plate minimum", "Tasting date", "Service staff count", "Licence & FSSAI"] },
  { id: "decor", name: "Decor & florals", icon: "local_florist", status: "contacted", checklist: ["Stage reference", "Entrance arch", "Focal flowers in season", "Setup & teardown windows"] },
  { id: "photo", name: "Photographer", icon: "photo_camera", status: "booked", checklist: ["Hours of coverage", "Second shooter", "Deliverable timeline", "Raw files policy"] },
  { id: "music", name: "Music & DJ", icon: "music_note", status: "idle", checklist: ["Sound system size", "Set length", "Song request policy", "Backup power"] },
  { id: "attire", name: "Attire & styling", icon: "checkroom", status: "idle", checklist: ["Alteration window", "Hair & makeup trial", "Jewellery rental"] },
  { id: "invites", name: "Invitations", icon: "mail", status: "idle", checklist: ["Print run", "Digital RSVP", "Delivery dates", "Language variants"] },
  { id: "transport", name: "Transport", icon: "directions_car", status: "idle", checklist: ["Guest pickups", "Valet count", "Late-night drop"] },
];

export const SAMPLE_VENDORS: Record<string, { name: string; area: string; rating: number; km: number; price: string }[]> = {
  venue: [
    { name: "Noor Banquet Hall", area: "Jubilee Hills", rating: 4.6, km: 3.2, price: "₹1,100–1,600 / plate" },
    { name: "Casa Verde Lawns", area: "Gachibowli", rating: 4.4, km: 7.8, price: "₹950–1,300 / plate" },
    { name: "The Terrace House", area: "Banjara Hills", rating: 4.3, km: 5.1, price: "₹1,300–1,800 / plate" },
  ],
  catering: [
    { name: "Saffron Kitchen Co.", area: "Madhapur", rating: 4.7, km: 4.4, price: "₹780 / plate (veg)" },
    { name: "Annapurna Caterers", area: "Kukatpally", rating: 4.5, km: 9.2, price: "₹640 / plate (veg)" },
    { name: "The Tasting Room", area: "Jubilee Hills", rating: 4.2, km: 3.6, price: "₹890 / plate (veg)" },
  ],
  decor: [
    { name: "Marigold & Co.", area: "Banjara Hills", rating: 4.8, km: 4.9, price: "₹85k–1.4L scope" },
    { name: "Studio Ikkat", area: "Film Nagar", rating: 4.5, km: 5.4, price: "₹60k–1L scope" },
    { name: "Bloom Room", area: "Kondapur", rating: 4.1, km: 8.1, price: "₹45k–80k scope" },
  ],
  photo: [
    { name: "Frame & Flame", area: "Jubilee Hills", rating: 4.7, km: 3.7, price: "₹75k half-day" },
    { name: "Light Leak Studio", area: "Hitec City", rating: 4.4, km: 6.2, price: "₹58k half-day" },
    { name: "Anand & Co.", area: "Secunderabad", rating: 4.2, km: 11.4, price: "₹42k half-day" },
  ],
  music: [
    { name: "The Loop Collective", area: "Madhapur", rating: 4.5, km: 4.8, price: "₹35k live set" },
    { name: "DJ Nakul", area: "Jubilee Hills", rating: 4.3, km: 3.1, price: "₹28k two hours" },
  ],
  attire: [
    { name: "Kora Studio", area: "Banjara Hills", rating: 4.6, km: 4.2, price: "₹22k–45k outfit" },
    { name: "Thread & Tale", area: "Somajiguda", rating: 4.4, km: 6.8, price: "₹16k–30k outfit" },
  ],
  invites: [
    { name: "Paper & Palai", area: "Jubilee Hills", rating: 4.7, km: 3.4, price: "₹120 / card" },
    { name: "Digital Dhaara", area: "Remote", rating: 4.5, km: 0, price: "₹15k digital suite" },
  ],
  transport: [
    { name: "Sahayak Fleet", area: "Hitec City", rating: 4.4, km: 7.1, price: "₹3.5k / sedan" },
  ],
};

export const IDEAS_BY_TYPE: Record<EventType, IdeaCard[]> = {
  engagement: [
    {
      id: "marigold",
      title: "Ivory & Marigold",
      tag: "Warm minimal",
      why: "Marigold reads traditional to elders and costs ₹18k less than imported florals. Ivory keeps your photos clean against the hall's warm lighting.",
      palette: ["#fff8ec", "#f7c948", "#e06c26", "#3c7a5a", "#202124"],
      menu: ["Pani puri counter", "Gongura paneer tikka", "Hyderabadi veg biryani", "Double ka meetha"],
      activities: ["Ring exchange at golden hour", "Family toast reel", "Polaroid guest wall"],
      gradient: "linear-gradient(135deg, #f9d976 0%, #e8a33d 38%, #b4542a 100%)",
    },
    {
      id: "garden",
      title: "Terrace Garden Evening",
      tag: "Outdoor",
      why: "An open-air terrace suits Hyderabad's post-monsoon evenings and skips the banquet-hall minimum, saving roughly ₹40k.",
      palette: ["#eaf4ea", "#7aa97c", "#2f5d50", "#d9c3a5", "#1f2a24"],
      menu: ["Chaat station", "Wood-fired veg pizza", "Coconut payasam", "Filter coffee bar"],
      activities: ["String-lit first dance", "Herb pot return gifts", "Live acoustic set"],
      gradient: "linear-gradient(135deg, #a8d5ba 0%, #4f8a6d 45%, #20463a 100%)",
    },
    {
      id: "sangeet",
      title: "Midnight Sangeet",
      tag: "Music-first",
      why: "Your vibe list leans playful. Dim lighting plus one strong light cue makes a ₹30k room feel designed.",
      palette: ["#1b1b3a", "#5b4b8a", "#c06c84", "#f8b195", "#f6e7d7"],
      menu: ["Late-night chaat", "Kebab platter", "Mocktail bar", "Kulfi cart"],
      activities: ["Choreographed family set", "Open mic dedications", "Neon dhol entry"],
      gradient: "linear-gradient(135deg, #c06c84 0%, #6c5b7b 45%, #1b1b3a 100%)",
    },
    {
      id: "heritage",
      title: "Heritage Courtyard",
      tag: "Cultural",
      why: "A courtyard with arches gives you built-in decor, cutting the decor budget by about a fifth while staying true to a Hyderabadi setting.",
      palette: ["#fdf6ee", "#d8b384", "#8c5a3c", "#3d6b73", "#2b2119"],
      menu: ["Haleem (veg) shooters", "Sheer khurma", "Saffron rice", "Irani chai"],
      activities: ["Qawwali hour", "Mehendi corner", "Attar bar"],
      gradient: "linear-gradient(135deg, #e7c9a9 0%, #b58156 45%, #5c3b28 100%)",
    },
  ],
  wedding: [
    {
      id: "royal",
      title: "Royal Deccan",
      tag: "Traditional",
      why: "Multi-day weddings need decor that photographs differently each function. Gold and deep teal do that without new rentals.",
      palette: ["#0f3b3a", "#c9a227", "#f4e3c1", "#8c2f39", "#1b1b1b"],
      menu: ["Mehendi chaat", "Sangeet barbecue", "Biryani & mirchi ka salan", "Qubani ka meetha"],
      activities: ["Haldi brunch", "Sangeet showcase", "Baraat band"],
      gradient: "linear-gradient(135deg, #d4af37 0%, #7a5c1e 40%, #0f3b3a 100%)",
    },
    {
      id: "pastel",
      title: "Pastel Daybreak",
      tag: "Soft",
      why: "Pastels suit morning functions and cut lighting costs. Reuse the same florals for haldi and mehendi.",
      palette: ["#fdeef1", "#f7c7d4", "#b9d8e8", "#9cbfa5", "#3a3a3a"],
      menu: ["South Indian breakfast", "Fresh juice bar", "Millet salad bar", "Rose falooda"],
      activities: ["Sunrise pheras", "Kite flying", "Floral jewellery making"],
      gradient: "linear-gradient(135deg, #ffd9e1 0%, #b9d8e8 50%, #8cbfa5 100%)",
    },
  ],
  birthday: [
    {
      id: "garden-party",
      title: "Backyard Garden Party",
      tag: "Playful",
      why: "Kids stay engaged with three activity stations, so you need less hired entertainment and can spend on food.",
      palette: ["#fff4e6", "#ffb703", "#90be6d", "#f28482", "#264653"],
      menu: ["Mini sliders", "Fruit skewers", "Cupcake tower", "Lemonade stand"],
      activities: ["Face painting", "Pot painting", "Treasure hunt"],
      gradient: "linear-gradient(135deg, #ffe29f 0%, #ffa99f 45%, #ff719a 100%)",
    },
    {
      id: "space",
      title: "Little Astronauts",
      tag: "Theme",
      why: "Dark drapes plus a projector create a theme for under ₹20k, and the backdrop doubles as a photo wall.",
      palette: ["#0b1d3a", "#3a86ff", "#ffbe0b", "#f1f7ff", "#111827"],
      menu: ["Star-shaped sandwiches", "Galaxy cake", "Fruit rockets", "Hot chocolate"],
      activities: ["Planetarium dome", "Rocket craft", "Astronaut photos"],
      gradient: "linear-gradient(135deg, #3a86ff 0%, #1e3a8a 50%, #0b1d3a 100%)",
    },
  ],
  community: [
    {
      id: "mela",
      title: "Neighbourhood Mela",
      tag: "Inclusive",
      why: "Stalls give 200+ people somewhere to go, which matters more than a stage programme at this scale.",
      palette: ["#fff3d6", "#e4572e", "#17bebb", "#2e282a", "#f4a259"],
      menu: ["Community kitchen thali", "Chai & snack stalls", "Water stations", "Millet laddoo"],
      activities: ["Craft stalls", "Storytelling tent", "Open mic"],
      gradient: "linear-gradient(135deg, #ffd166 0%, #ef476f 48%, #118ab2 100%)",
    },
  ],
};
