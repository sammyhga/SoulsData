"use client";

import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { DataProvider } from "@/components/data-context";

export default function AnalyticsPage() {
  return (
    <DataProvider>
      <AnalyticsDashboard />
    </DataProvider>
  );
}
