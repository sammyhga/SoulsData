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
import { Download, Loader2, RefreshCw, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export function AdminDashboard() {
  const { entries, loading, error, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.soulWinner.toLowerCase().includes(searchLower) ||
      entry.nameOfSoul.toLowerCase().includes(searchLower) ||
      entry.residence.toLowerCase().includes(searchLower) ||
      entry.category.toLowerCase().includes(searchLower)
    );
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportToCSV = () => {
    // Define CSV headers
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

    // Convert entries to CSV rows
    const csvRows = [
      headers.join(","), // Header row
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

    // Combine rows into a single CSV string
    const csvString = csvRows.join("\n");

    // Create a Blob and download link
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `soul_entries_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPP");
    } catch (error) {
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700">
          Soul Entries Dashboard
        </h2>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search entries..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={exportToCSV} disabled={filteredEntries.length === 0}>
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
        <div className="rounded-md border">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
