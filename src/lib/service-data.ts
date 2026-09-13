import { Calculator, CalendarRange, ClipboardCheck, FileText, HardHat, Receipt, ShieldCheck, Users, type LucideIcon } from "lucide-react";

export type ServiceDetails = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  items: string[];
  description: string;
  benefits: string[];
  ctaText: string;
};

export const services: ServiceDetails[] = [
  {
    id: "construction",
    icon: HardHat,
    title: "Construction Operations",
    subtitle: "Run the full construction workflow from lead to closeout",
    items: ["Leads, estimates, proposals, and bid packages", "Projects, schedules, dashboards, and task tracking", "Daily logs, RFIs, submittals, and meeting minutes", "Punch lists, safety incidents, documents, and photos", "Employees, timesheets, suppliers, inventory, and equipment", "Budgets, subcontracts, change orders, bills, and payments"],
    description: "Habico brings your construction operation into one connected workspace. Manage business development, plan projects, coordinate field work, control quality and safety, organise people and resources, and keep financial commitments visible from the first estimate through final payment.",
    benefits: ["One connected construction workspace", "Clear project schedule and task ownership", "Traceable field and quality records", "Visibility into labour, materials, and equipment", "Better control of commitments and cash flow"],
    ctaText: "Explore Construction Operations",
  },
  {
    id: "business-development",
    icon: Calculator,
    title: "Business Development",
    subtitle: "Turn opportunities into organised, actionable bids",
    items: ["Lead pipeline management", "Estimates and quotations", "Client proposals", "Bid package preparation"],
    description: "Keep every opportunity moving from first contact to a well-defined bid. Track leads, build estimates, prepare quotations, and send professional proposals from one construction workflow.",
    benefits: ["Clear lead ownership", "Faster estimate preparation", "Consistent proposals", "Better bid visibility"],
    ctaText: "Manage Construction Leads",
  },
  {
    id: "project-management",
    icon: CalendarRange,
    title: "Project Management",
    subtitle: "Keep schedules, tasks, and field coordination aligned",
    items: ["Project dashboards", "Project schedules and milestones", "Task ownership and tracking", "Daily logs and progress updates", "RFIs and submittals", "Meeting minutes"],
    description: "Give project teams one place to plan the work and report what is happening on site. Connect schedules, tasks, daily logs, RFIs, submittals, and meeting decisions so nothing gets lost between the office and the field.",
    benefits: ["Shared project visibility", "Clear responsibility by task", "Faster issue resolution", "Reliable site records"],
    ctaText: "Manage a Project",
  },
  {
    id: "quality-safety",
    icon: ShieldCheck,
    title: "Quality & Safety",
    subtitle: "Capture issues early and protect every project team",
    items: ["Punch lists", "Safety incident tracking", "Project documents", "Project photos", "Quality follow-up records"],
    description: "Make quality and safety visible throughout the build. Record incidents, track punch items, organise documents, and keep a visual project history that helps teams resolve issues before closeout.",
    benefits: ["Fewer unresolved defects", "Traceable safety records", "Centralised project evidence", "Cleaner handover process"],
    ctaText: "Improve Project Quality",
  },
  {
    id: "team-resources",
    icon: Users,
    title: "Teams & Resources",
    subtitle: "Coordinate people, materials, suppliers, and equipment",
    items: ["Employee records", "Timesheets and expenses", "Suppliers and purchase orders", "Inventory and assets", "Equipment rentals"],
    description: "Keep the resources behind every project organised. Manage employees, timesheets, expenses, suppliers, purchase orders, inventory, assets, and equipment without losing sight of who or what a project depends on.",
    benefits: ["Better resource planning", "Reliable purchase records", "Material visibility", "Reduced administrative work"],
    ctaText: "Organise Your Resources",
  },
  {
    id: "construction-finance",
    icon: Receipt,
    title: "Construction Financial Control",
    subtitle: "Track commitments, costs, and payments with confidence",
    items: ["Construction invoices", "Subcontracts and change orders", "Allowances and project budgets", "Bills and lien waivers", "Commitment logs and progress payments"],
    description: "Connect project delivery to financial control. Keep budgets, subcontracts, change orders, bills, lien waivers, commitments, and progress payments visible so owners and teams can make decisions from current information.",
    benefits: ["Clear committed costs", "Fewer payment surprises", "Better change-order control", "Audit-ready financial records"],
    ctaText: "Control Project Finances",
  },
];

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));
