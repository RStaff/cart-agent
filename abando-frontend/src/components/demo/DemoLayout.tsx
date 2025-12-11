import React from "react";

type DemoLayoutProps = {
  children: React.ReactNode;
};

export function DemoLayout({ children }: DemoLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 space-y-16 lg:px-8">
      {children}
    </main>
  );
}
