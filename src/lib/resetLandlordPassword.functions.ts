import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const resetLandlordPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; password?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isManager } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "manager",
    });
    if (!isAdmin && !isManager) {
      return { success: false as const, error: "Forbidden" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const newPassword = data.password || Math.random().toString(36).slice(2, 10) + "A1!";
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: newPassword,
    });
    if (error) return { success: false as const, error: error.message };
    return { success: true as const, password: newPassword };
  });
