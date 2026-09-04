import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const setProtectDeletePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }: { context: { userId: string }; data: { password: string } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .single();
    const companyId = (profile as any)?.company_id;
    if (!companyId) throw new Error("No company associated with user");

    const { error } = await supabaseAdmin.rpc("set_protect_delete_password", {
      p_password: data.password,
    });
    if (error) throw error;
    return { success: true as const };
  });

export const verifyProtectDeletePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }: { context: { userId: string }; data: { password: string } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .single();
    const companyId = (profile as any)?.company_id;
    if (!companyId) return { valid: false };

    const { data: result, error } = await supabaseAdmin.rpc("verify_protect_delete_password", {
      p_password: data.password,
    });
    if (error) return { valid: false };
    return { valid: result === true };
  });

export const hasProtectDeletePassword = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .single();
    const companyId = (profile as any)?.company_id;
    if (!companyId) return { hasPassword: false };

    const { data: result } = await supabaseAdmin.rpc("has_protect_delete_password");
    return { hasPassword: result === true };
  });
