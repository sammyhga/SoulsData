"use client";

import { useState } from "react";
import { DataEntryForm } from "@/components/data-entry-form";
import { LoginButton } from "@/components/login-button";
import { AdminDashboard } from "@/components/admin-dashboard";
import { DataProvider } from "@/components/data-context";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <DataProvider>
      <main className="flex min-h-screen flex-col p-4 md:p-10 bg-gradient-to-b from-white to-gray-100">
        <div className="w-auto mb-10">
          <LoginButton isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        </div>
        <div className="max-w-6xl mx-auto ">
          <div className="w-full flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Blantyre Branch Souls Entry
            </h1>
          </div>

          {isLoggedIn ? (
            <AdminDashboard />
          ) : (
            <div className="space-y-4 w-800 relative max-w-lg mx-auto p-4 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Data Entry Form
              </h2>
              <DataEntryForm />
            </div>
          )}
        </div>
      </main>
    </DataProvider>
  );
}
