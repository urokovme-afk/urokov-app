import { supabase } from "./supabase";

export async function recordActivity(
  userEmail: string,
  action: string,
  details: string,
) {
  if (!userEmail) return;
  try {
    await supabase.from("activity_logs").insert([
      {
        user_email: userEmail.toLowerCase().trim(),
        action,
        details,
      },
    ]);
  } catch (err) {
    console.error("Log yozishda xatolik:", err);
  }
}
