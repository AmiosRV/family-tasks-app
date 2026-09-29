import { createClient } from "@supabase/supabase-js";
 
const supabaseUrl = "https://xzyyzbrdkngsqxgwxcsk.supabase.co";
const supabaseKey = "sb_publishable_Ei1H1rsPcJjhd5_JefFhJg_HqVOSkCg";
 
export const supabase = createClient(
supabaseUrl,
supabaseKey
);