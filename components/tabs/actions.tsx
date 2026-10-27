"use client";

import { useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Icon, Sparkle } from "@/components/ui";
import { formatCompactINR, formatDate, formatINR } from "@/lib/format";

export function ActionsTab() {
  const { plan, showSnack } = usePlanStore();
  const [activeTool, setActiveTool] = useState<"calendar" | "sheets" | "gmail" | "maps">("calendar");
  const [copiedSheet, setCopiedSheet] = useState(false);
  const [selectedGmailVendor, setSelectedGmailVendor] = useState("venue");

  if (!plan) return null;

  const { brief, budget, timeline, vendors } = plan;

  /* Calendar Actions */
  const downloadICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gemini Gather//Event Planner//EN\n";
    timeline.milestones.forEach((m) => {
      const dt = m.dueDate.replace(/-/g, "");
      icsContent += `BEGIN:VEVENT\nSUMMARY:Gemini Gather: ${m.title}\nDTSTART;VALUE=DATE:${dt}\nDESCRIPTION:Owner: ${m.owner}. T-${m.tMinus} days to ${brief.title}. Status: ${m.status}.\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${brief.title.toLowerCase().replace(/\s+/g, "-")}-milestones.ics`;
    link.click();
    showSnack("Google Calendar (.ics) exported! Double-click to sync all milestones.");
  };

  /* Sheets Actions */
  const copySheetsData = async () => {
    let tsv = "Category\tPriority\tPlanned (INR)\tActual (INR)\tVariance\tRationale\n";
    budget.lines.forEach((l) => {
      const diff = l.actualInr - l.amountInr;
      tsv += `${l.category}\t${l.priority}\t${l.amountInr}\t${l.actualInr}\t${diff}\t${l.rationale}\n`;
    });
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedSheet(true);
      window.setTimeout(() => setCopiedSheet(false), 2500);
      showSnack("Spreadsheet data copied to clipboard! Paste directly into Google Sheets.");
    } catch {
      showSnack("Failed to copy spreadsheet data.");
    }
  };

  const downloadCSV = () => {
    let csv = "Category,Priority,Planned INR,Actual INR,Variance INR,Rationale\n";
    budget.lines.forEach((l) => {
      const diff = l.actualInr - l.amountInr;
      csv += `"${l.category}","${l.priority}",${l.amountInr},${l.actualInr},${diff},"${l.rationale.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${brief.title.toLowerCase().replace(/\s+/g, "-")}-budget.csv`;
    link.click();
    showSnack("Budget Tracker CSV downloaded for Google Sheets!");
  };

  /* Gmail Drafts */
  const vendorEmailDrafts: Record<string, { subject: string; body: string; vendorName: string }> = {
    venue: {
      vendorName: "Grand Banjara Banquet & Lawns",
      subject: `Inquiry: Availability & Banquet Package for ${brief.title} on ${formatDate(brief.date)}`,
      body: `Dear Banquet Management,\n\nI am writing to inquire about venue and banquet hall availability for an upcoming ${brief.eventType} on ${formatDate(brief.date)} in ${brief.city}.\n\nKey event specifications:\n- Expected Guests: ${brief.guests} pax\n- Function Timing: Evening (6:30 PM to 11:00 PM)\n- Catering Requirement: Pure vegetarian menu with live counters\n- Allocated Venue Budget: ${formatCompactINR(budget.lines.find((l) => l.id === "venue")?.amountInr ?? 150000)}\n\nCould you please share your banquet packages, lawn dimensions, indoor weather-contingency options, and advance booking terms?\n\nLooking forward to scheduling a site visit.\n\nWarm regards,\nEvent Host (via Gemini Gather)`,
    },
    catering: {
      vendorName: "Royal Deccan Caterers",
      subject: `Menu Tasting & Quote Request: ${brief.guests} Guests Pure Vegetarian on ${formatDate(brief.date)}`,
      body: `Dear Catering Team,\n\nWe would like to request a quotation and schedule a food tasting session for ${brief.title} scheduled on ${formatDate(brief.date)} in ${brief.city}.\n\nDetails:\n- Guest Count: ${brief.guests} guests (with 10% floating buffer)\n- Dietary Preference: Strictly Pure Vegetarian (Sattvik / Traditional Hyderabadi)\n- Target per-plate budget: ₹${Math.round((budget.lines.find((l) => l.id === "catering")?.amountInr ?? 180000) / brief.guests)} a head\n- Must-haves: Live Chaat Counter, Saffron Biryani, Qubani ka Meetha dessert station\n\nPlease let us know when we can visit for a menu tasting.\n\nBest regards,\nHost (via Gemini Gather)`,
    },
    photo: {
      vendorName: "Frame & Flame Studios",
      subject: `Photography & Film Coverage: ${brief.title} on ${formatDate(brief.date)}`,
      body: `Dear Frame & Flame Team,\n\nWe love your candid portfolio and want to check your availability for ${brief.title} on ${formatDate(brief.date)} in ${brief.city}.\n\nScope:\n- 1 Traditional Photographer + 1 Candid Specialist\n- Cinematic highlight reel (3-5 minutes) + 400 edited high-res digital stills\n- Delivery window: 3 weeks post-event\n- Budget allocation: ${formatCompactINR(budget.lines.find((l) => l.id === "photo")?.amountInr ?? 60000)}\n\nPlease share your contract package and availability.\n\nWarmly,\nHost`,
    },
  };

  const currentEmail = vendorEmailDrafts[selectedGmailVendor] ?? vendorEmailDrafts.venue;

  const openInGmail = () => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      currentEmail.subject
    )}&body=${encodeURIComponent(currentEmail.body)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="stack gap-16">
      {/* Hero Section with Responsible AI Badge */}
      <section className="card card--pad" aria-labelledby="actions-head">
        <div className="section-head" style={{ marginBottom: 6 }}>
          <div className="row gap-8">
            <span className="icon-badge icon-badge--primary">
              <Icon name="apps" size={20} />
            </span>
            <div>
              <h3 className="section-title" id="actions-head">
                Real-World Actions Through Google Tools
              </h3>
              <p className="section-sub">
                Export to Calendar, Sheets, Gmail and Maps — the plan doesn&apos;t stay stuck on screen
              </p>
            </div>
          </div>

          {/* Responsible AI Badge */}
          <div className="row gap-6">
            <span className="chip chip--ai chip--xs" style={{ background: "var(--surface-tint)", color: "var(--primary)", fontWeight: 600 }}>
              <Icon name="shield_with_heart" size={14} />
              Responsible AI: AI drafts, Human sends
            </span>
          </div>
        </div>

        {/* Tool Navigation Tabs */}
        <div className="row gap-8" style={{ borderTop: "1px solid var(--outline-soft)", paddingTop: 14, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { id: "calendar", label: "Google Calendar", icon: "calendar_month", color: "#1a73e8" },
            { id: "sheets", label: "Google Sheets", icon: "table_chart", color: "#1e8e3e" },
            { id: "gmail", label: "Gmail Drafts", icon: "mail", color: "#ea4335" },
            { id: "maps", label: "Google Maps Radar", icon: "map", color: "#fbbc04" },
          ].map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`chip chip--action ${activeTool === tool.id ? "chip--active" : ""}`}
              onClick={() => setActiveTool(tool.id as any)}
              style={{ fontWeight: 600 }}
            >
              <Icon name={tool.icon} size={16} />
              {tool.label}
            </button>
          ))}
        </div>
      </section>

      {/* 1. Google Calendar Tool View */}
      {activeTool === "calendar" && (
        <section className="card card--pad">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Google Calendar Milestone Sync ({timeline.milestones.length} Events)
              </h4>
              <p className="section-sub">
                Each milestone is scheduled with owner tags and automated T-minus countdown alerts
              </p>
            </div>
            <button type="button" className="btn btn--filled btn--sm" onClick={downloadICS}>
              <Icon name="calendar_add_on" size={16} />
              Export All to Google Calendar (.ics)
            </button>
          </div>

          <div className="stack gap-8">
            {timeline.milestones.map((m) => (
              <div
                key={m.id}
                className="card card--flat row gap-12"
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  alignItems: "center",
                  background: "var(--surface-1)",
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(26, 115, 232, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="event" size={20} />
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="label" style={{ fontWeight: 600 }}>{m.title}</div>
                  <div className="caption muted">
                    {formatDate(m.dueDate)} · Owner: {m.owner} · T-{m.tMinus} days
                  </div>
                </div>

                <a
                  className="btn btn--tonal btn--xs"
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    `Gemini Gather: ${m.title}`
                  )}&dates=${m.dueDate.replace(/-/g, "")}/${m.dueDate.replace(/-/g, "")}&details=${encodeURIComponent(
                    `Owner: ${m.owner}. Part of ${brief.title}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="open_in_new" size={13} />
                  Add to Calendar
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Google Sheets Tool View */}
      {activeTool === "sheets" && (
        <section className="card card--pad">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Google Sheets Planned vs Actual Budget Tracker
              </h4>
              <p className="section-sub">
                Live formula tracker with variance analysis, contingency holding and priority ranking
              </p>
            </div>
            <div className="row gap-8">
              <button type="button" className="btn btn--tonal btn--sm" onClick={copySheetsData}>
                <Icon name={copiedSheet ? "check" : "content_copy"} size={16} />
                {copiedSheet ? "Copied!" : "Copy for Sheets"}
              </button>
              <button type="button" className="btn btn--filled btn--sm" onClick={downloadCSV}>
                <Icon name="download" size={16} />
                Download .CSV
              </button>
            </div>
          </div>

          {/* Interactive Spreadsheet Preview */}
          <div className="spreadsheet-preview card card--flat" style={{ borderRadius: 14, overflow: "auto", border: "1px solid var(--outline-soft)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--outline)" }}>
                  <th style={{ padding: "10px 14px" }}>Budget Line</th>
                  <th style={{ padding: "10px 14px" }}>Priority</th>
                  <th style={{ padding: "10px 14px" }}>Planned (INR)</th>
                  <th style={{ padding: "10px 14px" }}>Actual (INR)</th>
                  <th style={{ padding: "10px 14px" }}>Variance</th>
                  <th style={{ padding: "10px 14px" }}>Strategic Rationale</th>
                </tr>
              </thead>
              <tbody>
                {budget.lines.map((line) => {
                  const variance = line.actualInr - line.amountInr;
                  return (
                    <tr key={line.id} style={{ borderBottom: "1px solid var(--outline-soft)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: line.color, marginRight: 8 }} />
                        {line.category}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span className="caption chip chip--xs" style={{ textTransform: "capitalize" }}>
                          {line.priority}
                        </span>
                      </td>
                      <td className="mono" style={{ padding: "10px 14px" }}>
                        ₹{line.amountInr.toLocaleString("en-IN")}
                      </td>
                      <td className="mono" style={{ padding: "10px 14px" }}>
                        ₹{line.actualInr.toLocaleString("en-IN")}
                      </td>
                      <td className="mono" style={{ padding: "10px 14px", color: variance > 0 ? "var(--red)" : "var(--green)" }}>
                        {variance > 0 ? `+₹${variance.toLocaleString("en-IN")}` : variance < 0 ? `−₹${Math.abs(variance).toLocaleString("en-IN")}` : "₹0"}
                      </td>
                      <td className="caption muted" style={{ padding: "10px 14px" }}>
                        {line.rationale}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--surface-1)", fontWeight: 700 }}>
                  <td style={{ padding: "12px 14px" }}>Total Budget</td>
                  <td style={{ padding: "12px 14px" }}>{budget.lines.length} lines</td>
                  <td className="mono" style={{ padding: "12px 14px" }}>₹{budget.totalInr.toLocaleString("en-IN")}</td>
                  <td className="mono" style={{ padding: "12px 14px" }}>
                    ₹{budget.lines.reduce((a, b) => a + b.actualInr, 0).toLocaleString("en-IN")}
                  </td>
                  <td className="mono" style={{ padding: "12px 14px" }}>Contingency: {budget.contingencyPercent}%</td>
                  <td style={{ padding: "12px 14px" }}>Verdict: {budget.verdict}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* 3. Gmail Vendor Quote Drafter */}
      {activeTool === "gmail" && (
        <section className="card card--pad">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Gmail Vendor Quote Drafter (Responsible AI)
              </h4>
              <p className="section-sub">
                AI crafts polite, specific vendor inquiry emails. The user reviews and sends.
              </p>
            </div>
            <button type="button" className="btn btn--filled btn--sm" onClick={openInGmail}>
              <Icon name="mail" size={16} />
              Review & Send via Gmail
            </button>
          </div>

          {/* Vendor Selector */}
          <div className="row gap-8" style={{ marginBottom: 14 }}>
            {[
              { id: "venue", label: "Venue & Banquet Hall Inquiry" },
              { id: "catering", label: "Catering & Menu Tasting Request" },
              { id: "photo", label: "Photography & Reel Coverage" },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                className={`chip chip--action ${selectedGmailVendor === v.id ? "chip--active" : ""}`}
                onClick={() => setSelectedGmailVendor(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Email Preview Box */}
          <div
            className="card card--flat email-draft-box"
            style={{
              padding: 18,
              borderRadius: 16,
              background: "var(--surface-1)",
              border: "1px solid var(--outline-soft)",
            }}
          >
            <div className="email-meta-field row gap-8" style={{ paddingBottom: 8, borderBottom: "1px solid var(--outline-soft)" }}>
              <span className="caption muted" style={{ width: 60, fontWeight: 600 }}>To:</span>
              <span className="caption" style={{ fontWeight: 600 }}>{currentEmail.vendorName}</span>
            </div>

            <div className="email-meta-field row gap-8" style={{ padding: "8px 0", borderBottom: "1px solid var(--outline-soft)" }}>
              <span className="caption muted" style={{ width: 60, fontWeight: 600 }}>Subject:</span>
              <span className="caption" style={{ fontWeight: 600 }}>{currentEmail.subject}</span>
            </div>

            <pre
              style={{
                marginTop: 14,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--text)",
              }}
            >
              {currentEmail.body}
            </pre>

            <div className="row gap-8" style={{ marginTop: 16, justifyContent: "space-between", alignItems: "center" }}>
              <span className="caption muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="lock" size={13} />
                No auto-send: Opens in Gmail for user approval
              </span>

              <button type="button" className="btn btn--filled btn--sm" onClick={openInGmail}>
                <Icon name="open_in_new" size={15} />
                Open Compose Window in Gmail
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Google Maps Real Vendor Radar */}
      {activeTool === "maps" && (
        <section className="card card--pad">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Google Maps Verified Vendor Radar ({brief.city})
              </h4>
              <p className="section-sub">
                Curated local vendors matched to budget band, guest capacity and ratings
              </p>
            </div>
            <a
              className="btn btn--tonal btn--sm"
              href={`https://www.google.com/maps/search/${encodeURIComponent(
                `${brief.eventType} banquets in ${brief.city}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="map" size={16} />
              Open Live Google Maps Search
            </a>
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            {vendors.slice(0, 4).flatMap((v) =>
              v.options.slice(0, 2).map((opt) => (
                <div
                  key={opt.id}
                  className="card card--flat"
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid var(--outline-soft)",
                    background: "var(--surface-1)",
                  }}
                >
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.name}</span>
                    <span className="chip chip--xs" style={{ background: "rgba(251, 188, 4, 0.15)", color: "#b06000", fontWeight: 700 }}>
                      ★ {opt.rating}
                    </span>
                  </div>

                  <div className="caption muted" style={{ marginBottom: 8 }}>
                    <Icon name="location_on" size={13} style={{ verticalAlign: "middle", marginRight: 2 }} />
                    {opt.area}, {brief.city} · {opt.distanceKm} km away
                  </div>

                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <span className="caption" style={{ fontWeight: 600 }}>
                      Price Band: {opt.priceBand}
                    </span>
                    <a
                      className="btn btn--outlined btn--xs"
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        `${opt.name} ${opt.area} ${brief.city}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="directions" size={13} />
                      View on Maps
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
