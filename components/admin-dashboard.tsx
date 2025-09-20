"use client";

import { useState } from "react";
import { useData } from "@/components/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  BarChart,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export function AdminDashboard() {
  const { entries, loading, error, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.soulWinner.toLowerCase().includes(searchLower) ||
      entry.nameOfSoul.toLowerCase().includes(searchLower) ||
      entry.residence.toLowerCase().includes(searchLower) ||
      entry.category.toLowerCase().includes(searchLower)
    );
  });

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success("Data refreshed successfully");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("soul_entries").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete entry.");
      console.error(error);
    } else {
      toast.success("Entry deleted.");
      refreshData();
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Soul Winner",
      "Date",
      "Category",
      "Name of Soul",
      "Residence",
      "Phone Number",
      "On WhatsApp",
      "Created At",
    ];

    const csvRows = [
      headers.join(","),
      ...filteredEntries.map((entry) => {
        return [
          `"${entry.soulWinner}"`,
          `"${formatDate(entry.date)}"`,
          `"${entry.category}"`,
          `"${entry.nameOfSoul}"`,
          `"${entry.residence}"`,
          `"${entry.phoneNumber}"`,
          `"${entry.onWhatsapp}"`,
          `"${formatDate(entry.createdAt)}"`,
        ].join(",");
      }),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `soul_entries_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.click();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPP");
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-10 text-destructive">
          <p className="mb-4">Failed to load data: {error}</p>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard stats
  const totalWon = entries.filter(
    (entry) => entry.category.toLowerCase() === "won"
  ).length;

  const totalRecommit = entries.filter(
    (entry) => entry.category.toLowerCase() === "recommitted"
  ).length;

  return (
    <>
      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 border border-green-300 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-medium text-green-800 mb-1">Souls Won</h3>
          <p className="text-3xl font-bold text-green-900">{totalWon}</p>
        </div>
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-5 shadow-sm">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            Recommitted
          </h3>
          <p className="text-3xl font-bold text-blue-900">{totalRecommit}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 w-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Souls Dashboard
          </h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search entries..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset pagination on search
                }}
              />
            </div>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Link href="/analytics" passHref>
              <Button variant="outline" className="cursor-pointer">
                <BarChart className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={exportToCSV}
              disabled={filteredEntries.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {entries.length === 0
              ? "No entries have been recorded yet."
              : "No entries match your search criteria."}
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Soul Winner</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Name of Soul</TableHead>
                    <TableHead>Residence</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>On WhatsApp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.soulWinner}
                      </TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.nameOfSoul}</TableCell>
                      <TableCell>{entry.residence}</TableCell>
                      <TableCell>{entry.phoneNumber}</TableCell>
                      <TableCell>{entry.onWhatsapp}</TableCell>
                      <TableCell>
                        <Trash2
                          className="w-4 h-4 cursor-pointer"
                          onClick={() => deleteEntry(entry.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-4 cursor-pointer">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
