"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { Icon } from "./ui";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: "",
  };

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorId: `err-${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error("Uncaught error captured by ErrorBoundary", {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorId: "" });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="error-boundary-card card card--pad"
          style={{
            maxWidth: 520,
            margin: "40px auto",
            padding: "32px 24px",
            textAlign: "center",
            borderRadius: 20,
            border: "1px solid var(--outline-soft)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--red-container)",
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="error" size={28} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            An unexpected error occurred
          </h2>

          <p className="caption muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
            {this.props.fallbackMessage ||
              "Gemini Gather safely isolated an operational error. Your saved plans in local storage remain secure."}
          </p>

          <div className="caption muted" style={{ fontSize: 11, marginBottom: 16 }}>
            Error Reference ID: <span className="mono">{this.state.errorId}</span>
          </div>

          <button
            type="button"
            className="btn btn--filled"
            onClick={this.handleReset}
            style={{ margin: "0 auto" }}
          >
            <Icon name="refresh" size={16} />
            Reload &amp; Recover Plan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
