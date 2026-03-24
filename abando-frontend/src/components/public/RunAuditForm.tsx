"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunAuditForm() {
  const router = useRouter();
  const [store, setStore] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="rounded-xl bg-[#0f172a] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!store.trim()) return;
        setIsLoading(true);
        router.push(`/run-audit?store=${encodeURIComponent(store.trim())}`);
      }}
    >
      <div className="flex flex-col gap-3">
        <input
          value={store}
          onChange={(event) => setStore(event.target.value)}
          placeholder="northstar-outdoors.myshopify.com"
          className="h-12 rounded-lg border border-white/10 bg-[#020617] px-4 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Running audit…
            </span>
          ) : (
            "Run audit"
          )}
        </button>
      </div>
    </form>
  );
}
