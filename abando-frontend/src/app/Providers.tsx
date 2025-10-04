"use client";
import * as React from "react";
import TourProvider from "@/components/TourProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TourProvider>{children}</TourProvider>;
}
