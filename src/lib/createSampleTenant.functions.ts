import { createServerFn } from "@tanstack/react-start";

export const createSampleTenant = createServerFn({ method: "POST" })
  .inputValidator((input: {
    companyId: string;
    propertyName?: string;
    unitNumber?: string;
    tenantName?: string;
    tenantEmail?: string;
    monthlyRent?: number;
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const tenantEmail = data.tenantEmail ?? `tenant${Date.now()}@example.com`;
    const tenantPassword = "Test1234";
    const tenantName = data.tenantName ?? "Sample Tenant";

    // Create auth user
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: tenantEmail,
      password: tenantPassword,
      email_confirm: true,
      user_metadata: { full_name: tenantName },
    });
    if (authErr) return { success: false as const, error: authErr.message };

    // Create or find property
    const propName = data.propertyName ?? `${data.companyId.slice(0, 8)} Property`;
    let propertyId: string;
    const { data: existingProp } = await supabaseAdmin
      .from("properties")
      .select("id")
      .eq("name", propName)
      .maybeSingle();
    if (existingProp) {
      propertyId = existingProp.id;
    } else {
      const { data: newProp, error: propErr } = await supabaseAdmin
        .from("properties")
        .insert({ name: propName, address: "Sample Address, Kampala" })
        .select("id")
        .single();
      if (propErr) return { success: false as const, error: propErr.message };
      propertyId = newProp.id;
    }

    // Create or find unit
    const unitNum = data.unitNumber ?? "A1";
    const { data: existingUnit } = await supabaseAdmin
      .from("units")
      .select("id")
      .eq("property_id", propertyId)
      .eq("unit_number", unitNum)
      .maybeSingle();
    let unitId: string;
    if (existingUnit) {
      unitId = existingUnit.id;
    } else {
      const { data: newUnit, error: unitErr } = await supabaseAdmin
        .from("units")
        .insert({ property_id: propertyId, unit_number: unitNum, monthly_rent: data.monthlyRent ?? 500000, status: "occupied" })
        .select("id")
        .single();
      if (unitErr) return { success: false as const, error: unitErr.message };
      unitId = newUnit.id;
    }

    // Create lease
    const { error: leaseErr } = await supabaseAdmin
      .from("leases")
      .insert({
        unit_id: unitId,
        tenant_id: authUser.user.id,
        start_date: new Date().toISOString().slice(0, 10),
        monthly_rent: data.monthlyRent ?? 500000,
        deposit: data.monthlyRent ?? 500000,
        status: "active",
      });
    if (leaseErr) return { success: false as const, error: leaseErr.message };

    // Assign tenant role (supabase already creates profile+tenant role via trigger,
    // but ensure tenant role is set correctly)
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: authUser.user.id, role: "tenant" }, { onConflict: "user_id, role", ignoreDuplicates: true });

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: tenantName, phone: "+256700000000" })
      .eq("id", authUser.user.id);

    return {
      success: true as const,
      tenant: { email: tenantEmail, password: tenantPassword, name: tenantName },
      property: { id: propertyId, name: propName },
      unit: { id: unitId, number: unitNum },
    };
  });
