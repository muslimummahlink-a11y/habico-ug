import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return { success: false as const, error: "Forbidden" };
    }

    const email = (data.email || "").trim().toLowerCase();
    if (!email.includes("@")) {
      return { success: false as const, error: "Enter a valid email address" };
    }

    const newPassword = data.password || Math.random().toString(36).slice(2, 10) + "A1!";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let targetId: string | null = null;
    for (let page = 1; page <= 10 && !targetId; page++) {
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (listError) return { success: false as const, error: listError.message };
      const users = listData?.users ?? [];
      const match = users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (match) targetId = match.id;
      if (users.length < 1000) break;
    }

    if (!targetId) {
      return { success: false as const, error: `No account found for ${email}` };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
      password: newPassword,
    });
    if (error) return { success: false as const, error: error.message };
    return { success: true as const, email, password: newPassword, generated: !data.password };
  });