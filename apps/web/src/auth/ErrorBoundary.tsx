// =====================================================
// Top-level React error boundary.
//
// Without this, a render-time throw in ANY page blanks the whole SPA
// — the user just sees a white screen. The boundary catches the
// throw, shows a Persian "something went wrong" message with the
// real Error.message + stack (in dev), and a button to reset back
// to the home route.
//
// Phase-14.5 C2: dropped @ts-nocheck. Class component now properly
// extends React.Component<Props, State> so future Sentry wiring
// (Phase 17) has a typed surface to attach to.
// =====================================================

import React from "react";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  error: Error | null;
  info: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    this.setState({ info });
    // Surfaced to ops via the browser console; Phase 17 wires Sentry.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = (): void => {
    this.setState({ error: null, info: null });
    try {
      // Phase-14 R3: BrowserRouter migration. ErrorBoundary is a class
      // component so it can't use the useNavigate hook. A hard
      // navigation to "/" is fine here — we WANT a fresh React tree
      // after an unhandled exception, and the new doc load also clears
      // any half-mounted state from the failed render.
      window.location.assign("/");
    } catch {
      // ignore
    }
  };

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;

    const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "var(--bg, #0a0d1a)",
          color: "var(--fg, #fff)",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            background: "var(--surface, #15182a)",
            border: "1px solid var(--line, #2a2e44)",
            borderRadius: 16,
            padding: 28,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--f-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--warn, #f59e0b)",
              marginBottom: 12,
            }}
          >
            UNEXPECTED ERROR
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
            صفحه با خطا مواجه شد
          </h1>
          <p style={{ color: "var(--fg-mute, #aaa)", lineHeight: 1.8, marginBottom: 20 }}>
            متأسفیم — مشکلی پیش آمد. این خطا به صورت خودکار ثبت شد.
            می‌توانید به صفحه اصلی بازگردید یا صفحه را دوباره بارگذاری کنید.
          </p>
          {isDev && this.state.error && (
            <pre
              dir="ltr"
              style={{
                textAlign: "left",
                background: "var(--surface-2, #0e1120)",
                border: "1px solid var(--line, #2a2e44)",
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                overflowX: "auto",
                marginBottom: 16,
                color: "var(--fg-mute, #aaa)",
              }}
            >
              {String(this.state.error.message || this.state.error)}
              {this.state.info?.componentStack && "\n" + this.state.info.componentStack}
            </pre>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={this.reset}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "var(--accent, #06b6d4)",
                color: "var(--bg, #0a0d1a)",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              بازگشت به خانه
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "transparent",
                color: "var(--fg, #fff)",
                border: "1px solid var(--line-2, #3a3e54)",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              بارگذاری مجدد
            </button>
          </div>
        </div>
      </main>
    );
  }
}
