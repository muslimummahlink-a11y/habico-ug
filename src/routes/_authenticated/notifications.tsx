import { createFileRoute } from "@tanstack/react-router";
import { useAppNotifications } from "@/hooks/use-app-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Habico Portal" }] }),
  component: NotificationsPage,
});

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors: Record<string, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
  error: "text-red-500",
};

function NotificationsPage() {
  const { notifications, unread, read, unreadCount, markRead, markAllRead } = useAppNotifications();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Activity Feed</p>
          <h1 className="display text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : notifications.length > 0
                ? "All caught up"
                : "No notifications yet"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />Mark all read
          </Button>
        )}
      </div>

      {unread.length > 0 && (
        <Card className="shadow-card border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Unread
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unread.map((n) => {
              const Icon = typeIcons[n.type] ?? Info;
              return (
                <div key={n.id} className="flex items-start justify-between rounded-lg border border-border p-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Icon className={`mt-1 h-4 w-4 shrink-0 ${typeColors[n.type] ?? "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{n.title}</p>
                      {n.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => markRead.mutate(n.id)}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {read.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-5 w-5" />
              Previously Read
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {read.slice(0, 30).map((n) => {
              const Icon = typeIcons[n.type] ?? Info;
              return (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3 opacity-60">
                  <Icon className={`mt-1 h-4 w-4 shrink-0 ${typeColors[n.type] ?? "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{n.title}</p>
                    {n.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            No notifications yet. System activity alerts will appear here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
