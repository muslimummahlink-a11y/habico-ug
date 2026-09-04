import { Users, Receipt, Wrench, ShieldCheck, Building2, FileText, type LucideIcon } from "lucide-react";

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
    id: "tenant-management",
    icon: Users,
    title: "Tenant Management",
    subtitle: "End-to-end tenant lifecycle management",
    items: ["Marketing & advertising vacancies", "Screening prospective tenants", "Lease agreements and renewals", "Move-ins and move-outs", "Complaints and disputes", "Lease term enforcement"],
    description: "We handle every step of the tenant journey — from finding qualified tenants to managing day-to-day relationships. Our team ensures your property is always occupied by reliable tenants who pay on time.",
    benefits: ["Reduced vacancy periods", "Quality tenant screening", "Legal lease documentation", "Professional dispute resolution", "24/7 tenant support"],
    ctaText: "Get Tenant Management",
  },
  {
    id: "rent-collection",
    icon: Receipt,
    title: "Rent Collection & Finance",
    subtitle: "Hassle-free rent collection with full transparency",
    items: ["Setting and collecting rent", "Late fees and notices", "Monthly financial statements", "Budgeting and forecasting", "Tax and regulatory filings"],
    description: "Say goodbye to chasing tenants for rent. We automate collection, enforce late fees, and deliver detailed monthly financial reports so you always know exactly how your property is performing.",
    benefits: ["Automated rent collection", "Late payment enforcement", "Monthly P&L statements", "Expense tracking & reconciliation", "Tax-ready documentation"],
    ctaText: "Streamline Your Finances",
  },
  {
    id: "maintenance",
    icon: Wrench,
    title: "Maintenance & Repairs",
    subtitle: "Proactive maintenance that protects your investment",
    items: ["Routine maintenance scheduling", "Emergency repair handling", "Vendor & contractor management", "Property inspections"],
    description: "Protect your property value with our proactive maintenance program. We schedule regular inspections, handle emergency repairs swiftly, and manage a vetted network of trusted contractors — all at competitive rates.",
    benefits: ["Extended property lifespan", "Preventive issue detection", "Vetted contractor network", "Competitive repair pricing", "Digital maintenance records"],
    ctaText: "Schedule Maintenance",
  },
  {
    id: "legal-compliance",
    icon: ShieldCheck,
    title: "Legal & Compliance",
    subtitle: "Stay compliant and legally protected",
    items: ["Local, state, federal compliance", "Lawful eviction handling", "Safety inspections & certifications"],
    description: "Navigate Uganda's complex regulatory landscape with confidence. We ensure your property meets all legal requirements, handle evictions properly when needed, and keep you protected from liability.",
    benefits: ["Full regulatory compliance", "Proper eviction procedures", "Safety certification management", "Legal document handling", "Risk mitigation"],
    ctaText: "Ensure Compliance",
  },
  {
    id: "property-marketing",
    icon: Building2,
    title: "Property Marketing & Leasing",
    subtitle: "Get your property noticed by the right tenants",
    items: ["Professional photography & listings", "Online & offline marketing", "Hosting property showings", "Negotiating lease terms"],
    description: "We showcase your property across multiple channels — professional photography, online listings, social media, and our own network. Our leasing experts handle showings and negotiate terms to get you the best deal.",
    benefits: ["Professional photography", "Multi-channel exposure", "Qualified tenant inquiries", "Expert lease negotiation", "Faster lease-up times"],
    ctaText: "Market Your Property",
  },
  {
    id: "administrative",
    icon: FileText,
    title: "Administrative Duties",
    subtitle: "Paperwork handled, so you can focus on what matters",
    items: ["Accurate records & documentation", "Owner & tenant communication", "Insurance and property docs"],
    description: "Leave the paperwork to us. We maintain meticulous records, manage all owner and tenant correspondence, and keep insurance and property documentation up to date — giving you complete peace of mind.",
    benefits: ["Centralized digital records", "Professional communication", "Insurance documentation", "Document storage & backup", "Audit-ready reporting"],
    ctaText: "Simplify Administration",
  },
];

export const serviceById = Object.fromEntries(services.map((s) => [s.id, s]));
