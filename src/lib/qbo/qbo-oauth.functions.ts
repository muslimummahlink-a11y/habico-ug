import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getQboAuthUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getQboAuthUrl } = await import("./client");
    const state = crypto.randomUUID();
    return { url: getQboAuthUrl(state), state };
  });

export const exchangeQboCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { code: string; realmId: string; companyId: string }) => z.object({
    code: z.string(), realmId: z.string(), companyId: z.string(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { exchangeCodeForTokens } = await import("./client");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tokens = await exchangeCodeForTokens(data.code, data.realmId);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("company_qbo_tokens")
      .upsert({
        company_id: data.companyId,
        realm_id: tokens.realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_at: expiresAt,
      }, { onConflict: "company_id" });

    if (error) throw new Error(`Failed to save QBO tokens: ${error.message}`);
    return { success: true };
  });

export const disconnectQbo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("company_qbo_tokens")
      .delete()
      .eq("company_id", data.companyId);
    if (error) throw new Error(`Failed to disconnect QBO: ${error.message}`);
    return { success: true };
  });

export const getQboStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tokens } = await supabaseAdmin
      .from("company_qbo_tokens")
      .select("id, realm_id, connected_at, last_sync_at, expires_at")
      .eq("company_id", data.companyId)
      .maybeSingle();
    return { connected: !!tokens, tokens };
  });

export const refreshQboToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { companyId: string }) => z.object({ companyId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tokens } = await supabaseAdmin
      .from("company_qbo_tokens")
      .select("*")
      .eq("company_id", data.companyId)
      .single();
    if (!tokens) throw new Error("No QBO connection found");

    const { refreshAccessToken } = await import("./client");
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from("company_qbo_tokens")
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: expiresAt,
      })
      .eq("id", tokens.id);

    if (error) throw new Error(`Failed to refresh QBO token: ${error.message}`);
    return { success: true };
  });
