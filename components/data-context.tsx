"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase, type SoulEntryRow } from "@/lib/supabase";
import { toast } from "sonner";

export interface SoulEntry {
  id: string;
  soulWinner: string;
  date: string;
  category: string;
  nameOfSoul: string;
  residence: string;
  phoneNumber: string;
  onWhatsapp: string;
  createdAt: string;
}

interface DataContextType {
  entries: SoulEntry[];
  addEntry: (entry: Omit<SoulEntry, "id" | "createdAt">) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Convert from database snake_case to frontend camelCase
function mapDatabaseRowToSoulEntry(row: SoulEntryRow): SoulEntry {
  return {
    id: row.id,
    soulWinner: row.soul_winner,
    date: row.date,
    category: row.category,
    nameOfSoul: row.name_of_soul,
    residence: row.residence,
    phoneNumber: row.phone_number,
    onWhatsapp: row.on_whatsapp,
    createdAt: row.created_at,
  };
}

// Convert from frontend camelCase to database snake_case
function mapSoulEntryToDatabaseRow(
  entry: Omit<SoulEntry, "id" | "createdAt">
): Omit<SoulEntryRow, "id" | "created_at"> {
  return {
    soul_winner: entry.soulWinner,
    date: entry.date,
    category: entry.category,
    name_of_soul: entry.nameOfSoul,
    residence: entry.residence,
    phone_number: entry.phoneNumber,
    on_whatsapp: entry.onWhatsapp,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<SoulEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("soul_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Map the data from snake_case to camelCase
      const mappedData = data.map(mapDatabaseRowToSoulEntry);
      setEntries(mappedData);
    } catch (err: any) {
      console.error("Error fetching entries:", err);
      setError(err.message || "Failed to fetch data");
      toast.error("Failed to load data", {
        description: err.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data from Supabase on initial render
  useEffect(() => {
    fetchData();
  }, []);

  // Function to add a new entry to Supabase
  const addEntry = async (
    entry: Omit<SoulEntry, "id" | "createdAt">
  ): Promise<boolean> => {
    try {
      // Convert to database format
      const dbEntry = mapSoulEntryToDatabaseRow(entry);

      // Insert into Supabase
      const { data, error } = await supabase
        .from("soul_entries")
        .insert([dbEntry])
        .select();

      if (error) {
        throw error;
      }

      // Add the new entry to the local state
      if (data && data.length > 0) {
        const newEntry = mapDatabaseRowToSoulEntry(data[0] as SoulEntryRow);
        setEntries((prev) => [newEntry, ...prev]);
      }

      return true;
    } catch (err: any) {
      console.error("Error adding entry:", err);
      toast.error("Failed to save data", {
        description: err.message || "Please try again later",
      });
      return false;
    }
  };

  // Function to refresh data
  const refreshData = async () => {
    await fetchData();
  };

  return (
    <DataContext.Provider
      value={{ entries, addEntry, loading, error, refreshData }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
