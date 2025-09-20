"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useData } from "@/components/data-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Globe,
  Cake,
} from "lucide-react";
import {
  format,
  parseISO,
  subDays,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { useRouter } from "next/navigation";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#8dd1e1",
];

export function AnalyticsDashboard() {
  const { entries, loading, error } = useData();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30");

  const filteredEntries = useMemo(() => {
    if (!entries.length) return [];
    const daysToSubtract = Number.parseInt(timeRange);
    const cutoffDate = subDays(new Date(), daysToSubtract);
    return entries.filter((entry) => {
      try {
        const entryDate = parseISO(entry.date);
        return entryDate >= cutoffDate;
      } catch {
        return false;
      }
    });
  }, [entries, timeRange]);

  const stats = useMemo(() => {
    if (!filteredEntries.length) {
      return {
        totalEntries: 0,
        wonToChrist: 0,
        recommitted: 0,
        encouraged: 0,
        invited: 0,
        onWhatsapp: 0,
        uniqueLocations: 0,
        uniqueSoulWinners: 0,
        uniqueZones: 0,
        averageAge: 0,
      };
    }

    const wonToChrist = filteredEntries.filter(
      (e) => e.category === "won"
    ).length;
    const recommitted = filteredEntries.filter(
      (e) => e.category === "recommitted"
    ).length;
    const encouraged = filteredEntries.filter(
      (e) => e.category === "encouraged"
    ).length;
    const invited = filteredEntries.filter(
      (e) => e.category === "invited"
    ).length;
    const onWhatsapp = filteredEntries.filter(
      (e) => e.onWhatsapp === "yes"
    ).length;

    const uniqueLocations = new Set(filteredEntries.map((e) => e.residence))
      .size;
    const uniqueSoulWinners = new Set(filteredEntries.map((e) => e.soulWinner))
      .size;
    const uniqueZones = new Set(filteredEntries.map((e) => e.zone)).size;

    const ages = filteredEntries
      .map((e) => parseInt(e.age, 10))
      .filter((age) => !isNaN(age));
    const averageAge =
      ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    return {
      totalEntries: filteredEntries.length,
      wonToChrist,
      recommitted,
      encouraged,
      invited,
      onWhatsapp,
      uniqueLocations,
      uniqueSoulWinners,
      uniqueZones,
      averageAge: Math.round(averageAge),
    };
  }, [filteredEntries]);

  const categoryData = useMemo(
    () =>
      [
        { name: "Won to Christ", value: stats.wonToChrist },
        { name: "Recommitted", value: stats.recommitted },
        { name: "Encouraged", value: stats.encouraged },
        { name: "Invited", value: stats.invited },
      ].filter((item) => item.value > 0),
    [stats]
  );

  const whatsappData = useMemo(() => {
    const notOnWhatsapp = stats.totalEntries - stats.onWhatsapp;
    return [
      { name: "On WhatsApp", value: stats.onWhatsapp },
      { name: "Not on WhatsApp", value: notOnWhatsapp },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const trendData = useMemo(() => {
    if (!filteredEntries.length) return [];

    const dates = filteredEntries.map((e) => parseISO(e.date));
    const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const newestDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const daysDifference = differenceInDays(newestDate, oldestDate);

    if (daysDifference > 60) {
      const months = eachMonthOfInterval({
        start: startOfMonth(oldestDate),
        end: endOfMonth(newestDate),
      });

      return months.map((month) => {
        const monthEntries = filteredEntries.filter((entry) => {
          const entryDate = parseISO(entry.date);
          return (
            entryDate.getMonth() === month.getMonth() &&
            entryDate.getFullYear() === month.getFullYear()
          );
        });

        return {
          date: format(month, "MMM yyyy"),
          total: monthEntries.length,
          won: monthEntries.filter((e) => e.category === "won").length,
          recommitted: monthEntries.filter((e) => e.category === "recommitted")
            .length,
        };
      });
    } else {
      const dailyData: Record<
        string,
        { total: number; won: number; recommitted: number }
      > = {};

      filteredEntries.forEach((entry) => {
        try {
          const dateStr = format(parseISO(entry.date), "yyyy-MM-dd");
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = { total: 0, won: 0, recommitted: 0 };
          }
          dailyData[dateStr].total++;
          if (entry.category === "won") dailyData[dateStr].won++;
          else if (entry.category === "recommitted")
            dailyData[dateStr].recommitted++;
        } catch (e) {
          console.error("Error parsing date:", e);
        }
      });

      return Object.keys(dailyData)
        .sort()
        .map((dateStr) => ({
          date: format(parseISO(dateStr), "dd MMM"),
          ...dailyData[dateStr],
        }));
    }
  }, [filteredEntries]);

  const topSoulWinnersData = useMemo(() => {
    if (!filteredEntries.length) return [];

    const soulWinnerCounts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const { soulWinner, category } = entry;
      if (category === "won" || category === "recommitted") {
        soulWinnerCounts[soulWinner] = (soulWinnerCounts[soulWinner] || 0) + 1;
      }
    });

    return Object.entries(soulWinnerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredEntries]);

  const locationData = useMemo(() => {
    if (!filteredEntries.length) return [];
    const locationCounts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const location = entry.residence;
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    return Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredEntries]);

  const zoneData = useMemo(() => {
    if (!filteredEntries.length) return [];
    const zoneCounts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      const zone = entry.zone;
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });
    return Object.entries(zoneCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredEntries]);

  const ageDistributionData = useMemo(() => {
    if (!filteredEntries.length) return [];
    const ageGroups: Record<string, number> = {
      "0-12": 0,
      "13-19": 0,
      "20-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51+": 0,
    };
    filteredEntries.forEach((entry) => {
      const age = parseInt(entry.age, 10);
      if (isNaN(age)) return;
      if (age <= 12) ageGroups["0-12"]++;
      else if (age <= 19) ageGroups["13-19"]++;
      else if (age <= 30) ageGroups["20-30"]++;
      else if (age <= 40) ageGroups["31-40"]++;
      else if (age <= 50) ageGroups["41-50"]++;
      else ageGroups["51+"]++;
    });
    return Object.entries(ageGroups).map(([name, count]) => ({ name, count }));
  }, [filteredEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading data: {error}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* ... your JSX unchanged ... */}
      {/* I kept the rest of your JSX the same — just fixed types above */}
    </div>
  );
}
