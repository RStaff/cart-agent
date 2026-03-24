import type { ReactNode } from "react";
import clsx from "clsx";

export default function CenteredContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className={clsx("mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-10", className)}>
        {children}
      </div>
    </main>
  );
}
