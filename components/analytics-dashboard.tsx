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

// Define chart colors
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

  // Filter entries based on selected time range
  const filteredEntries = useMemo(() => {
    if (!entries.length) return [];

    const daysToSubtract = Number.parseInt(timeRange);
    const cutoffDate = subDays(new Date(), daysToSubtract);

    return entries.filter((entry) => {
      try {
        const entryDate = parseISO(entry.date);
        return entryDate >= cutoffDate;
      } catch (e) {
        return false;
      }
    });
  }, [entries, timeRange]);

  // Calculate statistics
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

  // Prepare data for category distribution chart
  const categoryData = useMemo(() => {
    return [
      { name: "Won to Christ", value: stats.wonToChrist },
      { name: "Recommitted", value: stats.recommitted },
      { name: "Encouraged", value: stats.encouraged },
      { name: "Invited", value: stats.invited },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Prepare data for WhatsApp distribution chart
  const whatsappData = useMemo(() => {
    const notOnWhatsapp = stats.totalEntries - stats.onWhatsapp;
    return [
      { name: "On WhatsApp", value: stats.onWhatsapp },
      { name: "Not on WhatsApp", value: notOnWhatsapp },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Prepare data for trend over time chart
  const trendData = useMemo(() => {
    if (!filteredEntries.length) return [];

    // Get date range
    const dates = filteredEntries.map((e) => parseISO(e.date));
    const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const newestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // If the range is more than 60 days, group by month
    const daysDifference = differenceInDays(newestDate, oldestDate);

    if (daysDifference > 60) {
      // Group by month
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
      // Group by day
      const dailyData = {};

      filteredEntries.forEach((entry) => {
        try {
          const dateStr = format(parseISO(entry.date), "yyyy-MM-dd");

          if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
              total: 0,
              won: 0,
              recommitted: 0,
            };
          }

          dailyData[dateStr].total++;

          if (entry.category === "won") {
            dailyData[dateStr].won++;
          } else if (entry.category === "recommitted") {
            dailyData[dateStr].recommitted++;
          }
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

  // Prepare data for top soul winners chart
  const topSoulWinnersData = useMemo(() => {
    if (!filteredEntries.length) return [];

    const soulWinnerCounts = {};

    filteredEntries.forEach((entry) => {
      const { soulWinner, category } = entry;
      if (category === "won" || category === "recommitted") {
        const name = entry.soulWinner;
        soulWinnerCounts[name] = (soulWinnerCounts[name] || 0) + 1;
      }
    });

    return Object.entries(soulWinnerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredEntries]);

  // Prepare data for location distribution
  const locationData = useMemo(() => {
    if (!filteredEntries.length) return [];

    const locationCounts = {};

    filteredEntries.forEach((entry) => {
      const location = entry.residence;
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    return Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredEntries]);

  // Prepare data for zone distribution
  const zoneData = useMemo(() => {
    if (!filteredEntries.length) return [];

    const zoneCounts = {};

    filteredEntries.forEach((entry) => {
      const zone = entry.zone;
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });

    return Object.entries(zoneCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredEntries]);

  // Prepare data for age distribution
  const ageDistributionData = useMemo(() => {
    if (!filteredEntries.length) return [];

    const ageGroups = {
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

    return Object.entries(ageGroups).map(([name, count]) => ({
      name,
      count,
    }));
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" className="mr-4 cursor-pointer">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Souls Dashboard
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Time Range:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="3650">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-10">Soul Winners Analytics</h1>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 ">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  People Reached
                </p>
                <h3 className="text-2xl font-bold">{stats.totalEntries}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Won to Christ
                </p>
                <h3 className="text-2xl font-bold">{stats.wonToChrist}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Soul Winners
                </p>
                <h3 className="text-2xl font-bold">
                  {stats.uniqueSoulWinners}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full mr-4">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Locations</p>
                <h3 className="text-2xl font-bold">{stats.uniqueLocations}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-teal-100 rounded-full mr-4">
                <Globe className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Zones</p>
                <h3 className="text-2xl font-bold">{stats.uniqueZones}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-full mr-4">
                <Cake className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Average Age</p>
                <h3 className="text-2xl font-bold">{stats.averageAge}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different chart views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 h-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Souls Recorded Over Time</CardTitle>
                <CardDescription>
                  Total number of souls recorded by date
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ChartContainer
                  config={{
                    total: {
                      label: "Total",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-total)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>
                  Breakdown of souls by category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-4">
            {/* Top Soul Winners */}
            <Card>
              <CardHeader>
                <CardTitle>Top Soul Winners</CardTitle>
                <CardDescription>Most active soul winners</CardDescription>
              </CardHeader>
              <CardContent className="h-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topSoulWinnersData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      fontSize={"14px"}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Bar dataKey="count" fill="#8884d8">
                      {topSoulWinnersData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>
                  Most common residence locations
                </CardDescription>
              </CardHeader>
              <CardContent className="h-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Bar dataKey="count" fill="#82ca9d">
                      {locationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[(index + 3) % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Statistics</CardTitle>
                <CardDescription>Analysis of WhatsApp Users</CardDescription>
              </CardHeader>
              <CardContent className="h-40">
                <div className="flex flex-col justify-center">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      {stats.onWhatsapp} out of {stats.totalEntries} souls have
                      WhatsApp access.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">On WhatsApp</span>
                        <span className="text-sm font-medium">
                          {stats.totalEntries > 0
                            ? (
                                (stats.onWhatsapp / stats.totalEntries) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{
                            width: `${
                              stats.totalEntries > 0
                                ? (stats.onWhatsapp / stats.totalEntries) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">
                          Not on WhatsApp
                        </span>
                        <span className="text-sm font-medium">
                          {stats.totalEntries > 0
                            ? (
                                ((stats.totalEntries - stats.onWhatsapp) /
                                  stats.totalEntries) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-red-500 h-2.5 rounded-full"
                          style={{
                            width: `${
                              stats.totalEntries > 0
                                ? ((stats.totalEntries - stats.onWhatsapp) /
                                    stats.totalEntries) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="h-auto w-150">
            <CardHeader>
              <CardTitle>Souls Won Over Time</CardTitle>
              <CardDescription>Tracking progress by category</CardDescription>
            </CardHeader>
            <CardContent className="h-130 size-150">
              <ChartContainer
                config={{
                  total: {
                    label: "Total",
                    color: "hsl(var(--chart-1))",
                  },
                  won: {
                    label: "Won to Christ",
                    color: "hsl(var(--chart-2))",
                  },
                  recommitted: {
                    label: "Recommitted",
                    color: "hsl(var(--chart-3))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="won"
                      stroke="var(--color-won)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="recommitted"
                      stroke="var(--color-recommitted)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* {trends deleted go here} */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth</CardTitle>
                <CardDescription>Month-over-month comparison</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="#8884d8" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate</CardTitle>
                <CardDescription>
                  Percentage of souls won to Christ
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData.map((item) => ({
                      ...item,
                      conversionRate:
                        item.total > 0
                          ? ((item.won / item.total) * 100).toFixed(1)
                          : 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="%" />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Conversion Rate"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversionRate"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>
                  Distribution of souls by category
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Comparison</CardTitle>
                <CardDescription>
                  Side-by-side comparison of categories
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Bar dataKey="value" name="Count">
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>
                  Breakdown of souls by age group
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Bar dataKey="count" name="Count">
                      {ageDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Zones</CardTitle>
                <CardDescription>
                  Most common zones for outreach
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip
                      formatter={(value) => [`${value} souls`, "Count"]}
                    />
                    <Bar dataKey="count" fill="#82ca9d">
                      {zoneData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[(index + 3) % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
