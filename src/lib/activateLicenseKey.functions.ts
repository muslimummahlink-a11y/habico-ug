import { createServerFn } from "@tanstack/react-start";

export const activateLicenseKey = createServerFn({ method: "POST" })
  .inputValidator((input: {
    licenseKey: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    adminPhone: string;
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Validate license key
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, name, is_active")
      .eq("license_key", data.licenseKey.trim())
      .maybeSingle();

    if (companyError || !company) {
      return { success: false as const, message: "Invalid license key" };
    }

    if (!company.is_active) {
      return { success: false as const, message: "This license is inactive" };
    }

    // Check for existing admin
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("company_id", company.id);

    const existingIds = existingProfiles?.map((p) => p.id) ?? [];
    if (existingIds.length > 0) {
      const { data: existingRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .in("user_id", existingIds);
      if ((existingRoles?.length ?? 0) > 0) {
        return { success: false as const, message: "An admin account already exists for this company" };
      }
    }

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: data.adminName },
    });

    if (authError) {
      return { success: false as const, message: authError.message };
    }

    const userId = authUser.user.id;

    // Update profile with company_id and full_name
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ company_id: company.id, full_name: data.adminName })
      .eq("id", userId);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false as const, message: profileError.message };
    }

    // Assign admin + manager roles
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert([
        { user_id: userId, role: "admin" },
        { user_id: userId, role: "manager" },
      ]);

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      return { success: false as const, message: roleError.message };
    }

    // Send welcome email (must await — Vercel kills dangling promises after response)
    const { sendLicenseKeyEmail } = await import("@/lib/email.server");
    try {
      await sendLicenseKeyEmail({
        to: data.adminEmail,
        companyName: company.name,
        licenseKey: data.licenseKey.trim(),
        adminName: data.adminName,
        adminEmail: data.adminEmail,
        planName: "your selected plan",
      });
    } catch (e) {
      console.error("Failed to send license activation email", e);
    }

    return { success: true as const, companyId: company.id, companyName: company.name };
  });
