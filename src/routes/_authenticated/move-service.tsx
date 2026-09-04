import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/use-company-id";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeftRight, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/move-service")({
  head: () => ({ meta: [{ title: "Move Service — Habico Portal" }] }),
  component: MoveServicePage,
});

function MoveServicePage() {
  const { data: companyId, isLoading: companyLoading } = useCompanyId();
  const role = useHighestRole();
  const qc = useQueryClient();

  const [isActive, setIsActive] = useState(true);
  const [basePrice, setBasePrice] = useState("0");
  const [pricePerKm, setPricePerKm] = useState("0");
  const [pricePerFloor, setPricePerFloor] = useState("0");
  const [smallLoad, setSmallLoad] = useState("0");
  const [mediumLoad, setMediumLoad] = useState("0");
  const [largeLoad, setLargeLoad] = useState("0");
  const [packingFee, setPackingFee] = useState("0");
  const [description, setDescription] = useState("");

  const { data: config, isLoading } = useQuery({
    queryKey: ["move-service-config", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data }: any = await supabase.from("move_service_configs" as any).select("*").eq("company_id", companyId).single();
      return data;
    },
    enabled: !!companyId,
  });

  if (config && !basePrice && config.base_price != null) {
    setBasePrice(String(config.base_price));
    setPricePerKm(String(config.price_per_km));
    setPricePerFloor(String(config.price_per_floor));
    setSmallLoad(String(config.small_load_price));
    setMediumLoad(String(config.medium_load_price));
    setLargeLoad(String(config.large_load_price));
    setPackingFee(String(config.packing_material_fee));
    setDescription(config.description ?? "");
    setIsActive(config.is_active ?? true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No company");
      const vals = {
        company_id: companyId,
        is_active: isActive,
        base_price: Number(basePrice) || 0,
        price_per_km: Number(pricePerKm) || 0,
        price_per_floor: Number(pricePerFloor) || 0,
        small_load_price: Number(smallLoad) || 0,
        medium_load_price: Number(mediumLoad) || 0,
        large_load_price: Number(largeLoad) || 0,
        packing_material_fee: Number(packingFee) || 0,
        description: description || null,
      };
      const existing: any = await supabase.from("move_service_configs" as any).select("id").eq("company_id", companyId).single();
      if (existing.data) {
        const { error }: any = await supabase.from("move_service_configs" as any).update(vals).eq("company_id", companyId);
        if (error) throw error;
      } else {
        const { error }: any = await supabase.from("move_service_configs" as any).insert(vals);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["move-service-config", companyId] });
      toast.success("Move service pricing saved");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save"),
  });

  if (companyLoading) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">Loading company...</p></div>;
  }
  if (!companyId) {
    return <div className="flex h-96 items-center justify-center"><p className="text-muted-foreground">No company configured. Contact your administrator.</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTour route="/move-service" role={role} />
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Services</div>
          <h1 className="display text-3xl font-bold">Move In/Out Service</h1>
          <p className="text-sm text-muted-foreground">Configure pricing and availability for move-in/move-out services</p>
        </div>
        <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="display">Service Status</CardTitle>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isActive ? "Service is active and customers can book" : "Service is disabled"}
          </p>
          <div className="mt-2">
            <Label>Description (shown to customers)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe your move-in/out service..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="display"><DollarSign className="mr-2 inline h-5 w-5" />Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Base Price (UGX)</Label>
              <Input type="number" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
              <p className="text-xs text-muted-foreground">Flat starting fee for any move</p>
            </div>
            <div className="space-y-2">
              <Label>Price per KM (UGX)</Label>
              <Input type="number" min="0" step="100" value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} />
              <p className="text-xs text-muted-foreground">Charge per kilometer of distance</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Price per Floor (UGX)</Label>
              <Input type="number" min="0" value={pricePerFloor} onChange={(e) => setPricePerFloor(e.target.value)} />
              <p className="text-xs text-muted-foreground">Extra charge per floor (no elevator)</p>
            </div>
            <div className="space-y-2">
              <Label>Packing Materials Fee (UGX)</Label>
              <Input type="number" min="0" value={packingFee} onChange={(e) => setPackingFee(e.target.value)} />
              <p className="text-xs text-muted-foreground">Fee if customer needs packing materials</p>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Load Size Pricing</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs">Small Load (UGX)</Label>
                <Input type="number" min="0" value={smallLoad} onChange={(e) => setSmallLoad(e.target.value)} />
                <p className="text-xs text-muted-foreground">Studio/1-bedroom</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Medium Load (UGX)</Label>
                <Input type="number" min="0" value={mediumLoad} onChange={(e) => setMediumLoad(e.target.value)} />
                <p className="text-xs text-muted-foreground">2-3 bedroom</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Large Load (UGX)</Label>
                <Input type="number" min="0" value={largeLoad} onChange={(e) => setLargeLoad(e.target.value)} />
                <p className="text-xs text-muted-foreground">4+ bedroom / house</p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h4 className="text-sm font-medium">Price Estimate Preview</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Base: UGX {Number(basePrice).toLocaleString()} |
              Per km: UGX {Number(pricePerKm).toLocaleString()} |
              Per floor: UGX {Number(pricePerFloor).toLocaleString()} |
              Small: UGX {Number(smallLoad).toLocaleString()} |
              Medium: UGX {Number(mediumLoad).toLocaleString()} |
              Large: UGX {Number(largeLoad).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
          {saveMutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
