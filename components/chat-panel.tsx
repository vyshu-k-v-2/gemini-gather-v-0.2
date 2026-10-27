"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanStore } from "@/lib/plan-store";
import { Icon, Sparkle } from "./ui";
import { formatCompactINR } from "@/lib/format";

export function ChatPanel() {
  const { messages, thinking, sendChat, agents, plan, regenerate, generating, showSnack } =
    usePlanStore();
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const submit = (text: string) => {
    const value = text.trim();
    if (!value) return;
    sendChat(value);
    setDraft("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  return (
    <aside className="chat" aria-label="Planning conversation">
      <div className="chat__head">
        <div className="row" style={{ gap: 8 }}>
          <Sparkle size={18} />
          <span className="chat__title">Planning copilot</span>
          <span className="spacer" />
          <button
            type="button"
            className="icon-btn"
            aria-label="Rebuild the plan from the brief"
            title="Rebuild plan"
            onClick={() => {
              void regenerate();
              showSnack("Rebuilding the plan from the current brief.");
            }}
            disabled={generating}
          >
            <Icon name="refresh" />
          </button>
        </div>

        <div className="chat__agents" aria-label="Agent progress" role="status">
          {agents.map((a) => (
            <span
              key={a.id}
              className={`agentchip ${
                a.state === "done" ? "agentchip--done" : a.state === "running" ? "agentchip--run" : ""
              }`}
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

      <div className="chat__log" ref={logRef}>
        {messages.length === 0 ? (
          <div className="bubble bubble--ai">
            <div className="bubble__meta">
              <Sparkle size={11} /> Gemini
            </div>
            Describe the event and I&apos;ll draft the whole plan — then tell me what changed and I&apos;ll
            rebalance it.
          </div>
        ) : null}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.role === "user" ? "bubble--user" : "bubble--ai"}`}
          >
            {m.role === "assistant" ? (
              <div className="bubble__meta">
                <Sparkle size={11} /> Gemini
              </div>
            ) : null}
            <div>{m.text}</div>

            {m.diff && m.diff.deltas.length ? (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
                {m.diff.deltas.slice(0, 4).map((d) => (
                  <div
                    key={d.lineId}
                    className="row"
                    style={{ justifyContent: "space-between", gap: 10, fontSize: 12 }}
                  >
                    <span className="muted">{d.category}</span>
                    <span
                      className={`delta ${
                        d.amountInr > 0 ? "delta--up" : d.amountInr < 0 ? "delta--down" : "delta--flat"
                      }`}
                    >
                      {d.amountInr > 0 ? "+" : "−"}
                      {formatCompactINR(Math.abs(d.amountInr))}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {m.chips?.length ? (
              <div className="bubble__actions">
                {m.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="chip chip--xs chip--action"
                    onClick={() => sendChat(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {thinking ? (
          <div className="bubble bubble--ai" aria-live="polite">
            <div className="bubble__meta">
              <Sparkle size={11} /> Replanning
            </div>
            <div className="typing" aria-label="Gemini is working">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : null}

        {!plan && !thinking ? (
          <div className="bubble bubble--ai" style={{ opacity: 0.7 }}>
            No plan loaded yet. Use the prompt on the home screen to start.
          </div>
        ) : null}
      </div>

      <div className="chat__composer">
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message the planning copilot
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={draft}
            placeholder={plan ? "Tell me what changed…" : "Describe your event…"}
            onChange={(e) => {
              setDraft(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(draft);
              }
            }}
            style={{ height: "auto" }}
          />
          <button
            type="submit"
            className="composer__send"
            aria-label="Send message"
            disabled={!draft.trim() || thinking}
          >
            <Icon name="arrow_upward" size={20} />
          </button>
        </form>
        <div className="composer__hint">
          <Icon name="bolt" size={12} />
          Edits apply to the living plan
        </div>
      </div>
    </aside>
  );
}
