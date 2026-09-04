// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialogDescription } from "@/components/ui/alert-dialog";
import { EntityCardGrid } from "@/components/entity-card-grid";
import { Plus, CreditCard, Download, RotateCcw, AlertTriangle, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RentalCardFront, RentalCardBack, CARD_WIDTH_PX, CARD_HEIGHT_PX, type RentalCardData } from "@/components/rental-id-card";
import { exportCardSides } from "@/lib/export-id-card";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/rental-id-cards")({
  head: () => ({ meta: [{ title: "Rental ID Cards — Habico Portal" }] }),
  component: RentalIdCardsPage,
});

function generateCardNumber() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `HBC-${code.slice(0, 4)}-${code.slice(4)}`;
}

function toCardData(c: any): RentalCardData {
  const t = c.tenants;
  const u = c.units;
  const l = c.lease;
  return {
    cardNumber: c.card_number,
    propertyName: u?.properties?.name ?? "Habico Property",
    propertyLocation: u?.properties?.location ?? null,
    unitNumber: u?.unit_number ?? "—",
    floorNumber: u?.floor_number ?? null,
    monthlyRent: l?.monthly_rent ?? u?.monthly_rent ?? null,
    tenantName: t?.full_name ?? null,
    tenantPhone: t?.phone ?? null,
    tenantEmail: t?.email ?? null,
    idType: t?.id_type ?? null,
    idNumber: t?.id_number ?? null,
    emergencyContact: t?.emergency_contact_name ?? null,
    emergencyPhone: t?.emergency_contact_phone ?? null,
    occupation: t?.occupation ?? null,
    employer: t?.employer ?? null,
    leaseStart: l?.start_date ?? null,
    leaseEnd: l?.end_date ?? null,
    arrears: l?.outstanding_balance ?? null,
    issuedAt: c.issued_at,
    status: c.status,
  };
}

function RentalIdCardsPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [cardNumber, setCardNumber] = useState(generateCardNumber());
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [previewCard, setPreviewCard] = useState<any>(null);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["rental_id_cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_id_cards")
        .select("*, units!inner(id, unit_number, floor_number, monthly_rent, properties!inner(id, name, location)), tenants!left(id, full_name, phone, email, id_type, id_number, emergency_contact_name, emergency_contact_phone, occupation, employer)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const cards = (data ?? []) as any[];

      const { data: allLeases } = await supabase
        .from("leases")
        .select("id, tenant_id, unit_id, monthly_rent, outstanding_balance, start_date, end_date")
        .eq("status", "active");
      const leasesByUnit = new Map((allLeases ?? []).map((l: any) => [l.unit_id, l]));
      const leasesByTenant = new Map((allLeases ?? []).map((l: any) => [l.tenant_id, l]));

      const cardTenantIds = cards.map((c: any) => c.tenant_id).filter(Boolean);
      const fallbackTenantIds = cards
        .filter((c: any) => !c.tenant_id)
        .map((c: any) => leasesByUnit.get(c.unit_id)?.tenant_id)
        .filter(Boolean);
      const allTenantIds = [...new Set([...cardTenantIds, ...fallbackTenantIds])];

      let tenantMap = new Map<string, any>();
      if (allTenantIds.length > 0) {
        const { data: tenantRows } = await supabase
          .from("tenants")
          .select("id, full_name, phone, email, id_type, id_number, emergency_contact_name, emergency_contact_phone, occupation, employer")
          .in("id", allTenantIds);
        for (const t of tenantRows ?? []) tenantMap.set(t.id, t);
      }

      return cards.map((c: any) => {
        const tenant = c.tenants ?? (c.tenant_id ? tenantMap.get(c.tenant_id) : null) ?? (leasesByUnit.get(c.unit_id) ? tenantMap.get(leasesByUnit.get(c.unit_id).tenant_id) : null);
        const lease = leasesByTenant.get(tenant?.id) ?? leasesByUnit.get(c.unit_id) ?? null;
        return { ...c, tenants: tenant, lease };
      });
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units-available-cards"],
    queryFn: async () => {
      const { data: activeCardUnitIds } = await supabase
        .from("rental_id_cards")
        .select("unit_id")
        .eq("status", "active");
      const occupiedIds = new Set((activeCardUnitIds ?? []).map((c: any) => c.unit_id));
      const { data } = await supabase
        .from("units")
        .select("id, unit_number, floor_number, monthly_rent, properties(id, name, location)")
        .order("unit_number");
      return ((data ?? []) as any).map((u: any) => ({
        ...u,
        hasActiveCard: occupiedIds.has(u.id),
      }));
    },
    enabled: isStaff,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants-for-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, full_name, phone, email, id_type, id_number, emergency_contact_name, emergency_contact_phone, occupation, employer")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as any;
    },
    enabled: isStaff,
  });

  const { data: activeLeases = [] } = useQuery({
    queryKey: ["active-leases-for-cards"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leases")
        .select("unit_id, tenant_id")
        .eq("status", "active");
      return (data ?? []) as any;
    },
    enabled: isStaff,
  });

  const leaseUnitMap = new Map(activeLeases.map((l: any) => [l.unit_id, l.tenant_id]));

  useEffect(() => {
    if (selectedUnit) {
      const tid = leaseUnitMap.get(selectedUnit);
      if (tid && tenants.some((t: any) => t.id === tid)) {
        setSelectedTenant(tid as string);
      }
    } else {
      setSelectedTenant("");
    }
  }, [selectedUnit, activeLeases, tenants]);

  const total = cards.length;
  const activeCount = cards.filter((c: any) => c.status === "active").length;
  const lostCount = cards.filter((c: any) => c.status === "lost").length;
  const returnedCount = cards.filter((c: any) => c.status === "returned").length;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("rental_id_cards").insert({
        unit_id: selectedUnit,
        tenant_id: selectedTenant || null,
        card_number: cardNumber,
        status: "active",
        issued_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rental_id_cards"] });
      toast.success("ID card issued");
      setCreateOpen(false);
      setSelectedUnit("");
      setSelectedTenant("");
      setCardNumber(generateCardNumber());
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const payload: any = { status };
      if (status === "lost") payload.lost_reason = reason ?? null;
      if (status === "active") payload.lost_reason = null;
      const { error } = await supabase.from("rental_id_cards").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rental_id_cards"] });
      toast.success("Card status updated");
      setLostDialogOpen(false);
      setLostReason("");
      setSelectedCard(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function handleCreate() {
    if (!selectedUnit) { toast.error("Please select a unit"); return; }
    createMutation.mutate();
  }

  function openLostDialog(card: any) {
    setSelectedCard(card);
    setLostReason("");
    setLostDialogOpen(true);
  }

  function confirmLost() {
    if (!selectedCard || !lostReason.trim()) { toast.error("Please provide a reason"); return; }
    statusMutation.mutate({ id: selectedCard.id, status: "lost", reason: lostReason.trim() });
  }

  function statusBadge(status: string) {
    const cls = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800",
      lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200 dark:border-red-800",
      returned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700",
    }[status] ?? "bg-secondary text-secondary-foreground";
    return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });
  }

  async function handleExport(card: any) {
    setPreviewCard(card);
    // Wait a tick for the hidden render to mount.
    await new Promise((r) => setTimeout(r, 100));
    try {
      await exportCardSides({
        frontNode: frontRef.current,
        backNode: backRef.current,
        cardNumber: card.card_number,
        tenantName: card.tenants?.full_name,
        unitNumber: card.units?.unit_number,
      });
      toast.success("Downloaded front + back PNGs");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!isStaff) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const previewUnit = units.find((u: any) => u.id === selectedUnit) as any;
  const previewTenant = tenants.find((t: any) => t.id === selectedTenant) as any;
  const previewData: RentalCardData | null = selectedUnit
    ? {
        cardNumber,
        propertyName: previewUnit?.properties?.name ?? "Habico Property",
        propertyLocation: previewUnit?.properties?.location ?? null,
        unitNumber: previewUnit?.unit_number ?? "—",
        floorNumber: previewUnit?.floor_number ?? null,
        monthlyRent: previewUnit?.monthly_rent ?? null,
        tenantName: previewTenant?.full_name ?? null,
        tenantPhone: previewTenant?.phone ?? null,
        tenantEmail: previewTenant?.email ?? null,
        idType: previewTenant?.id_type ?? null,
        idNumber: previewTenant?.id_number ?? null,
        emergencyContact: previewTenant?.emergency_contact_name ?? null,
        emergencyPhone: previewTenant?.emergency_contact_phone ?? null,
        occupation: previewTenant?.occupation ?? null,
        employer: previewTenant?.employer ?? null,
        issuedAt: new Date().toISOString(),
        status: "active",
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/rental-id-cards" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Management</div>
          <h1 className="display text-3xl font-bold">Rental ID Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Premium scannable ID cards. The QR routes to a MoMo / Airtel payment session for the unit.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { setSelectedUnit(""); setSelectedTenant(""); setCardNumber(generateCardNumber()); } }}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />Issue New Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Issue New ID Card</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Assignment</h3></div>
                  <div className="space-y-2">
                    <Label>Unit *</Label>
                    <SearchableSelect
                      value={selectedUnit}
                      onValueChange={setSelectedUnit}
                      placeholder="Select unit…"
                      options={units.map((u: any) => ({ value: u.id, label: `${u.properties?.name} · Unit ${u.unit_number}${u.hasActiveCard ? " (has active card)" : ""}` }))}
                    />
                  </div>
                  <div className="mt-3 space-y-2">
                    <Label>Tenant (optional)</Label>
                    <SearchableSelect
                      value={selectedTenant}
                      onValueChange={setSelectedTenant}
                      placeholder="Assign to a tenant…"
                      options={tenants.map((t: any) => ({ value: t.id, label: `${t.full_name}${t.phone ? ` · ${t.phone}` : ""}` }))}
                    />
                    <p className="text-xs text-muted-foreground">Assigning a tenant lets them see the card in their portal.</p>
                  </div>
                </div>
                <div>
                  <div className="border-b pb-2 mb-4"><h3 className="text-sm font-semibold">Card Number</h3></div>
                  <div className="flex gap-2">
                    <Input value={cardNumber} readOnly className="font-mono" />
                    <Button variant="outline" onClick={() => setCardNumber(generateCardNumber())}>Regenerate</Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live preview</div>
                {previewData ? (
                  <div className="space-y-3">
                    <ScaledCard><RentalCardFront data={previewData} /></ScaledCard>
                    <ScaledCard><RentalCardBack data={previewData} /></ScaledCard>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl border-2 border-dashed text-sm text-muted-foreground">
                    Select a unit to see the card preview
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!selectedUnit || createMutation.isPending}>
                {createMutation.isPending ? "Issuing…" : "Issue Card"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Cards" value={total} icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} />
        <StatCard label="Active" value={activeCount} icon={<div className="h-2 w-2 rounded-full bg-green-500" />} tone="text-green-600 dark:text-green-400" />
        <StatCard label="Lost" value={lostCount} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} tone="text-destructive" />
        <StatCard label="Returned" value={returnedCount} icon={<div className="h-2 w-2 rounded-full bg-muted-foreground" />} tone="text-muted-foreground" />
      </div>

      <EntityCardGrid
        data={cards}
        isLoading={isLoading}
        searchFields={["card_number", "property", "unit", "tenant"]}
        filterField="status"
        filterOptions={[
          { label: "Active", value: "active" },
          { label: "Lost", value: "lost" },
          { label: "Returned", value: "returned" },
        ]}
        keyExtractor={(item) => item.id}
        titleField="card_number"
        subtitleField="property"
        statusField="status"
        metricFields={[
          { key: "tenant", label: "Tenant" },
          { key: "issued_at", label: "Issued", format: "date" },
        ]}
        emptyMessage="No ID cards yet"
        cardActions={(c) => (
          <>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPreviewCard(c)} title="Preview">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleExport(c)} title="Export PNG">
              <Download className="h-3 w-3" />
            </Button>
            {c.status === "active" && (
              <>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => openLostDialog(c)} title="Mark as lost">
                  <AlertTriangle className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => statusMutation.mutate({ id: c.id, status: "returned" })} title="Mark as returned">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </>
            )}
            {(c.status === "lost" || c.status === "returned") && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => statusMutation.mutate({ id: c.id, status: "active" })} title="Reactivate">
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      />

      {/* Lost dialog */}
      <Dialog open={lostDialogOpen} onOpenChange={(o) => { setLostDialogOpen(o); if (!o) { setSelectedCard(null); setLostReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Card as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <AlertDialogDescription className="text-sm">
              {selectedCard && <>Marking card <strong>{selectedCard.card_number}</strong> as lost. This deactivates it for payments.</>}
            </AlertDialogDescription>
            <div className="space-y-2">
              <Label>Reason for Loss *</Label>
              <Input value={lostReason} onChange={(e: any) => setLostReason(e.target.value)} placeholder="e.g. Tenant reported lost, stolen…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setLostDialogOpen(false); }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmLost} disabled={!lostReason.trim() || statusMutation.isPending}>
              {statusMutation.isPending ? "Updating…" : "Mark as Lost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewCard} onOpenChange={(o) => { if (!o) setPreviewCard(null); }}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>ID Card · {previewCard?.card_number}</DialogTitle>
          </DialogHeader>
          {previewCard && (
            <div className="space-y-4">
              <ScaledCard><RentalCardFront data={toCardData(previewCard)} /></ScaledCard>
              <ScaledCard><RentalCardBack data={toCardData(previewCard)} /></ScaledCard>
              <div className="flex justify-end">
                <Button onClick={() => handleExport(previewCard)}>
                  <Download className="mr-2 h-4 w-4" />Download front + back PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Offscreen full-resolution render used for export */}
      {previewCard && (
        <div style={{ position: "fixed", top: 0, left: -9999, opacity: 0, pointerEvents: "none" }} aria-hidden>
          <RentalCardFront ref={frontRef} data={toCardData(previewCard)} />
          <div style={{ height: 20 }} />
          <RentalCardBack ref={backRef} data={toCardData(previewCard)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: string }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export function ScaledCard({ children, scale = 0.45 }: { children: React.ReactNode; scale?: number }) {
  return (
    <div
      style={{
        width: CARD_WIDTH_PX * scale,
        height: CARD_HEIGHT_PX * scale,
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: CARD_WIDTH_PX,
          height: CARD_HEIGHT_PX,
        }}
      >
        {children}
      </div>
    </div>
  );
}
