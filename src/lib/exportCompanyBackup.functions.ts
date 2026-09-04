import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const exportCompanyBackup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();
    const companyId = (profile as any)?.company_id;
    if (!companyId) throw new Error("No company associated with user");

    const tables = [
      "properties",
      "units",
      "leases",
      "tenants",
      "payments",
      "maintenance_requests",
      "rental_messages",
      "company_branding",
    ] as const;

    const data: Record<string, any> = {
      company_id: companyId,
      exported_at: new Date().toISOString(),
    };

    for (const table of tables) {
      const { data: rows } = await supabaseAdmin
        .from(table)
        .select("*")
        .eq("company_id", companyId);
      data[table] = (rows as any) ?? [];
    }

    const tablesNoCompanyId = ["recurring_billing"] as const;
    for (const table of tablesNoCompanyId) {
      const { data: rows } = await supabaseAdmin
        .from(table)
        .select("*, payments!inner(company_id)")
        .eq("payments.company_id", companyId);
      data[table] = (rows as any) ?? [];
    }

    const mediaUrls: string[] = [];
    const { data: units } = await supabaseAdmin
      .from("units")
      .select("photos")
      .eq("company_id", companyId);
    for (const unit of (units as any[]) ?? []) {
      if (unit.photos && Array.isArray(unit.photos)) {
        for (const path of unit.photos) {
          if (typeof path === "string") mediaUrls.push(path);
        }
      }
    }

    const { data: properties } = await supabaseAdmin
      .from("properties")
      .select("image_url")
      .eq("company_id", companyId);
    for (const prop of (properties as any[]) ?? []) {
      if (prop.image_url) mediaUrls.push(prop.image_url);
    }

    const jsonStr = JSON.stringify(data, null, 2);
    const jsonBase64 = Buffer.from(jsonStr, "utf-8").toString("base64");

    return {
      success: true as const,
      data: {
        jsonBase64,
        jsonSize: jsonStr.length,
        mediaUrls,
        filename: `habico-backup-${companyId}-${Date.now()}`,
      },
    };
  });
