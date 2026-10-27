"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import type { Plan, VendorCategory, VendorStatus } from "@/lib/types";
import { Dialog, Icon, Sparkle } from "@/components/ui";
import { formatCompactINR, formatDate } from "@/lib/format";
import { cityInfo } from "@/lib/templates";
import { VENDOR_STATUS_LABEL } from "@/lib/engine";

const VENDOR_LINE: Record<string, string> = {
  venue: "venue",
  catering: "catering",
  decor: "decor",
  photo: "photo",
  music: "entertainment",
  attire: "attire",
  invites: "invites",
};

export function VendorsTab() {
  const { plan, setVendorStatus, showSnack } = usePlanStore();
  const [draftFor, setDraftFor] = useState<VendorCategory | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  if (!plan) return null;
  const emailBody = draftFor ? buildEmail(draftFor, plan) : "";
  const city = cityInfo(plan.brief.city);
  const bbox = `${city.lng - 0.045},${city.lat - 0.03},${city.lng + 0.045},${city.lat + 0.03}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${city.lat},${city.lng}`;
  const booked = plan.vendors.filter((v) => v.status === "booked").length;

  return (
    <div className="stack gap-16">
      <section className="card card--pad" aria-labelledby="vendor-head">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <div>
            <h3 className="section-title" id="vendor-head">
              {plan.vendors.length} vendor categories
            </h3>
            <p className="section-sub">
              {booked} booked · {plan.vendors.filter((v) => v.status === "quoted").length} quoted ·{" "}
              {plan.vendors.filter((v) => v.status === "contacted").length} contacted
            </p>
          </div>
          <span className="chip chip--xs">
            <Icon name="location_on" size={14} />
            {plan.brief.city}
          </span>
        </div>
        <p className="caption muted" style={{ marginTop: 8 }}>
          Options below are a sample catalogue with estimated prices. Connect Maps Platform in the
          backend to replace them with live venues, ratings and distance.
        </p>
      </section>

      <div className="vendor-grid">
        {plan.vendors.map((vendor) => {
          const budgetLine = plan.budget.lines.find((l) => l.id === VENDOR_LINE[vendor.id]);
          const doneCount = vendor.checklist.filter((_, i) => checks[`${vendor.id}-${i}`]).length;

          return (
            <section className="card vcard" key={vendor.id} aria-label={vendor.name}>
              <div className="vcard__head">
                <div className="row gap-12" style={{ minWidth: 0 }}>
                  <span className="vcard__icon">
                    <Icon name={vendor.icon} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="brow__name">{vendor.name}</div>
                    <div className="caption muted" style={{ fontWeight: 400 }}>
                      {vendor.options.length
                        ? `${vendor.options.length} options · ${budgetLine ? formatCompactINR(budgetLine.amountInr) : "budget TBD"}`
                        : "Checklist only"}
                    </div>
                  </div>
                </div>
                <label className="sr-only" htmlFor={`status-${vendor.id}`}>
                  {vendor.name} status
                </label>
                <select
                  id={`status-${vendor.id}`}
                  className="status-select"
                  data-state={vendor.status}
                  value={vendor.status}
                  onChange={(e) => setVendorStatus(vendor.id, e.target.value as VendorStatus)}
                >
                  <option value="idle">Not started</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="booked">Booked</option>
                </select>
              </div>

              {vendor.options.length ? (
                <div className="vcard__list">
                  {vendor.options.slice(0, 3).map((option) => (
                    <div className="voption" key={option.id}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="voption__name">{option.name}</div>
                        <div className="voption__meta">
                          {option.area} · {option.distanceKm} km · ★ {option.rating.toFixed(1)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="mono" style={{ fontSize: 11.5 }}>
                          {option.priceBand}
                        </div>
                        <div className="caption" style={{ color: "var(--yellow)" }}>
                          estimated
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="caption muted">
                  No live listings for this category — the checklist is the deliverable.
                </p>
              )}

              {vendor.note ? (
                <p className="caption muted" style={{ display: "flex", gap: 6 }}>
                  <Icon name="info" size={14} />
                  {vendor.note}
                </p>
              ) : null}

              <details className="vdetails">
                <summary className="chip chip--xs chip--action" style={{ listStyle: "none" }}>
                  <Icon name="checklist" size={14} />
                  Checklist {doneCount}/{vendor.checklist.length}
                </summary>
                <ul className="vchecklist">
                  {vendor.checklist.map((item, i) => {
                    const key = `${vendor.id}-${i}`;
                    const on = !!checks[key];
                    return (
                      <li key={item}>
                        <button
                          type="button"
                          className="vcheck"
                          aria-pressed={on}
                          onClick={() => setChecks((prev) => ({ ...prev, [key]: !prev[key] }))}
                        >
                          <Icon
                            name={on ? "check_circle" : "radio_button_unchecked"}
                            size={16}
                            style={{ color: on ? "var(--green)" : "var(--text-3)" }}
                          />
                          <span style={on ? { textDecoration: "line-through", color: "var(--text-2)" } : undefined}>
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>

              <div className="row gap-8" style={{ marginTop: "auto" }}>
                <button
                  type="button"
                  className="btn btn--tonal btn--sm"
                  onClick={() => setDraftFor(vendor)}
                >
                  <Icon name="mail" size={16} />
                  Draft email
                </button>
                <span className="spacer" />
                <span
                  className={`status ${
                    vendor.status === "booked"
                      ? "st--booked"
                      : vendor.status === "quoted"
                        ? "st--quoted"
                        : vendor.status === "contacted"
                          ? "st--contacted"
                          : "st--idle"
                  }`}
                >
                  {VENDOR_STATUS_LABEL[vendor.status]}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <section className="card map-card" aria-labelledby="map-title">
        <div className="row" style={{ padding: "16px 18px 12px", gap: 8 }}>
          <Icon name="map" size={18} />
          <h3 className="section-title" id="map-title">
            Venues near {plan.brief.city}
          </h3>
          <span className="spacer" />
          <span className="chip chip--xs">Map data © OpenStreetMap</span>
        </div>
        <iframe
          title={`Map of ${plan.brief.city}`}
          src={mapSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div
          className="row"
          style={{ padding: "12px 18px 16px", gap: 12, flexWrap: "wrap" }}
        >
          <span className="caption muted">
            {plan.vendors.find((v) => v.id === "venue")?.options.length ?? 0} sample venues pinned in
            the shortlist. Distances are straight-line estimates.
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="chip chip--xs chip--action"
            onClick={() =>
              showSnack("Map search: connect the Places API key to query live venues by radius.")
            }
          >
            <Icon name="search" size={14} />
            Search this area
          </button>
        </div>
      </section>

      <Dialog
        open={!!draftFor}
        onClose={() => setDraftFor(null)}
        labelledBy="draft-title"
        kind="dialog"
      >
        <div className="dialog__head">
          <div>
            <h3 className="title" id="draft-title">
              Draft quote request
            </h3>
            <p className="caption muted">
              {draftFor?.name} · {plan.brief.city}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close draft"
            onClick={() => setDraftFor(null)}
          >
            <Icon name="close" />
          </button>
        </div>

        <textarea
          className="input"
          style={{ height: 280, padding: 14, lineHeight: "22px", fontSize: 13.5, resize: "vertical" }}
          value={emailBody}
          onChange={() => undefined}
          aria-label="Email draft"
          readOnly
        />

        <div className="row gap-8" style={{ marginTop: 16, flexWrap: "wrap" }}>
          <a
            className="btn btn--filled btn--sm"
            href={`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
              `Quote request — ${draftFor?.name ?? "vendor"}`
            )}&body=${encodeURIComponent(emailBody)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="open_in_new" size={16} />
            Open in Gmail
          </a>
          <button
            type="button"
            className="btn btn--outlined btn--sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(emailBody);
                showSnack("Email copied to clipboard.");
              } catch {
                showSnack("Select the text above to copy the draft.");
              }
            }}
          >
            <Icon name="content_copy" size={16} />
            Copy
          </button>
          <span className="spacer" />
          <button
            type="button"
            className="btn btn--text btn--sm"
            onClick={() => {
              setDraftFor(null);
              showSnack("Saved to Gmail drafts (demo — OAuth scope required).");
            }}
          >
            Save draft
          </button>
        </div>
        <p className="caption muted" style={{ marginTop: 10 }}>
          <Sparkle size={11} /> Written from the brief and budget line. Vendor replies are treated as
          data, never as instructions.
        </p>
      </Dialog>
    </div>
  );
}

function buildEmail(vendor: VendorCategory, plan: Plan) {
  const b = plan.brief;
  const line = plan.budget.lines.find((l) => l.id === VENDOR_LINE[vendor.id]);
  const target = vendor.options[0]?.name ?? vendor.name;
  return `Subject: ${b.title} on ${formatDate(b.date)} — ${b.guests} guests, ${b.city}

Hello ${target} team,

We're planning ${b.title.toLowerCase()} in ${b.city} for ${b.guests} guests on ${formatDate(b.date)}.

What we need:
• ${vendor.name} — ${vendor.checklist.slice(0, 3).join(", ")}
• ${b.constraints.join("; ") || "No special constraints"}
• Indicative budget for this category: ${line ? formatCompactINR(line.amountInr) + " (estimated)" : "to be discussed"}

Could you share:
1. A line-item quote with taxes
2. Availability for the date, plus one alternate
3. What is included and what is charged extra

Happy to do a call this week.

Thank you,
${b.title.split(" & ")[0] || "The hosts"}`;
}
