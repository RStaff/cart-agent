"use client";
import * as React from "react";

export type StripeEnv = {
  hasPublishable: boolean;
  hasSecret: boolean;
};

export function useStripeStatus() {
  const [env, setEnv] = React.useState<StripeEnv | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/status")
      .then(r => r.json())
      .then(j => {
        if (!cancelled) setEnv(j?.env ?? null);
      })
      .catch(() => {
        if (!cancelled) setEnv(null);
      });
    return () => {
        cancelled = true;
    };
  }, []);

  return env;
}
