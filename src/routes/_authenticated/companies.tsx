import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridDataCards, type GridCardField } from "@/components/data-grid-cards";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecordActions } from "@/hooks/use-record-actions";
import { Building2, Pencil, Mail, Phone, MapPin, Key, CreditCard, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({ meta: [{ title: "Companies — Habico Portal" }] }),
  component: CompaniesPage,
});

type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
};

type Company = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  license_key: string | null;
  is_active: boolean;
  plan_id: string | null;
  created_at: string;
};

type CompanyBranding = {
  id: string;
  company_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  document_footer: string | null;
  receipt_footer: string | null;
  company_name_override: string | null;
};

function CompaniesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = useHighestRole();
  const isAdmin = role === "admin" || role === "manager";
  const isStaff = role === "admin" || role === "manager";
  const { deleteMutation, editMutation, copyMutation } = useRecordActions({ table: "companies" });
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: currentProfile } = useQuery({
    queryKey: ["current-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      return data ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").order("sort_order");
      if (error && error.code !== "PGRST116" && !error.message?.includes("does not exist")) throw error;
      return (data ?? []) as SubscriptionPlan[];
    },
    retry: false,
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies", currentProfile?.company_id],
    queryFn: async () => {
      let query = supabase.from("companies").select("*").order("name");
      if (currentProfile?.company_id) {
        query = query.eq("id", currentProfile.company_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Company[];
    },
    enabled: !!isAdmin,
  });

  const { data: branding } = useQuery({
    queryKey: ["company-branding", selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return null;
      const { data, error } = await supabase
        .from("company_branding")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .single();
      if (error) throw error;
      return data as CompanyBranding;
    },
    enabled: !!selectedCompanyId && !!isAdmin,
  });

  const saveCompanyMutation = useMutation({
    mutationFn: async (vals: Partial<Company> & { id: string; name: string }) => {
      const { error } = await supabase.from("companies").update(vals).eq("id", vals.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated");
      setEditDialogOpen(false);
      setEditCompany(null);
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to save"),
  });

  const saveBrandingMutation = useMutation({
    mutationFn: async (vals: Partial<CompanyBranding> & { company_id: string }) => {
      const existing = await supabase.from("company_branding").select("id").eq("company_id", vals.company_id).single();
      if (existing.data) {
        const { error } = await supabase.from("company_branding").update(vals).eq("company_id", vals.company_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_branding").insert(vals);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-branding", selectedCompanyId] });
      toast.success("Branding saved");
      setBrandingDialogOpen(false);
    },
    onError: (err) => toast.error((err as any)?.message || "Failed to save branding"),
  });

  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", address: "", license_key: "", plan_id: "" });

  function openEdit(c: Company) {
    setEditForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", license_key: c.license_key ?? "", plan_id: c.plan_id ?? "" });
    setEditCompany(c);
    setEditDialogOpen(true);
  }

  function openBranding(companyId: string) {
    setSelectedCompanyId(companyId);
    setBrandingDialogOpen(true);
  }

  const fields: GridCardField<Company>[] = [
    {
      render: (c) => (
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold">{c.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {c.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      label: "Contact",
      render: (c) => (
        <div className="space-y-1 text-sm">
          {c.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {c.email}
            </div>
          )}
          {c.phone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {c.phone}
            </div>
          )}
          {c.address && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {c.address}
            </div>
          )}
          {!c.email && !c.phone && !c.address && (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      label: "Plan",
      render: (c) => (
        <div className="flex items-center gap-1.5 text-sm">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          {plans.find((p) => p.id === c.plan_id)?.name ?? <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      label: "License Key",
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <Key className="h-3.5 w-3.5 text-muted-foreground" />
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.license_key ?? "—"}</code>
        </div>
      ),
    },
  ];

  if (!isAdmin) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Licensed Companies</h1>
        <p className="text-sm text-muted-foreground">Property management companies licensed to use Habico Portal</p>
      </div>

      <GridDataCards
        data={companies}
        fields={fields}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        emptyMessage="No companies yet."
        emptyIcon={<Building2 className="h-10 w-10 text-muted-foreground" />}
        actions={(c) => isStaff ? (
          <RecordActions
            item={c}
            table="companies"
            onDeleteConfirm={() => deleteMutation.mutate(c.id)}
            onEdit={() => openEdit(c)}
            onCopy={() => copyMutation.mutate(c.id)}
          />
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => openBranding(c.id)}>
              <Globe className="h-4 w-4 mr-1" /> Branding
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </>
        )}
      />

      {/* Company Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div>
              <Label>Subscription Plan</Label>
              <Select value={editForm.plan_id} onValueChange={(v) => setEditForm({ ...editForm, plan_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a plan..." /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>License Key</Label>
              <Input value={editForm.license_key} onChange={(e) => setEditForm({ ...editForm, license_key: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { if (!editCompany) return; saveCompanyMutation.mutate({ id: editCompany.id, ...editForm, plan_id: editForm.plan_id || null, is_active: editCompany.is_active }); }} disabled={!editForm.name || saveCompanyMutation.isPending}>
                {saveCompanyMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branding Dialog */}
      <Dialog open={brandingDialogOpen} onOpenChange={setBrandingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Branding Settings</DialogTitle></DialogHeader>
          {branding && (
            <BrandingForm
              branding={branding}
              onSave={(vals) => saveBrandingMutation.mutate({ ...vals, company_id: selectedCompanyId! })}
              isPending={saveBrandingMutation.isPending}
              previewRef={previewRef}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandingForm({
  branding,
  onSave,
  isPending,
  previewRef,
}: {
  branding: CompanyBranding;
  onSave: (vals: Partial<CompanyBranding>) => void;
  isPending: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [logoUrl, setLogoUrl] = useState(branding.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color);
  const [accentColor, setAccentColor] = useState(branding.accent_color);
  const [docFooter, setDocFooter] = useState(branding.document_footer ?? "");
  const [recFooter, setRecFooter] = useState(branding.receipt_footer ?? "");
  const [nameOverride, setNameOverride] = useState(branding.company_name_override ?? "");

  async function downloadPreview() {
    if (!previewRef.current) return;
    try {
      const imgData = await toPng(previewRef.current, { backgroundColor: "#fff" });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (previewRef.current.scrollHeight * imgW) / previewRef.current.scrollWidth;
      pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH);
      pdf.save("branding-preview.pdf");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors">Colors & Logo</TabsTrigger>
          <TabsTrigger value="footer">Document Footers</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4 pt-4">
          <div>
            <Label>Logo URL</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="mt-1 flex gap-2">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="mt-1 flex gap-2">
                <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
                <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="mt-1 flex gap-2">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border" />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          </div>
          <div>
            <Label>Company Name Override (optional)</Label>
            <Input value={nameOverride} onChange={(e) => setNameOverride(e.target.value)} placeholder="Leave blank to use the company name" />
          </div>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4 pt-4">
          <div>
            <Label>Document Footer</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
              rows={3}
              value={docFooter}
              onChange={(e) => setDocFooter(e.target.value)}
              placeholder="Footer text for PDF documents (tenancy agreements, etc.)"
            />
          </div>
          <div>
            <Label>Receipt Footer</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
              rows={3}
              value={recFooter}
              onChange={(e) => setRecFooter(e.target.value)}
              placeholder="Footer text for receipts"
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={downloadPreview}>
              Download Preview PDF
            </Button>
          </div>
          <div ref={previewRef} className="rounded-lg border bg-white p-6 text-xs leading-relaxed text-black shadow-sm" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            <div className="text-center border-b-2 border-black pb-3 mb-3">
              {logoUrl && <img src={logoUrl} alt="Logo" className="mx-auto mb-2 h-12 w-auto object-contain" />}
              <h1 className="text-lg font-bold tracking-wider" style={{ color: primaryColor }}>{nameOverride || branding.company_name_override || "COMPANY NAME"}</h1>
              <p className="text-xs" style={{ color: primaryColor }}>PROPERTY MANAGERS</p>
            </div>
            <p className="mb-2 font-bold" style={{ color: primaryColor }}>TENANCY AGREEMENT PREVIEW</p>
            <p className="mb-4">This is a sample document showing how your branding will appear on tenancy agreements, financial reports, and receipts.</p>
            <table className="w-full border-collapse mb-4">
              <thead>
                <tr>
                  <th className="border p-1.5 text-left text-xs font-bold" style={{ background: primaryColor, color: "#fff" }}>Item</th>
                  <th className="border p-1.5 text-right text-xs font-bold" style={{ background: primaryColor, color: "#fff" }}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-1.5">Sample Rent</td><td className="border p-1.5 text-right">UGX 1,500,000</td></tr>
                <tr><td className="border p-1.5">Deposit</td><td className="border p-1.5 text-right">UGX 750,000</td></tr>
              </tbody>
            </table>
            {docFooter && <p className="mt-4 text-xs text-center" style={{ color: primaryColor }}>{docFooter}</p>}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button onClick={() => onSave({
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          document_footer: docFooter || null,
          receipt_footer: recFooter || null,
          company_name_override: nameOverride || null,
        })} disabled={isPending}>
          {isPending ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </div>
  );
}
