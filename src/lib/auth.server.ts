import { createServerFn } from "@tanstack/react-start";

export const tenantCardLogin = createServerFn({ method: "POST" })
  .inputValidator((input: {
    card_number: string;
    unit_number: string;
    access_pin: string;
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: card } = await supabaseAdmin
      .from("rental_id_cards")
      .select("*, units!inner(unit_number), tenants!inner(id, email, access_pin, auth_user_id)")
      .eq("card_number", data.card_number.trim())
      .single();

    if (!card) return { success: false as const, error: "Card not found" };
    if (card.status !== "active") return { success: false as const, error: `Card is ${card.status}` };
    if (card.units?.unit_number !== data.unit_number.trim()) return { success: false as const, error: "Card does not match this unit" };
    if (card.tenants?.access_pin !== data.access_pin.trim()) return { success: false as const, error: "Incorrect PIN" };
    if (!card.tenants?.email) return { success: false as const, error: "No email on file. Contact your property manager." };

    const email = card.tenants.email;
    const redirectTo = process.env.VITE_APP_URL || "https://habico-ug.vercel.app/dashboard";

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError) {
      if (linkError.message?.includes("User not found")) {
        const { data: signupData, error: signupError } = await supabaseAdmin.auth.admin.generateLink({
          type: "invite",
          email,
          options: { redirectTo },
        });
        if (signupError) return { success: false as const, error: signupError.message };
        return { success: true as const, url: signupData.properties.action_link };
      }
      return { success: false as const, error: linkError.message };
    }

    return { success: true as const, url: linkData.properties.action_link };
  });
