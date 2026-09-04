import { createServerFn } from "@tanstack/react-start";

export const validateLicenseKey = createServerFn({ method: "POST" })
  .inputValidator((input: { licenseKey: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("id, name, is_active")
      .eq("license_key", data.licenseKey.trim())
      .maybeSingle();

    if (error || !company) {
      return { valid: false as const, message: "Invalid license key" };
    }

    if (!company.is_active) {
      return { valid: false as const, message: "This license key is inactive. Contact support." };
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("company_id", company.id);

    const profileIds = profiles?.map((p) => p.id) ?? [];
    let hasAdmin = false;
    if (profileIds.length > 0) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", profileIds);
      hasAdmin = (roles?.length ?? 0) > 0;
    }

    return {
      valid: true as const,
      companyId: company.id,
      companyName: company.name,
      hasAdmin,
    };
  });
