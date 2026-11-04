
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://veuagsuyebsjbsemvrik.supabase.co";

const supabaseKey = "sb_publishable_-orGv8eDWtRBiLrLMnm7Rg_hpHyi4uB";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
