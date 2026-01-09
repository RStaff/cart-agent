"use client";
import React from "react";

export default class DevErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { err?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { err: undefined };
  }
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  componentDidCatch(err: Error, info: any) {
    // Useful console noise in dev so we don't miss silent errors
    console.error("[demo/playground] runtime error:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        this.props.fallback ?? (
          <div style={{ padding: "24px" }}>
            <h2 style={{ fontWeight: 600, marginBottom: 8 }}>
              Something broke on this page.
            </h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {String(this.state.err?.message || this.state.err)}
            </pre>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
