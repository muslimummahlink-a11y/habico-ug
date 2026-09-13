import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppMode } from "@/hooks/app-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { VisitAdPopup } from "@/components/visit-ad-popup";
import { PropertyReviews } from "@/components/property-reviews";
import { toast } from "sonner";
import heroResidence from "@/assets/hero-residence.jpg";
import {
  Building2, MapPin, Home, Bath, Bed, Search, SlidersHorizontal,
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Phone, Mail, Briefcase,
  DollarSign, User, ChevronDown, X, MessageSquare, PlusCircle, Ruler
} from "lucide-react";

export const Route = createFileRoute("/rent")({
  head: () => ({
    meta: [
      { title: "Find Your Next Home — Habico Rentals" },
      { name: "description", content: "Browse available rental properties in Kampala and across Uganda. Submit your rental application online." },
    ],
    links: [{ rel: "canonical", href: "https://www.habico.ug/rent" }],
  }),
  component: RentPage,
});

const PROPERTY_TYPES = ["residential", "commercial", "industrial", "mixed_use"] as const;
const ID_TYPE_OPTIONS: SearchableOption[] = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
];

type Unit = {
  id: string;
  unit_number: string;
  unit_type: string;
  monthly_rent: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number | null;
  status: string;
  floor_number: number | null;
  photos?: Record<string, string>;
};

type Property = {
  id: string;
  name: string;
  address: string | null;
  location: string | null;
  city: string | null;
  property_type: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  units: Unit[];
};

