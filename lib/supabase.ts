import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ueonecgcxrfoqynanqng.supabase.co";

const supabaseAnonKey =
  "sb_publishable_ABBZMwOQmgSY9XtqJT0sdA_VCJKI8pM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);