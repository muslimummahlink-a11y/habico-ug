// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";

export const sendAppointmentReminder = createServerFn({ method: "POST" })
  .inputValidator((input: { appointmentId: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", data.appointmentId)
      .single();
    if (error || !appointment) return { success: false as const, error: error?.message || "Appointment not found" };

    const recipients = [appointment.organizer_email, appointment.party_one_email, appointment.party_two_email]
      .filter(Boolean)
      .filter((email, index, list) => list.indexOf(email) === index);
    const { sendAppointmentReminderEmail } = await import("@/lib/email.server");
    try {
      await sendAppointmentReminderEmail({
        to: recipients,
        title: appointment.title,
        startsAt: appointment.starts_at,
        location: appointment.location,
        agenda: appointment.agenda,
      });
      await supabaseAdmin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", appointment.id);
      return { success: true as const };
    } catch (err) {
      return { success: false as const, error: (err as Error).message };
    }
  });