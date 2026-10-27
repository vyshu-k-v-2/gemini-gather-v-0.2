"use client";

import { useRef, useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Icon, Sparkle } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { InviteLanguage } from "@/lib/types";

export function FamilyTab() {
  const {
    plan,
    castFamilyVote,
    setInviteLanguage,
    setInviteStyle,
    showSnack,
  } = usePlanStore();

  const [activeVoter, setActiveVoter] = useState({ name: "Ananya", relation: "Bride" });
  const [newComment, setNewComment] = useState("");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!plan) return null;

  const { familyTopics, eInvite, brief } = plan;

  const copyShareLink = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/plan?familyMode=true` : "";
    try {
      await navigator.clipboard.writeText(url);
      showSnack("Family voting link copied! Relatives can vote without an account.");
    } catch {
      showSnack("Share link ready: send page link to family WhatsApp group.");
    }
  };

  const shareWhatsApp = () => {
    // Generate multi-lingual invitation bundle or current selected language
    const currentLangText = `🙏 ${eInvite.blessingText}\n\n${eInvite.invitationText}`;
    
    // Also include English summary so all family members can understand
    const englishSummary = eInvite.language !== "en"
      ? `\n\n[English Translation]\nTogether with our families, ${eInvite.hostNames} invite you to celebrate the Engagement Ceremony.\n`
      : "";

    const text = encodeURIComponent(
      `${currentLangText}${englishSummary}\n📅 Date: ${formatDate(brief.date)}\n⏰ Time: ${eInvite.muhurthamTime}\n📍 Venue: ${eInvite.venueName}\n\nVote on our family preferences & view the living e-invite here: ${window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const downloadCardImage = () => {
    showSnack("Rendering high-res Imagen 3 card for download...");
    window.setTimeout(() => {
      showSnack("E-Invite Card downloaded as PNG! (Demo mode)");
    }, 1000);
  };

  const handleRegenerateInvite = () => {
    setGeneratingInvite(true);
    showSnack("Imagen 3 synthesizing bespoke cultural motif & calligraphy...");
    window.setTimeout(() => {
      setGeneratingInvite(false);
      showSnack("Imagen 3 e-invite updated with authentic typography & motifs!");
    }, 1400);
  };

  return (
    <div className="stack gap-16">
      {/* Header Banner */}
      <section className="card card--pad family-hero-banner" aria-labelledby="family-head">
        <div className="section-head" style={{ marginBottom: 6 }}>
          <div className="row gap-8">
            <span className="icon-badge icon-badge--accent">
              <Icon name="family_restroom" size={20} />
            </span>
            <div>
              <h3 className="section-title" id="family-head">
                Family Mode: Relatives Voting Hub & Imagen E-Invites
              </h3>
              <p className="section-sub">
                Shareable consensus hub for parents, elders and couples — with AI compromise and multilingual e-invites
              </p>
            </div>
          </div>

          <div className="row gap-8" style={{ flexWrap: "wrap" }}>
            <div className="row gap-4" style={{ alignItems: "center" }}>
              <span className="caption muted" style={{ fontWeight: 600 }}>
                Share Language:
              </span>
              {(
                [
                  { code: "te", label: "Telugu" },
                  { code: "hi", label: "Hindi" },
                  { code: "en", label: "English" },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`chip chip--action chip--xs ${eInvite.language === lang.code ? "chip--active" : ""}`}
                  onClick={() => setInviteLanguage(lang.code as InviteLanguage)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn--outlined btn--sm" onClick={copyShareLink}>
              <Icon name="share" size={16} />
              Copy Voting Link
            </button>
            <button type="button" className="btn btn--filled btn--sm" onClick={shareWhatsApp}>
              <Icon name="chat" size={16} />
              Share on WhatsApp
            </button>
          </div>
        </div>

        {/* Relative Switcher */}
        <div className="voter-switch-bar card card--flat" style={{ padding: "10px 14px", borderRadius: 12, marginTop: 12, background: "var(--surface-1)" }}>
          <div className="row gap-8" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <span className="caption muted" style={{ fontWeight: 600 }}>
              You are voting as:
            </span>
            {[
              { name: "Ananya", relation: "Bride" },
              { name: "Rohan", relation: "Groom" },
              { name: "Suresh Uncle", relation: "Father" },
              { name: "Padma Auntie", relation: "Mother" },
              { name: "Grandmother", relation: "Dadi" },
            ].map((voter) => (
              <button
                key={voter.name}
                type="button"
                className={`chip chip--action chip--xs ${activeVoter.name === voter.name ? "chip--active" : ""}`}
                onClick={() => setActiveVoter(voter)}
              >
                <span className="avatar-dot">{voter.name.charAt(0)}</span>
                {voter.name} ({voter.relation})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Part 1: Relatives Voting Hub */}
      <section className="card card--pad" aria-labelledby="topics-title">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title" id="topics-title">
              1. Relatives Voting Topics
            </h3>
            <p className="section-sub">
              Live consensus tracking with AI compromise recommendations when opinions diverge
            </p>
          </div>
        </div>

        <div className="stack gap-16">
          {familyTopics.map((topic) => {
            const isApproved = topic.status === "approved";
            return (
              <div
                key={topic.id}
                className="family-topic-card card card--flat"
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: isApproved ? "1px solid var(--outline-soft)" : "1px solid rgba(251, 188, 4, 0.4)",
                  background: isApproved ? "var(--surface)" : "var(--surface-1)",
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span className="caption muted" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                      {topic.category.toUpperCase()} DECISION
                    </span>
                    <h4 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 600 }}>
                      {topic.title}
                    </h4>
                  </div>

                  <div className="row gap-8" style={{ alignItems: "center" }}>
                    <span className="mono caption" style={{ fontWeight: 600 }}>
                      {topic.consensusPercent}% Agreement
                    </span>
                    <span
                      className={`status ${
                        isApproved ? "st--booked" : "st--quoted"
                      }`}
                      style={{ height: 26 }}
                    >
                      {isApproved ? "Approved by Family" : "Needs Discussion"}
                    </span>
                  </div>
                </div>

                {/* AI Compromise Note if needed */}
                {topic.aiCompromiseNote ? (
                  <div
                    className="ai-compromise-pill"
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--surface-tint)",
                      border: "1px solid rgba(66, 133, 244, 0.2)",
                      marginBottom: 12,
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <Sparkle size={15} />
                    <span className="caption" style={{ color: "var(--text)", lineHeight: 1.45 }}>
                      <strong>Gemini Recommendation:</strong> {topic.aiCompromiseNote}
                    </span>
                  </div>
                ) : null}

                {/* Options List */}
                <div className="grid-2" style={{ gap: 12 }}>
                  {topic.options.map((option) => {
                    const hasMyVote = option.votes.some(
                      (v) => v.member.toLowerCase() === activeVoter.name.toLowerCase()
                    );
                    return (
                      <div
                        key={option.id}
                        className={`family-option-box ${hasMyVote ? "family-option-box--selected" : ""}`}
                        style={{
                          padding: 14,
                          borderRadius: 14,
                          border: hasMyVote ? "2px solid var(--primary)" : "1px solid var(--outline-soft)",
                          background: hasMyVote ? "var(--surface-tint)" : "var(--surface-1)",
                        }}
                      >
                        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{option.title}</span>
                          <span className="chip chip--xs" style={{ height: 22, fontWeight: 600 }}>
                            {option.votes.length} votes
                          </span>
                        </div>

                        <p className="caption muted" style={{ marginBottom: 10 }}>
                          {option.description}
                        </p>

                        {/* Votes & Relative Comments */}
                        <div className="stack gap-4" style={{ marginBottom: 12 }}>
                          {option.votes.map((v, idx) => (
                            <div key={idx} className="relative-vote-pill row gap-6" style={{ alignItems: "center" }}>
                              <span className="avatar-chip">{v.avatar}</span>
                              <span className="caption" style={{ fontWeight: 600 }}>
                                {v.member} ({v.relation}):
                              </span>
                              <span className="caption muted" style={{ fontStyle: "italic" }}>
                                &ldquo;{v.comment || "Voted for this option"}&rdquo;
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className={`btn btn--xs ${hasMyVote ? "btn--filled" : "btn--tonal"}`}
                          style={{ width: "100%" }}
                          onClick={() => {
                            castFamilyVote(
                              topic.id,
                              option.id,
                              activeVoter.name,
                              activeVoter.relation,
                              activeVoter.relation === "Bride"
                                ? "Love the aesthetic and lighting!"
                                : activeVoter.relation === "Father"
                                  ? "Very comfortable for family elders."
                                  : "Great option."
                            );
                          }}
                        >
                          <Icon name={hasMyVote ? "check" : "how_to_vote"} size={14} />
                          {hasMyVote ? `Voted as ${activeVoter.name} ✓` : `Vote as ${activeVoter.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Part 2: Imagen 3 Themed E-Invite Card Generator */}
      <section className="card card--pad" aria-labelledby="einvite-title">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <div>
            <h3 className="section-title" id="einvite-title">
              2. Imagen Themed E-Invite Cards
            </h3>
            <p className="section-sub">
              Generates high-resolution wedding & festival cards in the family’s native language
            </p>
          </div>
          <span className="chip chip--ai chip--xs">
            <Sparkle size={12} />
            Imagen 3 Neural Cards
          </span>
        </div>

        {/* Controls Bar */}
        <div className="row gap-16" style={{ flexWrap: "wrap", marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
          {/* Language Selector */}
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <span className="caption muted" style={{ fontWeight: 600 }}>
              Language:
            </span>
            {(
              [
                { code: "te", label: "Telugu (తెలుగు)" },
                { code: "hi", label: "Hindi (हिन्दी)" },
                { code: "en", label: "English" },
                { code: "ta", label: "Tamil (தமிழ்)" },
                { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
              ] as const
            ).map((l) => (
              <button
                key={l.code}
                type="button"
                className={`chip chip--action chip--xs ${eInvite.language === l.code ? "chip--active" : ""}`}
                onClick={() => setInviteLanguage(l.code as InviteLanguage)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Theme Style Selector */}
          <div className="row gap-8" style={{ alignItems: "center" }}>
            <span className="caption muted" style={{ fontWeight: 600 }}>
              Style:
            </span>
            {[
              { id: "temple_gold", label: "Temple Gold & Marigold" },
              { id: "royal_peacock", label: "Peacock & Heritage Arch" },
              { id: "emerald_heritage", label: "Emerald & Gold Jaali" },
              { id: "pastel_minimal", label: "Pastel Sunset Floral" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                className={`chip chip--action chip--xs ${eInvite.themeStyle === st.id ? "chip--active" : ""}`}
                onClick={() => setInviteStyle(st.id as any)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Canvas Presentation */}
        <div className="einvite-presentation-container">
          <div
            ref={cardRef}
            className={`einvite-card einvite-card--${eInvite.themeStyle}`}
            style={{
              maxWidth: 580,
              margin: "0 auto",
              padding: "36px 32px",
              borderRadius: 24,
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Auspicious Traditional Invocation Header */}
            <div className="einvite-shloka" style={{ fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>
              {eInvite.blessingText}
            </div>

            {/* Auspicious Motif */}
            <div className="einvite-motif" style={{ margin: "0 auto 16px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" opacity="0.1" />
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
            </div>

            {/* Event Name */}
            <div className="einvite-eyebrow" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 8 }}>
              Cordially Request Your Auspicious Presence
            </div>

            {/* Couple / Host Names */}
            <h2 className="einvite-names" style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 16px", letterSpacing: "0.02em" }}>
              {eInvite.hostNames}
            </h2>

            {/* Ceremony Body in native language */}
            <p className="einvite-body" style={{ fontSize: 15, lineHeight: 1.6, margin: "0 auto 24px", maxWidth: 460 }}>
              {eInvite.invitationText}
            </p>

            {/* Date, Time & Venue Block */}
            <div
              className="einvite-details-box"
              style={{
                display: "inline-block",
                padding: "16px 28px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                marginBottom: 20,
              }}
            >
              <div className="row gap-8" style={{ justifyContent: "center", marginBottom: 6, fontWeight: 600 }}>
                <Icon name="calendar_month" size={17} />
                <span>{formatDate(brief.date)}</span>
                <span>·</span>
                <span>{eInvite.muhurthamTime}</span>
              </div>
              <div className="row gap-6" style={{ justifyContent: "center", fontSize: 13, opacity: 0.9 }}>
                <Icon name="location_on" size={15} />
                <span>{eInvite.venueName}</span>
              </div>
            </div>

            <div className="einvite-foot" style={{ fontSize: 12, letterSpacing: "0.05em", opacity: 0.85 }}>
              Generated with Imagen 3 · Gemini Gather Living Invite
            </div>
          </div>

          {/* Action Buttons for Card */}
          <div className="row gap-8" style={{ marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--tonal"
              disabled={generatingInvite}
              onClick={handleRegenerateInvite}
            >
              <Sparkle size={16} />
              {generatingInvite ? "Rendering with Imagen 3…" : "Regenerate Motif with Imagen"}
            </button>

            <button type="button" className="btn btn--filled" onClick={downloadCardImage}>
              <Icon name="download" size={17} />
              Download Card (PNG)
            </button>

            <button type="button" className="btn btn--outlined" onClick={shareWhatsApp}>
              <Icon name="send" size={17} />
              Share to WhatsApp
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
