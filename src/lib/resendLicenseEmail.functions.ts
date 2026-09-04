import { createServerFn } from "@tanstack/react-start";

export const resendLicenseEmail = createServerFn({ method: "POST" })
  .inputValidator((input: { companyId?: string; adminEmail?: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let profile;
    if (data.adminEmail) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, company_id")
        .eq("email", data.adminEmail)
        .maybeSingle();
      profile = p;
    } else if (data.companyId) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, company_id")
        .eq("company_id", data.companyId)
        .maybeSingle();
      profile = p;
    }

    if (!profile) return { success: false as const, error: "No profile found" };
    if (!profile.company_id) return { success: false as const, error: "Profile has no company" };
    if (!profile.email) return { success: false as const, error: "Profile has no email" };

    const { data: company, error: companyErr } = await supabaseAdmin
      .from("companies")
      .select("id, name, license_key, plan_id")
      .eq("id", profile.company_id)
      .single();

    if (companyErr || !company) return { success: false as const, error: "Company not found" };

    let planName = "";
    if (company.plan_id) {
      const { data: plan } = await supabaseAdmin.from("subscription_plans").select("name").eq("id", company.plan_id).single();
      if (plan) planName = plan.name;
    }

    const { sendLicenseKeyEmail } = await import("@/lib/email.server");
    try {
      await sendLicenseKeyEmail({
        to: profile.email,
        companyName: company.name,
        licenseKey: company.license_key ?? "",
        adminName: profile.full_name ?? profile.email!,
        adminEmail: profile.email!,
        planName,
      });
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }

    return { success: true as const };
  });
