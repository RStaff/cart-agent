// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetchAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-500 animate-pulse">Loading analytics...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">Error loading analytics: {error}</div>
    );
  }

  return (
    <div className="border rounded-lg p-4 grid gap-3">
      <h2 className="text-lg font-semibold">Analytics Summary</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white shadow-sm p-3 rounded-md border">
          <div className="font-medium">Recovery Rate</div>
          <div className="text-xl font-bold">
            {(analytics?.recoveryRate ?? 0).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white shadow-sm p-3 rounded-md border">
          <div className="font-medium">Emails Sent</div>
          <div className="text-xl font-bold">
            {analytics?.sentEmails ?? 0}
          </div>
        </div>

        <div className="bg-white shadow-sm p-3 rounded-md border">
          <div className="font-medium">Recovered Revenue</div>
          <div className="text-xl font-bold">
            ${Number(analytics?.recoveredRevenue ?? 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        * Mock data displayed if backend is offline
      </div>
    </div>
  );
}
