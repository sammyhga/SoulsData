"use client";

import { AdminDashboard } from "@/components/admin-dashboard";
import { DataProvider } from "@/components/data-context";

export default function Dashboard() {
  return (
    <DataProvider>
      <AdminDashboard /> {/* ✅ render your actual dashboard component */}
    </DataProvider>
  );
}
