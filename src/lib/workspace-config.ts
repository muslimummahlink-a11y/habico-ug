import {
  Building2, Home, Users, FileText, Receipt, Wrench, BarChart3,
  Settings, Package, Toolbox, ShoppingCart, Briefcase,
  HardHat, DollarSign, ClipboardList, Truck, Repeat, ShieldCheck,
  MessageSquare, FileSignature, CreditCard, QrCode, CalendarCheck, Calculator,
  PhoneCall, FileBadge, FolderOpen, ListChecks, ClipboardPen,
  MessageSquareQuote, FileUp, Handshake, GitCompareArrows, Clock,
  PiggyBank, Landmark, FileCheck, ClipboardCheck, Hash,
  ReceiptText, ScrollText, Gauge, CalendarRange, NotebookPen,
  ListTodo, TriangleAlert, FolderKanban, Image, Banknote, Bell, Smartphone,
  type LucideIcon, Crown, UserCog, User, Shield, BookOpen, Building, ArrowLeftRight,
  Palette, Target, Rocket, UsersRound, HardHatIcon, CircleDollarSign,
  BriefcaseBusiness, PersonStanding, Workflow, LayoutGrid
} from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  feature?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  feature?: string;
}

export interface WorkspaceNav {
  groups: NavGroup[];
  extraItems?: NavItem[];
}

export interface WorkspaceConfig {
  role: AppRole;
  name: string;
  badge: string;
  icon: LucideIcon;
  accent: string;
  accentForeground: string;
  sidebarHeaderBg: string;
  accentLight: string;
  defaultRoute: string;
  nav: WorkspaceNav;
  allowedRoutes: string[];
}

// ─── WORKFLOW-ORDERED ITEM GROUPS ───────────────────────────────────

const businessDevelopmentItems: NavItem[] = [
  { title: "Leads", url: "/leads", icon: PhoneCall },
  { title: "Estimates", url: "/estimates", icon: Calculator },
  { title: "Quotations", url: "/quotations", icon: ScrollText },
  { title: "Proposals", url: "/proposals", icon: FileBadge },
  { title: "Bid Packages", url: "/bid-packages", icon: FolderOpen },
];

const projectManagementItems: NavItem[] = [
  { title: "Projects", url: "/projects", icon: HardHat },
  { title: "Project Dashboard", url: "/project-dashboard", icon: Gauge },
  { title: "Project Schedule", url: "/project-schedules", icon: CalendarRange },
  { title: "Project Tasks", url: "/project-tasks", icon: ListChecks },
  { title: "Daily Logs", url: "/daily-logs", icon: ClipboardPen },
  { title: "RFIs", url: "/rfis", icon: MessageSquareQuote },
  { title: "Submittals", url: "/submittals", icon: FileUp },
  { title: "Meeting Minutes", url: "/meeting-minutes", icon: NotebookPen },
];

const qualitySafetyItems: NavItem[] = [
  { title: "Punch List", url: "/punch-list", icon: ListTodo },
  { title: "Safety Incidents", url: "/safety-incidents", icon: TriangleAlert },
  { title: "Project Documents", url: "/project-documents", icon: FolderKanban },
  { title: "Project Photos", url: "/project-photos", icon: Image },
];

const teamResourcesItems: NavItem[] = [
  { title: "Employees", url: "/employees", icon: Briefcase },
  { title: "Timesheets", url: "/timesheets", icon: Clock },
  { title: "Expenses", url: "/expenses", icon: DollarSign },
  { title: "Receipts", url: "/receipts", icon: ReceiptText },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Assets", url: "/assets", icon: Toolbox },
  { title: "Equipment Rentals", url: "/equipment-rentals", icon: ClipboardList },
];

const constructionFinancialItems: NavItem[] = [
  { title: "Construction Invoices", url: "/construction-invoices", icon: FileText },
  { title: "Subcontracts", url: "/subcontracts", icon: Handshake },
  { title: "Change Orders", url: "/change-orders", icon: GitCompareArrows },
  { title: "Allowances", url: "/allowances", icon: PiggyBank },
  { title: "Project Budget", url: "/project-budget", icon: Landmark },
  { title: "Bills", url: "/bills", icon: ScrollText },
  { title: "Lien Waivers", url: "/lien-waivers", icon: FileCheck },
  { title: "Commitment Log", url: "/commitment-log", icon: ReceiptText },
  { title: "Progress Payments", url: "/progress-payments", icon: Banknote },
];

