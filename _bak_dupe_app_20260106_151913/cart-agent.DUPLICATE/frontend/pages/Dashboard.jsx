import React from "react";
import AICopyGenerator from "../components/AICopyGenerator.jsx";
export default function Dashboard() {
  const backendBase = import.meta?.env?.VITE_BACKEND_BASE || "";
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">AI Copy Generator</h1>
      <AICopyGenerator backendBase={backendBase} />
    </div>
  );
}
