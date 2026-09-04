// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";

export async function createNotification(
  userId: string,
  title: string,
  description?: string,
  link?: string,
  type: "info" | "success" | "warning" | "error" = "info",
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabase.from("app_notifications").insert({
    user_id: userId,
    title,
    description: description ?? null,
    link: link ?? null,
    type,
    metadata: metadata ?? {},
  });
  if (error) console.error("Failed to create notification:", error);
}
