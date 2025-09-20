import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definition for our database table
export type SoulEntryRow = {
  id: string;
  soul_winner: string;
  zone: string;
  date: string;
  category: string;
  name_of_soul: string;
  age: string;
  residence: string;
  phone_number: string;
  on_whatsapp: string;
  created_at: string;
};
