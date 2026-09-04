// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function useAppNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["app-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("app_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as AppNotification[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("app-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "app_notifications", filter: `user_id=eq.${user.id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["app-notifications", user.id] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("app_notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-notifications", user?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-notifications", user?.id] }),
  });

  return { notifications, unreadCount, unread, read, markRead, markAllRead };
}