const rentalItems: NavItem[] = [
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Landlords", url: "/landlords", icon: Landmark },
  { title: "Leases", url: "/leases", icon: FileText },
  { title: "Tenants", url: "/tenants", icon: Users },
  { title: "Payments", url: "/payments", icon: Receipt },
  { title: "Recurring Billing", url: "/recurring-billing", icon: Repeat },
  { title: "Payment Proofs", url: "/payment-proofs", icon: ShieldCheck },
  { title: "Messages", url: "/rental-messages", icon: MessageSquare },
  { title: "E-Leasing", url: "/e-leasing", icon: FileSignature },
  { title: "ID Cards", url: "/rental-id-cards", icon: CreditCard },
  { title: "Listing Banners", url: "/listing-banners", icon: QrCode },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Preventative Maintenance", url: "/preventative-maintenance", icon: CalendarCheck },
  { title: "Tax Dashboard", url: "/rental-tax-dashboard", icon: Calculator },
];

const servicesItems: NavItem[] = [
  { title: "Move In/Out", url: "/move-service", icon: ArrowLeftRight, feature: "move_service" },
  { title: "Move Bookings", url: "/move-bookings", icon: CalendarCheck, feature: "move_service" },
];

const sopItems: NavItem[] = [
  { title: "SOP Dashboard", url: "/sop", icon: ClipboardCheck },
  { title: "SOP Checklists", url: "/sop-checklists", icon: ListChecks },
  { title: "SOP Forms", url: "/sop-forms", icon: FileSignature },
  { title: "Cost Codes", url: "/cost-codes", icon: Hash },
];

const reportItems: NavItem[] = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Financial Reports", url: "/financial-reports", icon: DollarSign },
  { title: "Habico Finance", url: "/habico-finance", icon: Building, feature: "rental" },
  { title: "Construction Finance", url: "/construction-finance", icon: HardHatIcon, feature: "construction" },
];

const administrationItems: NavItem[] = [
  { title: "Companies", url: "/companies", icon: Building },
  { title: "Subscription Plans", url: "/subscription-plans", icon: Crown },
  { title: "Vendor Payments", url: "/vendor-payments", icon: CircleDollarSign },
  { title: "Pending Registrations", url: "/pending-registrations", icon: Clock },
  { title: "Pending Listings", url: "/pending-listings", icon: ClipboardList },
  { title: "Land Inquiries", url: "/land-inquiries", icon: MessageSquare },
  { title: "Payment Settings", url: "/payment-settings", icon: Smartphone },
  { title: "Dev Tools", url: "/dev-tools", icon: Settings },
];

// ─── FULL NAV (ADMIN / MANAGER) ────────────────────────────────────

const fullNav: WorkspaceNav = {
  groups: [
    { label: "Overview", items: [{ title: "Dashboard", url: "/dashboard", icon: Home }] },
    { label: "Business Development", items: businessDevelopmentItems, feature: "construction" },
    { label: "Project Management", items: projectManagementItems, feature: "construction" },
    { label: "Quality & Safety", items: qualitySafetyItems, feature: "construction" },
    { label: "Team & Resources", items: teamResourcesItems, feature: "construction" },
    { label: "Construction Financial", items: constructionFinancialItems, feature: "construction_financial" },
    { label: "Rental Management", items: rentalItems, feature: "rental" },
    { label: "Services", items: servicesItems, feature: "move_service" },
    { label: "Standards & Compliance", items: sopItems, feature: "sop" },
    { label: "Reports", items: reportItems, feature: "reports" },
    { label: "Administration", items: administrationItems },
  ],
  extraItems: [
    { title: "Settings", url: "/settings", icon: Settings, feature: "settings" },
  ],
};

// ─── ALLOWED ROUTES ────────────────────────────────────────────────

const allNavItems = [
  ...businessDevelopmentItems, ...projectManagementItems, ...qualitySafetyItems,
  ...teamResourcesItems, ...constructionFinancialItems, ...rentalItems,
  ...servicesItems, ...sopItems, ...reportItems, ...administrationItems,
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Settings", url: "/settings", icon: Settings },
];
const allowedAll = allNavItems.map((i) => i.url);

const constructionNavItems = [
  ...businessDevelopmentItems, ...projectManagementItems, ...qualitySafetyItems,
  ...teamResourcesItems, ...constructionFinancialItems, ...sopItems, ...reportItems,
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Settings", url: "/settings", icon: Settings },
];
const allowedConstruction = constructionNavItems.map((i) => i.url);

const rentalNavItems = [
  ...rentalItems, ...servicesItems,
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Settings", url: "/settings", icon: Settings },
];
const allowedRental = rentalNavItems.map((i) => i.url);

// ─── WORKSPACE CONFIGS ─────────────────────────────────────────────

