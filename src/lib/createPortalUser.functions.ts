import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createPortalUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    email: string;
    full_name: string;
    phone?: string;
    password?: string;
    role: "staff" | "manager" | "owner" | "tenant";
    routes: string[];
  }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) return { success: false as const, error: "Only administrators can create portal accounts" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = data.password || `${Math.random().toString(36).slice(2, 10)}A1!`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone ?? "" },
    });
    if (authError || !authData.user) return { success: false as const, error: authError?.message || "Could not create account" };

    const userId = authData.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone ?? null,
    });
    if (profileError) return { success: false as const, error: profileError.message };

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    if (roleError) return { success: false as const, error: roleError.message };

    if (data.routes.length > 0) {
      const { error: accessError } = await supabaseAdmin.from("user_page_access").insert(
        data.routes.map((route) => ({ user_id: userId, route, granted_by: context.userId })),
      );
      if (accessError) return { success: false as const, error: accessError.message };
    }

    return { success: true as const, email: data.email, password, userId };
  });