function RentPage() {
  const { user } = useAuth();
  const { clearMode } = useAppMode();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showAppForm, setShowAppForm] = useState(false);
  const [appForm, setAppForm] = useState({
    full_name: "", phone: "", email: "",
    id_type: "national_id", id_number: "",
    emergency_contact_name: "", emergency_contact_phone: "",
    occupation: "", employer: "", monthly_income: "",
    previous_address: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showBrokerForm, setShowBrokerForm] = useState(false);
  const [brokerStep, setBrokerStep] = useState(0);
  const [brokerSubmitting, setBrokerSubmitting] = useState(false);
  const [brokerPhoto, setBrokerPhoto] = useState("");
  const [brokerForm, setBrokerForm] = useState({
    name: "", property_type: "residential", location: "", city: "",
    address: "", description: "", price: "", size_sqm: "",
    bedrooms: "", bathrooms: "", contact_name: "", contact_phone: "", contact_email: "",
  });

  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ["rental-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, units(*)")
        .or("is_active.is.null,is_active.eq.true")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

  if (error) console.error("[rent] failed to load properties:", error);

  const allUnits = properties.flatMap((p) =>
    (p.units ?? []).filter((u) => u.status === "vacant").map((u) => ({ ...u, propertyName: p.name, propertyId: p.id }))
  );
  const minRent = allUnits.length ? Math.min(...allUnits.map((u) => u.monthly_rent)) : 0;
  const maxRent = allUnits.length ? Math.max(...allUnits.map((u) => u.monthly_rent)) : 0;

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || p.property_type === typeFilter;
    return matchesSearch && matchesType;
  });

  function openApply(property: Property, unit: Unit) {
    setSelectedProp(property);
    setSelectedUnit(unit);
    if (user) {
      setAppForm((f) => ({ ...f, full_name: user.user_metadata?.full_name ?? "", email: user.email ?? "" }));
      setShowAppForm(true);
    } else {
      nav({ to: "/auth", search: { redirect: "/rent" } });
    }
  }

  async function handleSubmitApp(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnit || !selectedProp) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("rental_applications").insert({
        property_id: selectedProp.id,
        unit_id: selectedUnit.id,
        full_name: appForm.full_name,
        phone: appForm.phone || null,
        email: appForm.email || null,
        id_type: appForm.id_type,
        id_number: appForm.id_number || null,
        emergency_contact_name: appForm.emergency_contact_name || null,
        emergency_contact_phone: appForm.emergency_contact_phone || null,
        occupation: appForm.occupation || null,
        employer: appForm.employer || null,
        monthly_income: appForm.monthly_income ? Number(appForm.monthly_income) : null,
        previous_address: appForm.previous_address || null,
        notes: appForm.notes || null,
      });
      if (error) throw error;
      toast.success("Application submitted! A Habico agent will contact you.");
      setShowAppForm(false);
      setSelectedProp(null);
      setSelectedUnit(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBrokerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBrokerSubmitting(true);
    try {
      const photoUrl = brokerPhoto || null;
      const { error } = await supabase.from("pending_listings").insert({
        name: brokerForm.name,
        property_type: brokerForm.property_type,
        location: brokerForm.location || null,
        city: brokerForm.city || null,
        address: brokerForm.address || null,
        description: brokerForm.description || null,
        price: brokerForm.price ? Number(brokerForm.price) : null,
        size_sqm: brokerForm.size_sqm ? Number(brokerForm.size_sqm) : null,
        bedrooms: brokerForm.bedrooms ? Number(brokerForm.bedrooms) : null,
        bathrooms: brokerForm.bathrooms ? Number(brokerForm.bathrooms) : null,
        contact_name: brokerForm.contact_name,
        contact_phone: brokerForm.contact_phone,
        contact_email: brokerForm.contact_email || null,
        image_url: photoUrl,
      });
      if (error) throw error;
      toast.success("Property submitted! A Habico admin will review and publish it.");
      setShowBrokerForm(false);
      setBrokerStep(0);
      setBrokerPhoto("");
      setBrokerForm({
        name: "", property_type: "residential", location: "", city: "",
        address: "", description: "", price: "", size_sqm: "",
        bedrooms: "", bathrooms: "", contact_name: "", contact_phone: "", contact_email: "",
      });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBrokerSubmitting(false);
    }
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(price);
  }

  const propDetail = selectedProp;
  const vacantUnits = propDetail ? (propDetail.units ?? []).filter((u) => u.status === "vacant") : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img src={heroResidence} alt="Well-kept rental home in Uganda" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-primary/30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/65 via-primary/35 to-primary/10" />
        <div className="mx-auto grid max-w-7xl items-end gap-10 px-4 py-14 md:grid-cols-[1fr_0.8fr] md:py-24">
          <div>
            <div className="inline-flex max-w-full items-center gap-2 border border-accent/50 bg-primary/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Available Properties
            </div>
            <h1 className="mt-6 max-w-3xl display text-4xl font-bold leading-[0.98] md:text-6xl">
              Find your next <span className="text-accent">home</span> in Uganda.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/85 md:text-lg">
              Browse rental properties managed by Habico, compare options, and find a place that fits your life.
            </p>
          </div>
          <div className="border border-primary-foreground/20 bg-primary/75 p-4 backdrop-blur-sm md:p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-accent">Find your home</div>
            <div className="flex flex-col gap-3">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-foreground/60" />
                <Input
                  className="border-primary-foreground/20 bg-primary-foreground/10 pl-9 text-primary-foreground placeholder:text-primary-foreground/55"
                  placeholder="Search by name, address or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex min-w-0 items-center gap-2 border border-primary-foreground/20 bg-primary-foreground/10 px-3">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-primary-foreground/60" />
                <SearchableSelect
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                  placeholder="All property types"
                  options={[
                    { value: "all", label: "All property types" },
                    ...PROPERTY_TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ") })),
                  ]}
                  className="h-10 w-full border-0 bg-transparent px-0 text-primary-foreground shadow-none hover:bg-transparent hover:text-primary-foreground focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-accent">{properties.length}</div><div className="text-xs text-muted-foreground">Properties Available</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-accent">{allUnits.length}</div><div className="text-xs text-muted-foreground">Vacant Units</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-accent">{minRent ? `${formatPrice(minRent).replace(/UGX\s?/, "")} - ${formatPrice(maxRent).replace(/UGX\s?/, "")}` : "—"}</div><div className="text-xs text-muted-foreground">Price Range (UGX)</div></CardContent></Card>
        </div>
      </section>

      {/* PROPERTY GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        {/* Submit a Property card */}
        <Card className="mb-6 cursor-pointer border-dashed border-accent/40 bg-accent/5 transition hover:border-accent hover:shadow-soft" onClick={() => setShowBrokerForm(true)}>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-4 text-center sm:flex-row sm:p-6 sm:text-left">
            <PlusCircle className="h-8 w-8 text-accent" />
            <div>
              <div className="text-sm font-semibold">Are you a broker or property owner?</div>
              <div className="text-xs text-muted-foreground">Submit a property for review — admin will approve and publish it.</div>
            </div>
            <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">Submit Property</Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading properties...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Building2 className="h-12 w-12 text-destructive/60" />
            <div className="text-lg font-medium text-destructive">Failed to load properties</div>
            <div className="text-sm text-muted-foreground">{(error as Error).message}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-lg font-medium">No properties found</div>
            <div className="text-sm text-muted-foreground">{search || typeFilter !== "all" ? "Try a different search or filter." : "No available rentals at the moment. Check back soon."}</div>
          </div>
        ) : (
          <div className="animate-stagger grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const vacant = (p.units ?? []).filter((u) => u.status === "vacant");
              const minUnitRent = vacant.length ? Math.min(...vacant.map((u) => u.monthly_rent)) : 0;
              const hasAvailability = vacant.length > 0;

              return (
                <Card
                  key={p.id}
                  className="group cursor-pointer overflow-hidden transition hover:-translate-y-1 hover:shadow-soft"
                  onClick={() => setSelectedProp(p)}
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-44 w-full object-cover sm:h-48" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-secondary">
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={hasAvailability ? "rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent" : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"}>
                          {p.property_type ?? "Property"}
                        </span>
                      </div>
                      {minUnitRent > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">{formatPrice(minUnitRent)}</div>
                          <div className="text-[10px] text-muted-foreground">/month</div>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-3 display text-lg font-bold">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{p.city ?? p.location ?? p.address ?? "Kampala"}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      {hasAvailability ? (
                        <>
                          <span className="flex items-center gap-1"><Home className="h-3 w-3" /> {vacant.length} available</span>
                          {vacant.some((u) => u.bedrooms > 0) && (
                            <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {Math.min(...vacant.map((u) => u.bedrooms))}+ beds</span>
                          )}
                          {vacant.some((u) => u.bathrooms > 0) && (
                            <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {Math.min(...vacant.map((u) => u.bathrooms))}+ baths</span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No available units</span>
                      )}
                    </div>
                    <Button
                      className="mt-4 w-full"
                      variant={hasAvailability ? "outline" : "secondary"}
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setSelectedProp(p); }}
                    >
                      {hasAvailability ? <>View Details <ArrowRight className="ml-2 h-3 w-3" /></> : "View Details"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* PROPERTY DETAIL DIALOG */}
      <ResponsiveDialog
        open={!!propDetail && !showAppForm}
        onOpenChange={(v) => { if (!v) { setSelectedProp(null); setSelectedUnit(null); } }}
        title={propDetail?.name ?? ""}
        description={propDetail ? `${propDetail.city ?? propDetail.location ?? propDetail.address ?? "Kampala, Uganda"}` : ""}
        className="sm:max-w-2xl"
      >
        {propDetail && (
          <>

              {propDetail.image_url && (
                  <img src={propDetail.image_url} alt={propDetail.name} className="h-44 w-full rounded-lg object-cover sm:h-56" />
              )}

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">About</h4>
                  <p className="mt-1 text-sm">{propDetail.description ?? "No description available."}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{propDetail.property_type}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Habico</h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <a href="tel:+256702239607" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Phone className="h-4 w-4 text-accent" /> 0702 239 607
                    </a>
                    <a href="tel:+256756742220" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Phone className="h-4 w-4 text-accent" /> 0756 742 220
                    </a>
                    <a href="mailto:licenses@habico.ug" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Mail className="h-4 w-4 text-accent" /> licenses@habico.ug
                    </a>
                    <a href="https://wa.me/256702239607" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <MessageSquare className="h-4 w-4 text-accent" /> WhatsApp
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Units</h4>
                  {vacantUnits.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No vacant units at this time.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {vacantUnits.map((unit) => (
                        <div key={unit.id} className="rounded-lg border p-4 transition hover:border-accent">
                          {unit.photos && Object.keys(unit.photos).length > 0 && (
                            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {unit.photos.bedroom_photo && <img src={unit.photos.bedroom_photo} alt="Bedroom" className="h-16 w-full rounded object-cover" title="Bedroom" />}
                              {unit.photos.bathroom_photo && <img src={unit.photos.bathroom_photo} alt="Bathroom" className="h-16 w-full rounded object-cover" title="Bathroom" />}
                              {unit.photos.living_room_photo && <img src={unit.photos.living_room_photo} alt="Living Room" className="h-16 w-full rounded object-cover" title="Living Room" />}
                              {unit.photos.kitchen_photo && <img src={unit.photos.kitchen_photo} alt="Kitchen" className="h-16 w-full rounded object-cover" title="Kitchen" />}
                            </div>
                          )}
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{unit.unit_number}</span>
                                <span className="text-xs text-muted-foreground">{unit.unit_type}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {unit.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {unit.bedrooms} bed</span>}
                                {unit.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {unit.bathrooms} bath</span>}
                                {unit.size_sqm && <span>{unit.size_sqm} sqm</span>}
                                {unit.floor_number != null && <span>Floor {unit.floor_number}</span>}
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-lg font-bold">{formatPrice(unit.monthly_rent)}</div>
                              <div className="text-[10px] text-muted-foreground">/month</div>
                              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => window.open("https://wa.me/256702239607?text=" + encodeURIComponent(`Hi Habico, I'm interested in ${propDetail.name} — Unit ${unit.unit_number}`), "_blank")}>
                                  <MessageSquare className="mr-1 h-3 w-3" /> WhatsApp
                                </Button>
                                <Button size="sm" className="w-full sm:w-auto" onClick={() => openApply(propDetail, unit)}>Apply Now</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <PropertyReviews propertyId={propDetail.id} />
              </div>
            </>
          )}
      </ResponsiveDialog>

      {/* APPLICATION FORM DIALOG */}
      <ResponsiveDialog
        open={showAppForm}
        onOpenChange={setShowAppForm}
        title="Rental Application"
        description={selectedProp && selectedUnit
          ? `Applying for ${selectedProp.name} — Unit ${selectedUnit.unit_number} (${formatPrice(selectedUnit.monthly_rent)}/month)`
          : "Complete the form below to start your application."}
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmitApp} className="space-y-6">
          <div>
            <div className="mb-3 border-b pb-2"><h3 className="text-sm font-semibold">Personal Information</h3></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="col-span-2"><Label>Full Name *</Label><Input value={appForm.full_name} onChange={(e) => setAppForm({ ...appForm, full_name: e.target.value })} placeholder="e.g. John Kamau" required /></div>
              <div><Label>Phone</Label><Input value={appForm.phone} onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })} placeholder="+256 700 000 000" /></div>
              <div><Label>Email</Label><Input type="email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} placeholder="you@example.com" /></div>
            </div>
          </div>

          <div>
            <div className="mb-3 border-b pb-2"><h3 className="text-sm font-semibold">Identification</h3></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>ID Type</Label>
                <SearchableSelect
                  value={appForm.id_type}
                  onValueChange={(v) => setAppForm({ ...appForm, id_type: v })}
                  placeholder="Select ID type"
                  options={ID_TYPE_OPTIONS}
                />
              </div>
              <div><Label>ID Number</Label><Input value={appForm.id_number} onChange={(e) => setAppForm({ ...appForm, id_number: e.target.value })} placeholder="e.g. CM12345678" /></div>
            </div>
          </div>

          <div>
            <div className="mb-3 border-b pb-2"><h3 className="text-sm font-semibold">Employment &amp; Income</h3></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Occupation</Label><Input value={appForm.occupation} onChange={(e) => setAppForm({ ...appForm, occupation: e.target.value })} placeholder="e.g. Software Engineer" /></div>
              <div><Label>Employer</Label><Input value={appForm.employer} onChange={(e) => setAppForm({ ...appForm, employer: e.target.value })} placeholder="e.g. Tech Corp Ltd" /></div>
              <div className="sm:col-span-2"><Label>Monthly Income (UGX)</Label><Input type="number" inputMode="numeric" value={appForm.monthly_income} onChange={(e) => setAppForm({ ...appForm, monthly_income: e.target.value })} placeholder="e.g. 5000000" /></div>
            </div>
          </div>

          <div>
            <div className="mb-3 border-b pb-2"><h3 className="text-sm font-semibold">Emergency Contact</h3></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><Label>Full Name</Label><Input value={appForm.emergency_contact_name} onChange={(e) => setAppForm({ ...appForm, emergency_contact_name: e.target.value })} placeholder="Next of kin" /></div>
              <div><Label>Phone</Label><Input value={appForm.emergency_contact_phone} onChange={(e) => setAppForm({ ...appForm, emergency_contact_phone: e.target.value })} placeholder="+256 700 000 000" /></div>
            </div>
          </div>

          <div>
            <div className="mb-3 border-b pb-2"><h3 className="text-sm font-semibold">Additional Information</h3></div>
            <div className="grid gap-3">
              <div><Label>Previous Address</Label><Input value={appForm.previous_address} onChange={(e) => setAppForm({ ...appForm, previous_address: e.target.value })} placeholder="Where do you currently live?" /></div>
              <div><Label>Notes / Special Requests</Label><Textarea value={appForm.notes} onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })} placeholder="Any questions or special requirements..." rows={3} /></div>
            </div>
          </div>

          <Button type="submit" disabled={submitting || !appForm.full_name} className="w-full">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Application"}
          </Button>
        </form>
      </ResponsiveDialog>

      {/* BROKER SUBMISSION DIALOG */}
      <ResponsiveDialog
        open={showBrokerForm}
        onOpenChange={(open) => {
          setShowBrokerForm(open);
          if (!open) setBrokerStep(0);
        }}
        title="Submit a Property"
        description="Share the essentials in a few quick steps. An admin will review and publish your listing."
        className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg"
      >
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Step {brokerStep + 1} of 4</span>
            <span className="text-accent">{["Basics", "Location", "Details", "Contact"][brokerStep]}</span>
          </div>
          <div className="grid grid-cols-4 gap-1" aria-label="Property submission progress">
            {[0, 1, 2, 3].map((step) => <div key={step} className={`h-1.5 ${step <= brokerStep ? "bg-accent" : "bg-muted"}`} />)}
          </div>
        </div>
        <form onSubmit={handleBrokerSubmit} className="space-y-4">
          {brokerStep === 0 && <div className="space-y-4"><div><Label>Property Name *</Label><Input value={brokerForm.name} onChange={(e) => setBrokerForm({ ...brokerForm, name: e.target.value })} placeholder="e.g. Sunset Apartments" required /></div><div><Label>Property Type</Label><select value={brokerForm.property_type} onChange={(e) => setBrokerForm({ ...brokerForm, property_type: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="land">Land</option><option value="mixed_use">Mixed Use</option><option value="industrial">Industrial</option></select></div><div><Label>Price (UGX)</Label><Input type="number" inputMode="numeric" value={brokerForm.price} onChange={(e) => setBrokerForm({ ...brokerForm, price: e.target.value })} placeholder="e.g. 5000000" /></div></div>}
          {brokerStep === 1 && <div className="space-y-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Location</Label><Input value={brokerForm.location} onChange={(e) => setBrokerForm({ ...brokerForm, location: e.target.value })} placeholder="e.g. Kololo" /></div><div><Label>City</Label><Input value={brokerForm.city} onChange={(e) => setBrokerForm({ ...brokerForm, city: e.target.value })} placeholder="e.g. Kampala" /></div></div><div><Label>Address</Label><Input value={brokerForm.address} onChange={(e) => setBrokerForm({ ...brokerForm, address: e.target.value })} placeholder="Street / area" /></div><div><Label>Description</Label><Textarea value={brokerForm.description} onChange={(e) => setBrokerForm({ ...brokerForm, description: e.target.value })} rows={4} placeholder="Describe the property..." /></div></div>}
          {brokerStep === 2 && <div className="space-y-4"><div><Label>Photo</Label><FileUpload accept="image/*" folder="pending-listings" value={brokerPhoto} onChange={(url) => setBrokerPhoto(url)} /></div><div className="grid grid-cols-3 gap-3"><div><Label>Size (sqm)</Label><Input type="number" inputMode="numeric" value={brokerForm.size_sqm} onChange={(e) => setBrokerForm({ ...brokerForm, size_sqm: e.target.value })} placeholder="e.g. 100" /></div><div><Label>Bedrooms</Label><Input type="number" inputMode="numeric" value={brokerForm.bedrooms} onChange={(e) => setBrokerForm({ ...brokerForm, bedrooms: e.target.value })} placeholder="e.g. 3" /></div><div><Label>Bathrooms</Label><Input type="number" inputMode="numeric" value={brokerForm.bathrooms} onChange={(e) => setBrokerForm({ ...brokerForm, bathrooms: e.target.value })} placeholder="e.g. 2" /></div></div></div>}
          {brokerStep === 3 && <div className="space-y-4"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">Your Contact Info</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><Label>Your Name *</Label><Input value={brokerForm.contact_name} onChange={(e) => setBrokerForm({ ...brokerForm, contact_name: e.target.value })} placeholder="e.g. John Kamau" required /></div><div><Label>Phone *</Label><Input value={brokerForm.contact_phone} onChange={(e) => setBrokerForm({ ...brokerForm, contact_phone: e.target.value })} placeholder="+256 700 000 000" required /></div></div><div className="mt-3"><Label>Email</Label><Input type="email" value={brokerForm.contact_email} onChange={(e) => setBrokerForm({ ...brokerForm, contact_email: e.target.value })} placeholder="you@example.com" /></div></div><div className="border-t pt-4 text-sm"><p className="font-semibold">Ready to submit?</p><p className="mt-1 text-muted-foreground">An admin will review your listing before it goes live.</p><div className="mt-3 grid gap-1 text-xs text-muted-foreground"><span>{brokerForm.name || "Property name not set"}</span><span>{brokerForm.location || "Location not set"}{brokerForm.city ? `, ${brokerForm.city}` : ""}</span><span>{brokerForm.property_type}</span></div></div></div>}
          <div className="flex gap-2 border-t pt-4">
            {brokerStep > 0 && <Button type="button" variant="outline" onClick={() => setBrokerStep((step) => step - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}
            {brokerStep < 3 ? <Button type="button" className="ml-auto" disabled={brokerStep === 0 && !brokerForm.name} onClick={() => setBrokerStep((step) => step + 1)}>Continue<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" disabled={brokerSubmitting || !brokerForm.name || !brokerForm.contact_name || !brokerForm.contact_phone} className="ml-auto">{brokerSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit for Review"}</Button>}
          </div>
        </form>
      </ResponsiveDialog>

      <VisitAdPopup />

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <button onClick={() => clearMode()} className="underline hover:text-foreground">Switch how you access Habico</button>
      </footer>
    </div>
  );
}
