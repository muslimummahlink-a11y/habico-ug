import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function getQboTokens(supabaseAdmin: any, companyId: string) {
  const { data: tokens } = await supabaseAdmin
    .from("company_qbo_tokens")
    .select("*")
    .eq("company_id", companyId)
    .single();
  if (!tokens) throw new Error("QuickBooks is not connected");
  const now = Date.now();
  const expires = new Date(tokens.expires_at).getTime();
  if (now >= expires - 60000) {
    const { refreshAccessToken } = await import("./client");
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    await supabaseAdmin
      .from("company_qbo_tokens")
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      })
      .eq("id", tokens.id);
    return { realmId: tokens.realm_id, accessToken: newTokens.access_token };
  }
  return { realmId: tokens.realm_id, accessToken: tokens.access_token };
}

async function logSync(
  supabaseAdmin: any,
  companyId: string,
  syncType: string,
  result: any
) {
  await supabaseAdmin.from("qbo_sync_log").insert({
    company_id: companyId,
    sync_type: syncType,
    status: result.success ? "completed" : "failed",
    records_processed: result.records_processed ?? 0,
    records_created: result.records_created ?? 0,
    records_updated: result.records_updated ?? 0,
    records_failed: result.records_failed ?? 0,
    error_message: result.error_message,
    completed_at: new Date().toISOString(),
  });
}

export const syncQboCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { realmId, accessToken } = await getQboTokens(supabaseAdmin, data.companyId);
    const { syncCustomers } = await import("./sync");
    const result = await syncCustomers(realmId, accessToken, supabaseAdmin, data.companyId);
    await logSync(supabaseAdmin, data.companyId, "customers", result);
    return result;
  });

export const syncQboVendors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { realmId, accessToken } = await getQboTokens(supabaseAdmin, data.companyId);
    const { syncVendors } = await import("./sync");
    const result = await syncVendors(realmId, accessToken, supabaseAdmin, data.companyId);
    await logSync(supabaseAdmin, data.companyId, "vendors", result);
    return result;
  });

export const syncQboInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { realmId, accessToken } = await getQboTokens(supabaseAdmin, data.companyId);
    const { syncInvoices } = await import("./sync");
    const result = await syncInvoices(realmId, accessToken, supabaseAdmin, data.companyId);
    await logSync(supabaseAdmin, data.companyId, "invoices", result);
    return result;
  });

export const syncQboBills = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { realmId, accessToken } = await getQboTokens(supabaseAdmin, data.companyId);
    const { syncBills } = await import("./sync");
    const result = await syncBills(realmId, accessToken, supabaseAdmin, data.companyId);
    await logSync(supabaseAdmin, data.companyId, "bills", result);
    return result;
  });

export const syncQboFull = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { realmId, accessToken } = await getQboTokens(supabaseAdmin, data.companyId);
    const { runFullSync } = await import("./sync");
    const results = await runFullSync(realmId, accessToken, supabaseAdmin, data.companyId);

    for (const [type, result] of Object.entries(results)) {
      await logSync(supabaseAdmin, data.companyId, type as any, result);
    }

    await supabaseAdmin
      .from("company_qbo_tokens")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("company_id", data.companyId);

    return results;
  });
