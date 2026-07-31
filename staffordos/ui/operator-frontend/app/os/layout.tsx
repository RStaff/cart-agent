import type { ReactNode } from "react";
import { StaffordOsShell } from "../../components/staffordos/StaffordOsShell";

export default function StaffordOsLayout({ children }: { children: ReactNode }) {
  return <StaffordOsShell>{children}</StaffordOsShell>;
}
