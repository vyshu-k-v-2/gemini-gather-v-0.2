export function formatINR(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatCompactINR(amount: number): string {
  if (Math.abs(amount) >= 10000000) return "₹" + (amount / 10000000).toFixed(2) + " Cr";
  if (Math.abs(amount) >= 100000) {
    const lakhs = amount / 100000;
    return "₹" + (lakhs >= 10 ? lakhs.toFixed(1) : lakhs.toFixed(2)) + " L";
  }
  if (Math.abs(amount) >= 1000) return "₹" + Math.round(amount / 1000) + "k";
  return formatINR(amount);
}

export function formatSignedINR(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return sign + formatINR(Math.abs(amount));
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISO(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function formatDate(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function weekday(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-IN", { weekday: "short" });
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function daysBetween(fromISO: string, toISOValue: string): number {
  const a = parseISO(fromISO).getTime();
  const b = parseISO(toISOValue).getTime();
  return Math.round((b - a) / 86400000);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
