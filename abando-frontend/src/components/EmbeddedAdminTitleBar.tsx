"use client";

import { TitleBar } from "@shopify/app-bridge-react";

export function EmbeddedAdminTitleBar({ title = "Abando" }: { title?: string }) {
  return <TitleBar title={title} />;
}
