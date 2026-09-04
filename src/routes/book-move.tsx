import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/book-move")({
  head: () => ({
    meta: [
      { title: "Book a Move — Habico Portal" },
      { name: "description", content: "Schedule a move-in or move-out service with Habico Property Managers." },
    ],
  }),
  component: BookMovePage,
});

function BookMovePage() {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  const [serviceType, setServiceType] = useState<"move_in" | "move_out">("move_in");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loadSize, setLoadSize] = useState<"small" | "medium" | "large">("small");
  const [distanceKm, setDistanceKm] = useState(0);
  const [floorsFrom, setFloorsFrom] = useState(1);
  const [floorsTo, setFloorsTo] = useState(1);
  const [notes, setNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [activeConfig, setActiveConfig] = useState<any>(null);

  const { data: config }: any = useQuery({
    queryKey: ["move-service-config-public"],
    queryFn: async () => {
      const { data }: any = await supabase.rpc("get_active_move_service_config" as any);
      return data?.[0] ?? null;
    },
  });

  const calcFloors = () => Math.max(0, floorsFrom - 1) + Math.max(0, floorsTo - 1);

  const estimatePrice = () => {
    if (!config) return;
    const c = config;
    let price = Number(c.base_price) || 0;
    price += (Number(c.price_per_km) || 0) * distanceKm;
    price += (Number(c.price_per_floor) || 0) * calcFloors();
    if (loadSize === "small") price += Number(c.small_load_price) || 0;
    else if (loadSize === "medium") price += Number(c.medium_load_price) || 0;
    else if (loadSize === "large") price += Number(c.large_load_price) || 0;
    setEstimatedPrice(price);
    setActiveConfig(c);
  };

  const submitBooking = useMutation({
    mutationFn: async () => {
      const perFloor = Number(config?.price_per_floor) || 0;
      const perKm = Number(config?.price_per_km) || 0;
      let loadCharge = 0;
      if (loadSize === "small") loadCharge = Number(config?.small_load_price) || 0;
      else if (loadSize === "medium") loadCharge = Number(config?.medium_load_price) || 0;
      else if (loadSize === "large") loadCharge = Number(config?.large_load_price) || 0;
      const { error }: any = await supabase.from("move_bookings" as any).insert({
        company_id: activeConfig?.company_id,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone,
        service_type: serviceType,
        pickup_address: pickup,
        dropoff_address: dropoff,
        distance_km: distanceKm,
        floors_from: floorsFrom,
        floors_to: floorsTo,
        load_size: loadSize,
        preferred_date: preferredDate,
        notes: notes || null,
        base_price: Number(config?.base_price) || 0,
        distance_charge: perKm * distanceKm,
        floor_charge: perFloor * calcFloors(),
        load_charge: loadCharge,
        total_price: estimatedPrice,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStep("done");
      toast.success("Booking submitted!");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to submit booking"),
  });

  const handleNext = () => {
    if (!customerName || !customerPhone || !preferredDate || !pickup || !dropoff) {
      toast.error("Please fill in all required fields");
      return;
    }
    estimatePrice();
    setStep("confirm");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl py-12">
          {!config ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Move Service</h2>
                <p className="text-center text-sm text-muted-foreground">
                  Move-in/Move-out services are not currently available. Please check back later.
                </p>
              </CardContent>
            </Card>
          ) : step === "form" ? (
            <>
              <div className="mb-6 flex items-center gap-3">
                <ArrowLeftRight className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h1 className="text-2xl font-bold">Book a Move</h1>
                  <p className="text-sm text-muted-foreground">Schedule a move-in or move-out service</p>
                </div>
              </div>
              <Card>
                <CardHeader><CardTitle className="display">Move Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Move Type</Label>
                      <Select value={serviceType} onValueChange={(v: any) => setServiceType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="move_in">Move In</SelectItem>
                          <SelectItem value="move_out">Move Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Date</Label>
                      <Input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Your Name</Label>
                      <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+256..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pickup Address</Label>
                    <Textarea value={pickup} onChange={(e) => setPickup(e.target.value)} rows={2} placeholder="Current address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dropoff Address</Label>
                    <Textarea value={dropoff} onChange={(e) => setDropoff(e.target.value)} rows={2} placeholder="New address" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Load Size</Label>
                      <Select value={loadSize} onValueChange={(v: any) => setLoadSize(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small (Studio/1-bed)</SelectItem>
                          <SelectItem value="medium">Medium (2-3 bed)</SelectItem>
                          <SelectItem value="large">Large (4+ bed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Distance (km)</Label>
                      <Input type="number" min="0" value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Floor at pickup</Label>
                      <Input type="number" min="1" value={floorsFrom} onChange={(e) => setFloorsFrom(Math.max(1, Number(e.target.value)))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Floor at dropoff</Label>
                      <Input type="number" min="1" value={floorsTo} onChange={(e) => setFloorsTo(Math.max(1, Number(e.target.value)))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Special instructions, fragile items, etc." />
                  </div>
                  <Button onClick={handleNext} className="w-full" size="lg">Continue to Review</Button>
                </CardContent>
              </Card>
            </>
          ) : step === "confirm" ? (
            <Card>
              <CardHeader>
                <CardTitle className="display">Review & Confirm</CardTitle>
                <p className="text-sm text-muted-foreground">Please review your move details before submitting</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Type</dt><dd className="font-medium">{serviceType === "move_in" ? "Move In" : "Move Out"}</dd>
                    <dt className="text-muted-foreground">Name</dt><dd className="font-medium">{customerName}</dd>
                    <dt className="text-muted-foreground">Phone</dt><dd className="font-medium">{customerPhone}</dd>
                    <dt className="text-muted-foreground">Date</dt><dd className="font-medium">{preferredDate}</dd>
                    <dt className="text-muted-foreground">From</dt><dd className="font-medium">{pickup}</dd>
                    <dt className="text-muted-foreground">To</dt><dd className="font-medium">{dropoff}</dd>
                    <dt className="text-muted-foreground">Load</dt><dd className="font-medium capitalize">{loadSize}</dd>
                    <dt className="text-muted-foreground">Distance</dt><dd className="font-medium">{distanceKm} km</dd>
                  </dl>
                </div>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                  <p className="text-center text-lg font-bold">Estimated Total: UGX {estimatedPrice.toLocaleString()}</p>
                  <p className="mt-1 text-center text-xs text-muted-foreground">Final price may vary based on actual distance and requirements</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("form")} className="w-full">Edit</Button>
                  <Button onClick={() => submitBooking.mutate()} disabled={submitBooking.isPending} className="w-full">
                    {submitBooking.isPending ? "Submitting..." : "Confirm Booking"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold">Booking Submitted!</h2>
                <p className="text-muted-foreground">
                  Your move {serviceType === "move_in" ? "in" : "out"} has been scheduled. We'll contact you at {customerPhone} to confirm.
                </p>
                <Button variant="outline" onClick={() => { setStep("form"); setCustomerName(""); setCustomerPhone(""); setCustomerEmail(""); setPickup(""); setDropoff(""); setNotes(""); setDistanceKm(0); setFloorsFrom(1); setFloorsTo(1); }}>
                  Book Another
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
