import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, MessageSquare, Send, CheckCheck, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/rental-messages")({
  head: () => ({ meta: [{ title: "Rental Messages — Habico Portal" }] }),
  component: RentalMessagesPage,
});

function RentalMessagesPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [newTenantId, setNewTenantId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["rental_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_messages")
        .select("*, tenants:tenant_id(full_name, phone)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const rootMessages = messages.filter((m: any) => !m.parent_id);

  const threadMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const root of rootMessages) {
      const thread: any[] = [root];
      function collect(pid: string) {
        for (const m of messages) {
          if (m.parent_id === pid) {
            thread.push(m);
            collect(m.id);
          }
        }
      }
      collect(root.id);
      thread.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      map.set(root.id, thread);
    }
    return map;
  }, [messages]);

  const conversationStats = useMemo(() => {
    const stats = new Map<string, { lastDate: string; unread: number }>();
    for (const [rootId, thread] of threadMap) {
      const lastMsg = thread[thread.length - 1];
      const unread = thread.filter((m: any) => m.sender === "tenant" && !m.is_read).length;
      stats.set(rootId, { lastDate: lastMsg?.created_at, unread });
    }
    return stats;
  }, [threadMap]);

  const totalConversations = rootMessages.length;
  const unreadMessages = messages.filter((m: any) => m.sender === "tenant" && !m.is_read).length;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const sentThisWeek = messages.filter((m: any) => {
    if (m.sender !== "manager") return false;
    return new Date(m.created_at) >= startOfWeek;
  }).length;

  const filteredConversations = rootMessages.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = c.tenants?.full_name?.toLowerCase() || "";
    return name.includes(q) || c.subject?.toLowerCase().includes(q);
  });

  const selectedConversation = selectedConversationId
    ? messages.find((m: any) => m.id === selectedConversationId) || null
    : null;

  const threadMessages = selectedConversationId ? threadMap.get(selectedConversationId) || [] : [];

  const markRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      const { error } = await supabase
        .from("rental_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", messageIds);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rental_messages"] }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rental_messages").insert({
        tenant_id: newTenantId,
        subject: newSubject,
        message: newMessage,
        sender: "manager",
        parent_id: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rental_messages"] });
      setNewDialogOpen(false);
      setNewTenantId("");
      setNewSubject("");
      setNewMessage("");
      toast.success("Message sent");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId || !replyText.trim()) return;
      const conv = messages.find((m: any) => m.id === selectedConversationId) as any;
      const { error } = await supabase.from("rental_messages").insert({
        tenant_id: conv.tenant_id,
        subject: conv.subject,
        message: replyText.trim(),
        sender: "manager",
        parent_id: selectedConversationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rental_messages"] });
      setReplyText("");
      toast.success("Reply sent");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function handleSelectConversation(convId: string) {
    setSelectedConversationId(convId);
    const thread = threadMap.get(convId) || [];
    const unreadIds = thread.filter((m: any) => m.sender === "tenant" && !m.is_read).map((m: any) => m.id);
    if (unreadIds.length > 0) markRead.mutate(unreadIds);
  }

  function handleSendReply() {
    if (!replyText.trim() || !selectedConversationId) return;
    replyMutation.mutate();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  }

  function handleCreate() {
    if (!newTenantId || !newSubject.trim() || !newMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate();
  }

  if (!isStaff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/rental-messages" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Communication</div>
          <h1 className="display text-3xl font-bold">Rental Messages</h1>
        </div>
        <Dialog open={newDialogOpen} onOpenChange={(o) => { setNewDialogOpen(o); if (!o) { setNewTenantId(""); setNewSubject(""); setNewMessage(""); } }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Recipient</h3></div>
                <div className="space-y-2">
                  <Label>Tenant *</Label>
                  <SearchableSelect
                    value={newTenantId}
                    onValueChange={setNewTenantId}
                    placeholder="Select tenant"
                    options={tenants.map((t: any) => ({ value: t.id, label: t.full_name }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">The tenant who will receive this message.</p>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Subject</h3></div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Rent Reminder, Maintenance Update, Lease Renewal" />
                  <p className="mt-1 text-xs text-muted-foreground">Clear, concise subject line so the tenant knows the purpose.</p>
                </div>
              </div>
              <div>
                <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Message</h3></div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea rows={5} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message here. Be clear and professional in your communication with tenants." />
                  <p className="mt-1 text-xs text-muted-foreground">Messages are visible in the tenant's portal and as a permanent record.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unreadMessages}</div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent This Week</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sentThisWeek}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by tenant name or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="shadow-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-24rem)] overflow-y-auto divide-y divide-border">
                {filteredConversations.map((conv: any) => {
                  const stats = conversationStats.get(conv.id);
                  const unread = stats?.unread || 0;
                  const isSelected = selectedConversationId === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 ${isSelected ? "bg-muted border-l-2 border-l-accent" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{conv.tenants?.full_name || "Unknown"}</span>
                            {unread > 0 && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title={`${unread} unread`} />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {stats?.lastDate ? new Date(stats.lastDate).toLocaleDateString() : new Date(conv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card flex flex-col">
          {!selectedConversation ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <CardHeader className="border-b border-border pb-3 shrink-0">
                <CardTitle className="text-base">{selectedConversation.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.tenants?.full_name || "Unknown"}
                </p>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-32rem)]">
                {threadMessages.map((msg: any) => {
                  const isManager = msg.sender === "manager";
                  return (
                    <div key={msg.id} className={`flex ${isManager ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isManager
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isManager ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[10px] ${isManager ? "text-blue-100" : "text-muted-foreground"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isManager && msg.is_read && (
                            <CheckCheck className="h-3 w-3 text-blue-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>

              <div className="border-t border-border p-4 shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a reply... (Enter to send, Shift+Enter for newline)"
                    className="flex-1 resize-none"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
