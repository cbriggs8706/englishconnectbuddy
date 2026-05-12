import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

export async function recordOrdinalsRound({
  wasPerfect,
}: {
  wasPerfect: boolean;
}) {
  if (!supabaseConfigured()) return null;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("record_ordinals_round", {
    p_was_perfect: wasPerfect,
  });

  if (error) {
    console.error("recordOrdinalsRound failed", {
      wasPerfect,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  return (data as Profile | null) ?? null;
}
