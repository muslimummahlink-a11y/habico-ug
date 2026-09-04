import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Building2, Home, Users, FileText, Receipt, Wrench, BarChart3,
  Package, Toolbox, ShoppingCart, Briefcase, HardHat, DollarSign,
  ClipboardList, Truck, Repeat, ShieldCheck, MessageSquare,
  FileSignature, CreditCard, QrCode, CalendarCheck, Calculator,
  PhoneCall, FileBadge, FolderOpen, ListChecks, ClipboardPen,
  MessageSquareQuote, FileUp, Handshake, GitCompareArrows, Clock,
  PiggyBank, Landmark, FileCheck, ClipboardCheck, Hash,
  ReceiptText, ScrollText, Gauge, CalendarRange, NotebookPen,
  ListTodo, TriangleAlert, FolderKanban, Image, Banknote, Search,
  Crown, UserCog, User, Settings, Smartphone
} from "lucide-react";
import { useHighestRole } from "@/hooks/use-auth";
import { getWorkspace } from "@/lib/workspace-config";

interface CmdItem {
  title: string;
  url: string;
  icon: any;
  group: string;
}

const allRoutes: CmdItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, group: "Overview" },
  { title: "Properties", url: "/properties", icon: Building2, group: "Rental Management" },
  { title: "Leases", url: "/leases", icon: FileText, group: "Rental Management" },
  { title: "Tenants", url: "/tenants", icon: Users, group: "Rental Management" },
  { title: "Payments", url: "/payments", icon: Receipt, group: "Rental Management" },
  { title: "Recurring Billing", url: "/recurring-billing", icon: Repeat, group: "Rental Management" },
  { title: "Payment Proofs", url: "/payment-proofs", icon: ShieldCheck, group: "Rental Management" },
  { title: "Messages", url: "/rental-messages", icon: MessageSquare, group: "Rental Management" },
  { title: "E-Leasing", url: "/e-leasing", icon: FileSignature, group: "Rental Management" },
  { title: "ID Cards", url: "/rental-id-cards", icon: CreditCard, group: "Rental Management" },
  { title: "Listing Banners", url: "/listing-banners", icon: QrCode, group: "Rental Management" },
  { title: "Maintenance", url: "/maintenance", icon: Wrench, group: "Rental Management" },
  { title: "Preventative Maintenance", url: "/preventative-maintenance", icon: CalendarCheck, group: "Rental Management" },
  { title: "Tax Dashboard", url: "/rental-tax-dashboard", icon: Calculator, group: "Rental Management" },
  { title: "Projects", url: "/projects", icon: HardHat, group: "Construction" },
  { title: "Project Dashboard", url: "/project-dashboard", icon: Gauge, group: "Construction" },
  { title: "Project Schedule", url: "/project-schedules", icon: CalendarRange, group: "Construction" },
  { title: "Project Tasks", url: "/project-tasks", icon: ListChecks, group: "Construction" },
  { title: "Daily Logs", url: "/daily-logs", icon: ClipboardPen, group: "Construction" },
  { title: "RFIs", url: "/rfis", icon: MessageSquareQuote, group: "Construction" },
  { title: "Submittals", url: "/submittals", icon: FileUp, group: "Construction" },
  { title: "Meeting Minutes", url: "/meeting-minutes", icon: NotebookPen, group: "Construction" },
  { title: "Punch List", url: "/punch-list", icon: ListTodo, group: "Construction" },
  { title: "Safety Incidents", url: "/safety-incidents", icon: TriangleAlert, group: "Construction" },
  { title: "Project Documents", url: "/project-documents", icon: FolderKanban, group: "Construction" },
  { title: "Project Photos", url: "/project-photos", icon: Image, group: "Construction" },
  { title: "Leads", url: "/leads", icon: PhoneCall, group: "Construction" },
  { title: "Estimates", url: "/estimates", icon: Calculator, group: "Construction" },
  { title: "Proposals", url: "/proposals", icon: FileBadge, group: "Construction" },
  { title: "Bid Packages", url: "/bid-packages", icon: FolderOpen, group: "Construction" },
  { title: "Employees", url: "/employees", icon: Briefcase, group: "Construction" },
  { title: "Timesheets", url: "/timesheets", icon: Clock, group: "Construction" },
  { title: "Expenses", url: "/expenses", icon: DollarSign, group: "Construction" },
  { title: "Receipts", url: "/receipts", icon: ReceiptText, group: "Construction" },
  { title: "Suppliers", url: "/suppliers", icon: Truck, group: "Construction" },
  { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart, group: "Construction" },
  { title: "Inventory", url: "/inventory", icon: Package, group: "Construction" },
  { title: "Assets", url: "/assets", icon: Toolbox, group: "Construction" },
  { title: "Equipment Rentals", url: "/equipment-rentals", icon: ClipboardList, group: "Construction" },
  { title: "Construction Invoices", url: "/construction-invoices", icon: FileText, group: "Construction Financial" },
  { title: "Subcontracts", url: "/subcontracts", icon: Handshake, group: "Construction Financial" },
  { title: "Change Orders", url: "/change-orders", icon: GitCompareArrows, group: "Construction Financial" },
  { title: "Allowances", url: "/allowances", icon: PiggyBank, group: "Construction Financial" },
  { title: "Project Budget", url: "/project-budget", icon: Landmark, group: "Construction Financial" },
  { title: "Bills", url: "/bills", icon: ScrollText, group: "Construction Financial" },
  { title: "Lien Waivers", url: "/lien-waivers", icon: FileCheck, group: "Construction Financial" },
  { title: "Commitment Log", url: "/commitment-log", icon: ReceiptText, group: "Construction Financial" },
  { title: "Progress Payments", url: "/progress-payments", icon: Banknote, group: "Construction Financial" },
  { title: "SOP Dashboard", url: "/sop", icon: ClipboardCheck, group: "SOP & Quality" },
  { title: "SOP Checklists", url: "/sop-checklists", icon: ListChecks, group: "SOP & Quality" },
  { title: "SOP Forms", url: "/sop-forms", icon: FileSignature, group: "SOP & Quality" },
  { title: "Cost Codes", url: "/cost-codes", icon: Hash, group: "SOP & Quality" },
  { title: "Reports", url: "/reports", icon: BarChart3, group: "Reports" },
  { title: "Financial Reports", url: "/financial-reports", icon: DollarSign, group: "Reports" },
  { title: "Pending Registrations", url: "/pending-registrations", icon: Clock, group: "System" },
  { title: "Payment Settings", url: "/payment-settings", icon: Smartphone, group: "System" },
  { title: "Dev Tools", url: "/dev-tools", icon: Settings, group: "System" },
  { title: "Settings", url: "/settings", icon: Settings, group: "System" },
  { title: "My ID Card", url: "/my-id-card", icon: CreditCard, group: "My Home" },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const role = useHighestRole();
  const ws = getWorkspace(role);

  const filteredRoutes = allRoutes.filter((r) => ws.allowedRoutes.includes(r.url));
  const groups = [...new Set(filteredRoutes.map((r) => r.group))];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (url: string) => {
      setOpen(false);
      setSearch("");
      navigate({ to: url });
    },
    [navigate],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-full max-w-[240px] items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search {ws.name}...</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <div
        className={`fixed inset-0 z-50 ${open ? "" : "hidden"}`}
        onClick={() => setOpen(false)}
      >
        <div className="fixed inset-0 bg-black/50" />
        <div
          className="fixed left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 rounded-xl border bg-popover p-0 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Command className="rounded-lg" shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder={`Search ${ws.name}...`}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No pages found.
              </Command.Empty>
              {groups.map((group) => {
                const items = filteredRoutes.filter(
                  (r) =>
                    r.group === group &&
                    (r.title.toLowerCase().includes(search.toLowerCase()) ||
                      r.url.toLowerCase().includes(search.toLowerCase())),
                );
                if (items.length === 0) return null;
                return (
                  <Command.Group key={group} heading={group}>
                    {items.map((item) => (
                      <Command.Item
                        key={item.url}
                        value={item.url}
                        onSelect={() => runCommand(item.url)}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{item.title}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
        </div>
      </div>
    </>
  );
}