export const workspaceConfigs: Record<AppRole, WorkspaceConfig> = {
  admin: {
    role: "admin",
    name: "Command Center",
    badge: "Admin",
    icon: Crown,
    accent: "oklch(0.72 0.17 55)",
    accentForeground: "oklch(1 0 0)",
    sidebarHeaderBg: "linear-gradient(135deg, oklch(0.28 0.06 200), oklch(0.38 0.07 200))",
    accentLight: "oklch(0.95 0.03 55)",
    defaultRoute: "/dashboard",
    nav: fullNav,
    allowedRoutes: allowedAll,
  },
  manager: {
    role: "manager",
    name: "Operations Hub",
    badge: "Manager",
    icon: UserCog,
    accent: "oklch(0.55 0.12 250)",
    accentForeground: "oklch(1 0 0)",
    sidebarHeaderBg: "linear-gradient(135deg, oklch(0.25 0.05 250), oklch(0.38 0.08 250))",
    accentLight: "oklch(0.93 0.03 250)",
    defaultRoute: "/dashboard",
    nav: fullNav,
    allowedRoutes: allowedAll,
  },
  staff: {
    role: "staff",
    name: "Field Workspace",
    badge: "Staff",
    icon: HardHat,
    accent: "oklch(0.7 0.18 70)",
    accentForeground: "oklch(1 0 0)",
    sidebarHeaderBg: "linear-gradient(135deg, oklch(0.3 0.06 70), oklch(0.45 0.1 70))",
    accentLight: "oklch(0.95 0.04 70)",
    defaultRoute: "/project-dashboard",
    nav: {
      groups: [
        { label: "Overview", items: [{ title: "Dashboard", url: "/dashboard", icon: Home }] },
        { label: "Business Development", items: businessDevelopmentItems, feature: "construction" },
        { label: "Project Management", items: projectManagementItems, feature: "construction" },
        { label: "Quality & Safety", items: qualitySafetyItems, feature: "construction" },
        { label: "Team & Resources", items: teamResourcesItems, feature: "construction" },
        { label: "Construction Financial", items: constructionFinancialItems, feature: "construction_financial" },
        { label: "Standards & Compliance", items: sopItems, feature: "sop" },
        { label: "Reports", items: reportItems, feature: "reports" },
      ],
      extraItems: [
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
    allowedRoutes: allowedConstruction,
  },
  owner: {
    role: "owner",
    name: "Owner Portal",
    badge: "Owner",
    icon: Shield,
    accent: "oklch(0.7 0.18 85)",
    accentForeground: "oklch(1 0 0)",
    sidebarHeaderBg: "linear-gradient(135deg, oklch(0.3 0.06 85), oklch(0.45 0.1 85))",
    accentLight: "oklch(0.95 0.04 85)",
    defaultRoute: "/dashboard",
    nav: {
      groups: [
        { label: "Overview", items: [{ title: "Dashboard", url: "/dashboard", icon: Home }] },
        { label: "Properties", items: [
          { title: "My Properties", url: "/properties", icon: Building2 },
          { title: "Leases", url: "/leases", icon: FileText },
          { title: "Payments", url: "/payments", icon: Receipt },
          { title: "Tax Dashboard", url: "/rental-tax-dashboard", icon: Calculator },
        ]},
        { label: "Services", items: [
          { title: "Maintenance", url: "/maintenance", icon: Wrench },
          { title: "Reports", url: "/reports", icon: BarChart3 },
        ]},
      ],
      extraItems: [
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
    allowedRoutes: allowedRental,
  },
  tenant: {
    role: "tenant",
    name: "Tenant Portal",
    badge: "Tenant",
    icon: User,
    accent: "oklch(0.58 0.13 155)",
    accentForeground: "oklch(1 0 0)",
    sidebarHeaderBg: "linear-gradient(135deg, oklch(0.28 0.06 155), oklch(0.4 0.1 155))",
    accentLight: "oklch(0.94 0.04 155)",
    defaultRoute: "/my-id-card",
    nav: {
      groups: [
        { label: "My Home", items: [
          { title: "Dashboard", url: "/dashboard", icon: Home },
          { title: "My ID Card", url: "/my-id-card", icon: CreditCard },
        ]},
        { label: "Rental", items: [
          { title: "My Lease", url: "/leases", icon: FileText },
          { title: "My Payments", url: "/payments", icon: Receipt },
          { title: "Payment Proofs", url: "/payment-proofs", icon: ShieldCheck },
          { title: "Messages", url: "/rental-messages", icon: MessageSquare },
          { title: "My Documents", url: "/my-documents", icon: FileText },
        ]},
        { label: "Services", items: [
          { title: "Maintenance", url: "/maintenance", icon: Wrench },
          { title: "Book a Move", url: "/book-move", icon: ArrowLeftRight },
          { title: "Notifications", url: "/notifications", icon: Bell },
        ]},
      ],
      extraItems: [
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    },
    allowedRoutes: [
      ...rentalItems.map((i) => i.url),
      "/dashboard", "/my-id-card", "/settings",
      "/my-documents", "/notifications", "/book-move",
    ],
  },
};

export function getWorkspace(role: AppRole | null): WorkspaceConfig {
  return workspaceConfigs[role ?? "admin"] ?? workspaceConfigs.admin;
}
