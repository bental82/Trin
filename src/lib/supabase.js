import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wylqigmgsxdqgbfozrjc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5bHFpZ21nc3hkcWdiZm96cmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2ODEyMDcsImV4cCI6MjA4OTI1NzIwN30.0IkFy1XWBYTEPaKOcawMLFizEbNHMDd1oOYciO5fymk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
