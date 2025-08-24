import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
