import { createServerFn } from "@tanstack/react-start";

export const verifyRegistrationPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { pendingId: string; transactionId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch pending registration
    const { data: pending, error: fetchError } = await (supabaseAdmin as any)
      .from("pending_registrations")
      .select("*")
      .eq("id", data.pendingId)
      .single();

    if (fetchError || !pending) return { success: false as const, error: "Pending registration not found" };
    if (pending.status !== "pending") return { success: false as const, error: "Registration already verified or rejected" };

    // Fetch plan name
    let planName = "";
    if (pending.plan_id) {
      const { data: plan } = await (supabaseAdmin as any).from("subscription_plans").select("name").eq("id", pending.plan_id).single();
      if (plan) planName = plan.name;
    }

    // Match the TID
    if (pending.transaction_id !== data.transactionId.trim()) {
      return { success: false as const, error: "Transaction ID does not match. Double-check the TID from your payment confirmation." };
    }

    // Create the company
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const licenseKey = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: pending.company_name,
        email: pending.company_email || null,
        phone: pending.company_phone || null,
        address: pending.company_address || null,
        license_key: licenseKey,
        plan_id: pending.plan_id || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (companyError) return { success: false as const, error: companyError.message };
    if (!company) return { success: false as const, error: "Failed to create company" };

    // Create the auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: pending.admin_email,
      password: pending.admin_password,
      email_confirm: true,
      user_metadata: { full_name: pending.admin_name },
    });

    if (authError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return { success: false as const, error: authError.message };
    }

    const userId = authUser.user.id;

    // Update profile with company_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ company_id: company.id, full_name: pending.admin_name })
      .eq("id", userId);

    if (profileError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return { success: false as const, error: profileError.message };
    }

    // Assign roles
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert([
        { user_id: userId, role: "admin" },
        { user_id: userId, role: "manager" },
      ]);

    if (roleError) {
      return { success: false as const, error: roleError.message };
    }

    // Record payment
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        amount: pending.amount,
        method: "mobile_money",
        payment_type: "registration",
        payment_date: new Date().toISOString().slice(0, 10),
      });

    if (paymentError) console.error("Failed to record registration payment", paymentError);

    // Mark pending as verified
    await (supabaseAdmin as any).from("pending_registrations").update({
      status: "verified",
    }).eq("id", data.pendingId);

    // Send license key email (must await — Vercel kills dangling promises after response)
    const { sendLicenseKeyEmail } = await import("@/lib/email.server");
    try {
      await sendLicenseKeyEmail({
        to: pending.admin_email,
        companyName: pending.company_name,
        licenseKey,
        adminName: pending.admin_name,
        adminEmail: pending.admin_email,
        planName,
        amount: Number(pending.amount),
        paymentDate: new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" }),
      });
    } catch (e) {
      console.error("Failed to send license email", e);
    }

    return { success: true as const, licenseKey, companyId: company.id, userId };
  });
