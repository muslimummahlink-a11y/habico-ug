// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppNotifications } from "@/hooks/use-app-notifications";

export function NotificationBell() {
  const { unreadCount, unread, markRead } = useAppNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-accent hover:underline"
                onClick={() => nav("/notifications")}
              >
                View all
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {unread.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">No new notifications</p>
            ) : (
              unread.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                  onClick={() => {
                    markRead.mutate(n.id);
                    setOpen(false);
                    if (n.link) nav(n.link);
                  }}
                >
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{n.title}</p>
                    {n.description && (
                      <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          {unread.length > 0 && (
            <div className="border-t px-3 py-1.5 text-center">
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => nav("/notifications")}
              >
                See all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
