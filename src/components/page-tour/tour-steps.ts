export interface TourStep {
  title: string;
  content: string;
  example?: string;
  selector: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export interface PageTourConfig {
  route: string;
  title: string;
  description: string;
  steps: TourStep[];
}

const dashboardTour: PageTourConfig = {
  route: "/dashboard",
  title: "Welcome to Habico Portal",
  description: "Your command center for property and construction management.",
  steps: [
    {
      title: "Quick Stats",
      content: "These cards show your key metrics at a glance — total properties, active tenants, pending payments, and collection rate. Numbers update in real-time.",
      example: "Properties: 12 means you manage 12 buildings/units. Collection Rate: 94% means 94% of expected rent was collected this month.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Quick Actions",
      content: "Use the sidebar navigation to jump to any module. Each section has its own dashboard with detailed analytics.",
      example: "Click 'Properties' to manage your portfolio, or 'Payments' to record rent collections.",
      selector: "nav",
      placement: "right",
    },
  ],
};

const propertiesTour: PageTourConfig = {
  route: "/properties",
  title: "Properties Portfolio",
  description: "Manage all your buildings, units, and property details in one place.",
  steps: [
    {
      title: "Portfolio Overview",
      content: "These stats show total properties, total units across all properties, current occupancy rate (%), and total vacant units. Aim for 90%+ occupancy.",
      example: "If you have 12 properties with 48 units and 43 are occupied, your occupancy rate is 89.6% — that means 5 units are vacant and need marketing.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Add New Property",
      content: "Click this button to add a new property to your portfolio. Fill in the property name, address, number of units, and assign a landlord.",
      example: "Adding 'Sunset Apartments, Ntinda' with 8 units lets you then create individual unit records and assign tenants to each unit.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "Search & Filter",
      content: "Use the search bar to quickly find any property by name or location. You can also filter by status (active/vacant/maintenance).",
      example: "Type 'Ntinda' to instantly see all properties in the Ntinda area.",
      selector: "input[placeholder*='Search']",
      placement: "bottom",
    },
    {
      title: "Property Cards",
      content: "Each card shows a property with its image, name, address, total units, occupancy status, and monthly revenue. Click any card to see full details including unit-level data and tenant information.",
      example: "Click 'Sunset Apartments' to see Unit 1 (occupied by John, UGX 500k/month), Unit 2 (vacant), etc.",
      selector: ".grid.md\\:grid-cols-2",
      placement: "top",
    },
  ],
};

const tenantsTour: PageTourConfig = {
  route: "/tenants",
  title: "Tenant Management",
  description: "Track all your tenants, their lease status, balances, and contact details.",
  steps: [
    {
      title: "Tenant Stats",
      content: "See total tenants, active tenants, tenants with outstanding balances, and total arrears amount. Monitor arrears closely — anything over 30 days needs follow-up.",
      example: "If 'Arrears' shows UGX 2.5M across 3 tenants, those tenants need payment reminders or follow-up calls.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Add New Tenant",
      content: "Click to register a new tenant. The form has tabs for Basic Info, Lease Details, Emergency Contact, Employment, and Portal Access.",
      example: "When adding 'Sarah Okello', fill in her phone (+256...), assign her to 'Sunset Apt - Unit 3', set monthly rent to UGX 600,000, and enable portal access so she can view her lease online.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "Search Tenants",
      content: "Search by tenant name, phone number, or property name. Use tab filters to view All, Active, Inactive, or Overdue tenants.",
      example: "Click the 'Overdue' tab to see only tenants with unpaid rent — these are your priority collection targets.",
      selector: "input[placeholder*='Search']",
      placement: "bottom",
    },
    {
      title: "Tenant Cards",
      content: "Each card shows tenant name, contact, assigned property/unit, lease dates, and outstanding balance. Click to edit or view full profile.",
      example: "A card showing 'Balance: UGX 600,000' in red means that tenant owes one month's rent and needs a reminder.",
      selector: ".grid.md\\:grid-cols-2",
      placement: "top",
    },
  ],
};

const paymentsTour: PageTourConfig = {
  route: "/payments",
  title: "Payment Tracking",
  description: "Record, track, and reconcile all rent payments and income.",
  steps: [
    {
      title: "Financial Summary",
      content: "These cards show this month's total income, rent collected, outstanding arrears, and collection rate percentage. This is your financial health dashboard.",
      example: "UGX 8.5M collected this month with a 94% collection rate means you've collected UGX 8.5M out of UGX 9.04M expected rent.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Record a Payment",
      content: "Click to log a new payment. Select the tenant, enter the amount, choose payment method (Cash, Mobile Money, Bank Transfer, Stripe), and the system auto-links it to their lease.",
      example: "Recording 'John pays UGX 500,000 via Mobile Money' updates his balance to zero and generates a receipt automatically.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "Payment History",
      content: "The table shows all recorded payments with date, tenant, amount, method, and status. Use the search to find specific payments. Each row has a receipt download button.",
      example: "Search for 'March 2026' to see all payments received in March, or filter by tenant name to see one person's payment history.",
      selector: "table",
      placement: "top",
    },
  ],
};

const leasesTour: PageTourConfig = {
  route: "/leases",
  title: "Lease Agreements",
  description: "Create, manage, and track all rental lease agreements.",
  steps: [
    {
      title: "Lease Overview",
      content: "See total active leases, expiring soon (within 30 days), expired leases, and average lease duration. Track lease renewals proactively.",
      example: "If 5 leases expire next month, start renewal conversations now to avoid vacancies.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Create Lease",
      content: "Click to create a new lease agreement. Assign a tenant to a property unit, set the rent amount, deposit, start/end dates, and payment terms.",
      example: "Create a 12-month lease for Sarah in Sunset Apt Unit 3 starting 1st April 2026 at UGX 600,000/month with 1 month deposit (UGX 600,000).",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "E-Signing",
      content: "After creating a lease, you can send it for digital signing via the E-Leasing module. Tenants sign on their phones — no paper needed.",
      example: "Click 'Send for Signing' to email the lease PDF to the tenant. They receive a link to review and sign digitally.",
      selector: "table",
      placement: "top",
    },
  ],
};

const landlordsTour: PageTourConfig = {
  route: "/landlords",
  title: "Landlord Management",
  description: "Manage property owners, their portfolios, and financial summaries.",
  steps: [
    {
      title: "Landlord Portfolio",
      content: "Each landlord card shows their name, contact, number of properties managed, total units, and monthly rental income. This helps you track owner relationships.",
      example: "Mr. Ssempijja owns 3 properties with 12 units generating UGX 6.5M/month total rent.",
      selector: ".grid.md\\:grid-cols-2",
      placement: "top",
    },
    {
      title: "Add Landlord",
      content: "Register a new property owner. Their properties will appear here once you assign them during property creation.",
      example: "Adding 'Mrs. Nakato' lets you then create properties under her ownership for management.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const projectsTour: PageTourConfig = {
  route: "/projects",
  title: "Construction Projects",
  description: "Manage all your construction projects from planning to completion.",
  steps: [
    {
      title: "Project Stats",
      content: "Track active projects, total budget allocated, amount spent so far, and average completion rate. This gives you a bird's-eye view of your construction portfolio.",
      example: "5 active projects with UGX 2.5B budget and 68% completion means UGX 1.7B has been spent and you're ahead of schedule overall.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Create Project",
      content: "Click to start a new construction project. Set the project name, client, location, start/end dates, budget, and assign a project manager.",
      example: "Create 'Mukono School Block' for client 'Mukono DLC' with UGX 250M budget, 6-month timeline, and assign site engineer James as PM.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "Project List",
      content: "Each row shows project name, client, status (planning/active/on-hold/completed), budget, spent amount, and completion percentage. Click to open the full project workspace.",
      example: "A project showing '75% complete, UGX 180M of UGX 250M spent' means you have UGX 70M remaining — monitor closely for overruns.",
      selector: "table",
      placement: "top",
    },
  ],
};

const leadsTour: PageTourConfig = {
  route: "/leads",
  title: "Sales Leads Pipeline",
  description: "Track potential clients from inquiry to won/lost. Your sales funnel.",
  steps: [
    {
      title: "Pipeline Stats",
      content: "See total leads, leads won (converted to projects), leads lost, and your conversion rate. A good conversion rate is 25-40%.",
      example: "20 total leads with 8 won = 40% conversion. That means 4 out of 10 inquiries become paying projects.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Add Lead",
      content: "Log a new potential client. Enter their name, company, contact info, project description, estimated budget, and source (referral/website/walk-in).",
      example: "A lead from 'Kampala City Council' for a '5-storey office block' estimated at UGX 5B from a 'referral' source.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "Lead Status",
      content: "Move leads through stages: New → Contacted → Proposal Sent → Negotiation → Won/Lost. The status badges show where each lead is in your pipeline.",
      example: "A lead with 'Proposal Sent' status means you've already submitted a quotation — follow up within 48 hours to close.",
      selector: "table",
      placement: "top",
    },
  ],
};

const estimatesTour: PageTourConfig = {
  route: "/estimates",
  title: "Cost Estimates",
  description: "Prepare detailed cost estimates for potential projects before sending formal quotations.",
  steps: [
    {
      title: "Estimate Stats",
      content: "Total estimates created, approved total value, pending estimates count, and approval rate. Track how efficiently you're converting estimates to projects.",
      example: "15 estimates with 60% approval rate means 9 out of 15 estimates were accepted by clients.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Create Estimate",
      content: "Click to build a new cost estimate. Add a title, description, line items with quantities and unit prices. The system auto-calculates subtotal, tax, and total.",
      example: "Create 'EST-001' for 'Warehouse Construction' with line items: Foundation (UGX 25M), Walls (UGX 45M), Roofing (UGX 28M). Total auto-calculates to UGX 98M + 18% tax.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const quotationsTour: PageTourConfig = {
  route: "/quotations",
  title: "Quotations",
  description: "Create professional branded quotations with line items and download as PDF.",
  steps: [
    {
      title: "Quotation Stats",
      content: "Total quotations sent, accepted value, pending/draft count, and acceptance rate. Your acceptance rate measures how competitive your pricing is.",
      example: "8 quotations with 50% acceptance means 4 clients accepted your pricing — review rejected ones to improve future quotes.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Create Quotation",
      content: "Click to create a new quotation. Enter client details (name, email, phone), project scope, line items with quantities and prices, set tax rate and discount, and add terms & conditions.",
      example: "Create 'QT-2026-001' for 'Mukono DLC' with 11 line items totaling UGX 185M, 18% tax, UGX 5M discount = UGX 213.3M final total.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
    {
      title: "Download PDF",
      content: "Each quotation has a download button that generates a professional branded PDF with your company header, logo, and all quotation details. Ready to email to clients.",
      example: "Click the download icon on any row to get a PDF like 'quotation-QT-2026-001-mukono-district-local-government.pdf'.",
      selector: "table",
      placement: "top",
    },
  ],
};

const constructionInvoicesTour: PageTourConfig = {
  route: "/construction-invoices",
  title: "Construction Invoices",
  description: "Issue and track invoices for construction work done.",
  steps: [
    {
      title: "Invoice Summary",
      content: "Total invoiced amount, collected payments, outstanding balance, and overdue count. This is your accounts receivable dashboard.",
      example: "UGX 500M invoiced, UGX 350M collected = UGX 150M outstanding. If 3 are overdue past 30 days, send reminders immediately.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Create Invoice",
      content: "Generate an invoice linked to a project. Add line items for work completed, set payment terms, and send to the client for payment.",
      example: "Invoice #INV-001 for 'Mukono School' — Phase 1 Foundation Complete: UGX 45M, due within 30 days.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const expensesTour: PageTourConfig = {
  route: "/expenses",
  title: "Expense Tracking",
  description: "Record and categorize all project and business expenses.",
  steps: [
    {
      title: "Expense Overview",
      content: "Total expenses this month, by category breakdown, and budget vs actual comparison. Keep expenses below 85% of revenue for healthy margins.",
      example: "If total expenses are UGX 12M and revenue is UGX 15M, your margin is 20% — that's healthy for construction.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Record Expense",
      content: "Log any expense — materials, labor, transport, permits, etc. Attach receipts, assign to a project and cost code for accurate project accounting.",
      example: "Record 'Cement purchase, 50 bags @ UGX 28,000 = UGX 1.4M' for project 'Mukono School', cost code 'MAT-001'.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const suppliersTour: PageTourConfig = {
  route: "/suppliers",
  title: "Supplier Management",
  description: "Manage your material suppliers, track orders, and compare prices.",
  steps: [
    {
      title: "Supplier Directory",
      content: "All your approved suppliers with their specialties, contact info, and total order value. Build strong relationships with reliable suppliers.",
      example: "Jumba Hardware (Building Materials) — UGX 45M in orders, reliable delivery. Use them for cement, steel, and aggregates.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Add Supplier",
      content: "Register a new supplier with their company name, specialty (materials/equipment/services), contact details, and payment terms.",
      example: "Add 'Uganda Steel Mills' as a Steel supplier, contact +256-772-XXX, terms: Net 30 days.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const purchaseOrdersTour: PageTourConfig = {
  route: "/purchase-orders",
  title: "Purchase Orders",
  description: "Create and track material purchase orders to suppliers.",
  steps: [
    {
      title: "PO Tracker",
      content: "Track pending, approved, delivered, and cancelled purchase orders. Always approve POs before materials arrive on site.",
      example: "PO-001 for 500 bags of cement from Jumba Hardware, UGX 14M, status: Pending — needs manager approval before dispatch.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Create PO",
      content: "Generate a purchase order linked to a project and supplier. Add items with quantities and agreed prices. The supplier receives the PO for fulfillment.",
      example: "Create PO for 'Mukono School' from 'Jumba Hardware': 200 bags cement @ UGX 28K, 50 tons aggregate @ UGX 180K/ton.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const receiptsTour: PageTourConfig = {
  route: "/receipts",
  title: "Receipt Management",
  description: "Generate and manage branded receipts for all payments received.",
  steps: [
    {
      title: "Receipt List",
      content: "All generated receipts with receipt number, client name, amount, date, and status. Receipts are auto-generated when you record a payment.",
      example: "Receipt RCP-2026-045 for 'Sarah Okello', UGX 600,000, dated 15 March 2026 — download as PDF anytime.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Download Receipt",
      content: "Click the download button on any receipt to get a professionally branded PDF with your company logo, payment details, and thank-you message.",
      example: "The PDF includes: Company header, receipt number, payer name, amount in words and figures, payment method, and date.",
      selector: "button:has(.lucide-download)",
      placement: "bottom",
    },
  ],
};

const employeesTour: PageTourConfig = {
  route: "/employees",
  title: "Employee Management",
  description: "Manage your workforce — site staff, office team, and contractors.",
  steps: [
    {
      title: "Staff Directory",
      content: "View all employees with their role, department, contact, hire date, and employment status. Keep your team information organized and up to date.",
      example: "James Okello — Site Engineer, Construction Dept, hired Jan 2025, Active. Assigned to 2 projects.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Add Employee",
      content: "Register a new employee with personal details, job title, department, salary, emergency contact, and assign to projects if applicable.",
      example: "Add 'Mary NakATO' as Quantity Surveyor, Finance Dept, UGX 3.5M/month, assigned to Mukono School project.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const timesheetsTour: PageTourConfig = {
  route: "/timesheets",
  title: "Timesheets",
  description: "Track employee work hours, overtime, and project time allocation.",
  steps: [
    {
      title: "Time Tracking",
      content: "Log daily hours per employee per project. This data feeds into payroll and project cost tracking. Accurate timesheets = accurate project costing.",
      example: "James worked 8hrs on Mukono School + 2hrs overtime = 10hrs total for 15 March 2026.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Log Hours",
      content: "Select the employee, date, project, regular hours, and overtime hours. The system calculates total cost based on their hourly rate.",
      example: "Log: Employee: James, Date: 15/03, Project: Mukono School, Hours: 8 regular + 2 OT.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const inventoryTour: PageTourConfig = {
  route: "/inventory",
  title: "Material Inventory",
  description: "Track materials on-site — stock levels, usage, and reorder alerts.",
  steps: [
    {
      title: "Stock Overview",
      content: "See total items, low-stock alerts, total inventory value, and items out of stock. Never run out of critical materials on site.",
      example: "If cement shows 'Low Stock: 5 bags' and you need 50 for next week's pour, reorder immediately from your supplier.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Add Material",
      content: "Register a new material in your inventory with name, category, unit of measure, current quantity, minimum stock level, and unit cost.",
      example: "Add 'Portland Cement 50kg', Category: Cement, Unit: Bags, Qty: 150, Min Level: 20, Cost: UGX 28,000/bag.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const projectDocumentsTour: PageTourConfig = {
  route: "/project-documents",
  title: "Project Documents",
  description: "Central document repository for all project files, drawings, and approvals.",
  steps: [
    {
      title: "Document Library",
      content: "All project documents organized by project and category — drawings, specifications, permits, contracts, and correspondence. Keep everything in one place.",
      example: "Mukono School folder contains: architectural drawings, structural drawings, building permit, and the signed contract.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Upload Document",
      content: "Upload any file type — PDFs, images, spreadsheets, drawings. Tag it with the project and category for easy retrieval.",
      example: "Upload 'structural-drawing-v2.pdf' tagged as Mukono School, Category: Drawings, Date: 15 March 2026.",
      selector: "button:has(.lucide-upload)",
      placement: "bottom",
    },
  ],
};

const projectPhotosTour: PageTourConfig = {
  route: "/project-photos",
  title: "Project Photos",
  description: "Document site progress with dated photos and annotations.",
  steps: [
    {
      title: "Photo Timeline",
      content: "Browse site photos organized by date and project. Visual progress documentation is critical for client reporting and dispute resolution.",
      example: "March 15 photos show foundation completion, March 22 shows wall construction at 50% — progress is on schedule.",
      selector: ".grid",
      placement: "top",
    },
    {
      title: "Upload Photos",
      content: "Take or upload site photos with automatic date stamp, project assignment, and optional description. Create a visual timeline of your project.",
      example: "Upload 10 photos from today's site visit, tag as 'Mukono School - Day 45 Progress', add description: 'Walls complete, roof starting tomorrow'.",
      selector: "button:has(.lucide-upload)",
      placement: "bottom",
    },
  ],
};

const dailyLogsTour: PageTourConfig = {
  route: "/daily-logs",
  title: "Daily Construction Logs",
  description: "Record daily site activities, weather, manpower, and issues.",
  steps: [
    {
      title: "Log Entries",
      content: "Each entry captures a day's work: date, weather, workers on site, activities completed, materials delivered, and any issues. This is your legal record of site activity.",
      example: "Day 45: Sunny, 12 workers, Activities: Wall plastering (Block A), Materials: 20 bags cement delivered, Issues: Delayed steel delivery.",
      selector: "table",
      placement: "top",
    },
    {
      title: "New Log Entry",
      content: "Create a daily log with weather conditions, headcount, work done, deliveries, equipment used, visitors, and safety observations.",
      example: "Log: Date 15/03, Weather: Sunny 28°C, Workers: 12 (8 masons + 4 laborers), Work: Completed Block A walls, Delivered: 20 bags cement.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const rfisTour: PageTourConfig = {
  route: "/rfis",
  title: "Requests for Information (RFIs)",
  description: "Formal requests for clarification on design, specs, or contract documents.",
  steps: [
    {
      title: "RFI Tracker",
      content: "Track all RFIs with their status (open/in-review/answered/closed). Unanswered RFIs can delay construction — keep response time under 7 days.",
      example: "RFI-012: 'Is the foundation depth 1.2m or 1.5m per structural drawings?' — Status: Open, Priority: High.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Submit RFI",
      content: "Submit a formal RFI with subject, detailed question, priority level, and assign to the responsible party (architect/engineer/client).",
      example: "Submit: 'Clarification needed on Column C3 reinforcement detail — drawings show 4Y16 but spec says 4Y20. Which is correct?'",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const safetyIncidentsTour: PageTourConfig = {
  route: "/safety-incidents",
  title: "Safety Incidents",
  description: "Report and track health, safety, and environmental incidents on site.",
  steps: [
    {
      title: "Safety Dashboard",
      content: "Track total incidents, open investigations, near-misses, and days since last incident. Safety is non-negotiable — aim for zero incidents.",
      example: "3 incidents this quarter (1 minor injury, 2 near-misses), 0 open investigations, 45 days since last incident.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Report Incident",
      content: "Log any safety incident or near-miss immediately. Include date, location, description, severity, people involved, and corrective actions taken.",
      example: "Report: 'Near-miss — worker almost hit by falling brick from scaffold. Corrective action: scaffold nets installed, toolbox talk conducted.'",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const sopTour: PageTourConfig = {
  route: "/sop",
  title: "Standard Operating Procedures",
  description: "Define and enforce standardized processes across all your projects.",
  steps: [
    {
      title: "SOP Dashboard",
      content: "Overview of all SOPs, compliance rate, and recent submissions. Consistent processes = consistent quality across projects.",
      example: "15 SOPs defined, 89% compliance rate — 3 SOPs need retraining based on recent checklist submissions.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Create SOP",
      content: "Define a new standard procedure with title, description, category, applicable projects, and attach reference documents.",
      example: "Create 'SOP-CON-001: Concrete Pouring Procedure' — steps, checklist, required PPE, quality checks, and sign-off requirements.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const costCodesTour: PageTourConfig = {
  route: "/cost-codes",
  title: "Cost Codes",
  description: "Standardized cost coding system for consistent financial tracking.",
  steps: [
    {
      title: "Code Structure",
      content: "Cost codes categorize every expense and revenue item. Use these in expenses, invoices, budgets, and purchase orders for accurate financial reporting.",
      example: "MAT-001 (Materials > Cement), LAB-003 (Labor > Masons), SUB-002 (Subcontract > Electrical) — every expense gets coded.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Add Cost Code",
      content: "Create a new cost code with code number, name, category (materials/labor/equipment/subcontract/overhead), and budget allocation.",
      example: "Add code 'EQP-001' for 'Concrete Mixer Rental', Category: Equipment, Budget: UGX 5M/quarter.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const projectBudgetTour: PageTourConfig = {
  route: "/project-budget",
  title: "Project Budget",
  description: "Set and monitor project budgets with real-time variance tracking.",
  steps: [
    {
      title: "Budget vs Actual",
      content: "See each project's budget, actual spend, variance, and percentage consumed. Green means under budget, red means over budget — act fast on red items.",
      example: "Mukono School: Budget UGX 250M, Spent UGX 180M (72%), Variance: +UGX 10M over on materials — need to cut elsewhere.",
      selector: "table",
      placement: "top",
    },
  ],
};

const projectDashboardTour: PageTourConfig = {
  route: "/project-dashboard",
  title: "Project Dashboard",
  description: "Construction operations overview — all projects, progress, and alerts.",
  steps: [
    {
      title: "Operations Overview",
      content: "At-a-glance view of all active projects with progress bars, upcoming milestones, delayed tasks, and safety alerts. Check this every morning.",
      example: "3 projects on track, 1 delayed (Mukono School - foundation 2 days behind due to rain), 2 safety alerts pending resolution.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
  ],
};

const projectSchedulesTour: PageTourConfig = {
  route: "/project-schedules",
  title: "Project Schedules",
  description: "Create and manage construction schedules with Gantt-style timelines.",
  steps: [
    {
      title: "Schedule View",
      content: "Visual timeline of all project activities with start/end dates, dependencies, and critical path. Delays on the critical path delay the entire project.",
      example: "Foundation (Week 1-4) → Walls (Week 5-10) → Roofing (Week 11-14) → Finishing (Week 15-20). Foundation delay cascades to all subsequent tasks.",
      selector: "table",
      placement: "top",
    },
  ],
};

const projectTasksTour: PageTourConfig = {
  route: "/project-tasks",
  title: "Project Tasks",
  description: "Break down projects into actionable tasks with assignments and deadlines.",
  steps: [
    {
      title: "Task Board",
      content: "Track tasks by status: To Do, In Progress, Review, Completed. Assign tasks to team members with due dates and priority levels.",
      example: "Task: 'Pour foundation Block A' assigned to James, Due: 20 March, Priority: High, Status: In Progress.",
      selector: "table",
      placement: "top",
    },
  ],
};

const submittalsTour: PageTourConfig = {
  route: "/submittals",
  title: "Submittals",
  description: "Submit and track shop drawings, material samples, and technical data for approval.",
  steps: [
    {
      title: "Submittal Log",
      content: "Track all submittals: drawings, material approvals, product data, samples. Each has a review status and approval deadline.",
      example: "SUB-001: Steel reinforcement shop drawing — Status: Under Review, Due: 25 March, Reviewer: Structural Engineer.",
      selector: "table",
      placement: "top",
    },
  ],
};

const meetingMinutesTour: PageTourConfig = {
  route: "/meeting-minutes",
  title: "Meeting Minutes",
  description: "Record and track decisions, action items, and attendees from project meetings.",
  steps: [
    {
      title: "Meeting Records",
      content: "Every project meeting should produce minutes with attendees, discussion points, decisions made, and action items with owners and deadlines.",
      example: "Progress Meeting 15/03: Attendees (Client, PM, Architect). Decision: Approve Variation V-003. Action: James to order extra steel by 20/03.",
      selector: "table",
      placement: "top",
    },
  ],
};

const punchListTour: PageTourConfig = {
  route: "/punch-list",
  title: "Punch List",
  description: "Track defects, incomplete work, and items needing correction before project handover.",
  steps: [
    {
      title: "Defect Tracker",
      content: "Before project handover, walk through and list all defects. Track them from identification to rectification. Project isn't complete until punch list is clear.",
      example: "Item #12: 'Scratch on living room wall tile, Block A Unit 3' — Assigned to: Tiler, Due: Before handover, Status: Rectified.",
      selector: "table",
      placement: "top",
    },
  ],
};

const constructionInvoicesPageTour: PageTourConfig = {
  route: "/construction-invoices",
  title: "Construction Invoices",
  description: "Issue, track, and reconcile invoices for construction work completed.",
  steps: [
    {
      title: "Receivables Dashboard",
      content: "Total invoiced amount across all projects, payments received, outstanding balance, and overdue count. This is your cash flow health check.",
      example: "Invoiced: UGX 850M, Collected: UGX 620M, Outstanding: UGX 230M, Overdue (3): UGX 85M — prioritize collecting the overdue amount.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
    {
      title: "Issue Invoice",
      content: "Create an invoice linked to a project. Add line items for completed work phases, materials supplied, or agreed milestones.",
      example: "Invoice #INV-001 for Mukono School: Phase 1 Foundation Complete UGX 45M, Phase 2 Walls 50% UGX 22.5M = Total UGX 67.5M.",
      selector: "button:has(.lucide-plus)",
      placement: "bottom",
    },
  ],
};

const subcontractsTour: PageTourConfig = {
  route: "/subcontracts",
  title: "Subcontracts",
  description: "Manage agreements with subcontractors for specialized work.",
  steps: [
    {
      title: "Subcontract Register",
      content: "All subcontractor agreements with scope, contract value, status, and payment history. Clear subcontracts prevent disputes.",
      example: "Electrical Works subcontract with ABC Electric, UGX 12M, Status: Active, Paid: UGX 8M, Remaining: UGX 4M.",
      selector: "table",
      placement: "top",
    },
  ],
};

const changeOrdersTour: PageTourConfig = {
  route: "/change-orders",
  title: "Change Orders",
  description: "Track variations to the original scope, cost, and timeline.",
  steps: [
    {
      title: "Change Order Log",
      content: "Every scope change must be documented with justification, cost impact, and timeline impact. Unapproved changes cause disputes.",
      example: "CO-003: Additional perimeter wall (client request), Cost: +UGX 15M, Time: +2 weeks, Status: Approved by client.",
      selector: "table",
      placement: "top",
    },
  ],
};

const allowancesTour: PageTourConfig = {
  route: "/allowances",
  title: "Allowances",
  description: "Set and track budget allowances for specific work categories.",
  steps: [
    {
      title: "Budget Allowances",
      content: "Pre-set amounts allocated for specific items (e.g., kitchen fittings, tiles, paint). Track actual vs allowance to avoid cost overruns.",
      example: "Kitchen fittings allowance: UGX 8M, Spent: UGX 6.5M (remaining UGX 1.5M) — within budget, can upgrade finishes.",
      selector: "table",
      placement: "top",
    },
  ],
};

const billsTour: PageTourConfig = {
  route: "/bills",
  title: "Bills & Payables",
  description: "Track bills from suppliers and subcontractors that need payment.",
  steps: [
    {
      title: "Accounts Payable",
      content: "All incoming bills sorted by due date. Pay on time to maintain good supplier relationships and avoid late penalties.",
      example: "Bill from Jumba Hardware for cement UGX 14M, Due: 30 March. Bill from ABC Electric UGX 4M, Due: 15 March — pay ABC first.",
      selector: "table",
      placement: "top",
    },
  ],
};

const lienWaiversTour: PageTourConfig = {
  route: "/lien-waivers",
  title: "Lien Waivers",
  description: "Track lien waivers from subcontractors and suppliers to protect against claims.",
  steps: [
    {
      title: "Lien Protection",
      content: "Collect lien waivers with every payment to subcontractors. This protects you from mechanic's liens on the property.",
      example: "Collect conditional lien waiver from ABC Electric with their payment of UGX 4M — this confirms they won't file a lien for that work.",
      selector: "table",
      placement: "top",
    },
  ],
};

const commitmentLogTour: PageTourConfig = {
  route: "/commitment-log",
  title: "Commitment Log",
  description: "Track all financial commitments — contracts, POs, and verbal agreements.",
  steps: [
    {
      title: "Commitment Tracker",
      content: "Every financial obligation should be logged here before the money goes out. This prevents budget surprises and ensures proper authorization.",
      example: "Commitment CM-015: PO for steel reinforcement, UGX 35M, Authorized by: Project Manager, Budget Line: MAT-002.",
      selector: "table",
      placement: "top",
    },
  ],
};

const progressPaymentsTour: PageTourConfig = {
  route: "/progress-payments",
  title: "Progress Payments",
  description: "Track milestone-based payments for construction work completed.",
  steps: [
    {
      title: "Milestone Payments",
      content: "Construction payments are typically milestone-based. Track each milestone's completion, certification, and payment status.",
      example: "Milestone 3: 'Superstructure Complete' — Certified: 15/03, Amount: UGX 45M, Paid: UGX 45M, Status: Complete.",
      selector: "table",
      placement: "top",
    },
  ],
};

const sopChecklistsTour: PageTourConfig = {
  route: "/sop-checklists",
  title: "SOP Checklists",
  description: "Standardized checklists that staff complete for each SOP procedure.",
  steps: [
    {
      title: "Compliance Checklists",
      content: "Each SOP has a corresponding checklist. Staff must complete these on-site to prove compliance. Non-compliance triggers retraining.",
      example: "Checklist for 'Concrete Pouring SOP': ☐ Formwork inspected ☐ Rebar checked ☐ Mix design approved ☐ Test cubes taken ☐ Curing started.",
      selector: "table",
      placement: "top",
    },
  ],
};

const sopFormsTour: PageTourConfig = {
  route: "/sop-forms",
  title: "SOP Forms",
  description: "Digital forms for field data collection tied to SOP procedures.",
  steps: [
    {
      title: "Digital Forms",
      description: "Replace paper forms with digital ones. Staff fill them on-site via mobile, data syncs to the dashboard in real-time.",
      example: "Daily safety checklist form: Workers on site, PPE compliance, hazard observations, near-miss reporting — all submitted from the field.",
      selector: "table",
      placement: "top",
    },
  ],
};

const reportsTour: PageTourConfig = {
  route: "/reports",
  title: "Reports",
  description: "Generate and view financial reports across all modules.",
  steps: [
    {
      title: "Report Center",
      content: "Access financial summaries, project cost reports, payment reports, and more. Use these for decision-making and stakeholder updates.",
      example: "Generate a 'Monthly Construction Report' showing all projects' budget status, completed milestones, and upcoming activities.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
  ],
};

const financialReportsTour: PageTourConfig = {
  route: "/financial-reports",
  title: "Financial Reports",
  description: "Detailed financial statements, P&L, cash flow, and balance sheets.",
  steps: [
    {
      title: "Financial Statements",
      content: "View profit & loss, cash flow analysis, budget variance reports, and accounts aging. Critical for business health monitoring.",
      example: "P&L Report: Revenue UGX 500M, Costs UGX 380M, Profit UGX 120M (24% margin). Cash flow positive for 6 consecutive months.",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
  ],
};

const recurringBillingTour: PageTourConfig = {
  route: "/recurring-billing",
  title: "Recurring Billing",
  description: "Set up automatic monthly billing for recurring charges like rent and service fees.",
  steps: [
    {
      title: "Auto-Billing Setup",
      content: "Configure recurring bills that auto-generate each month. Tenants receive their rent invoice automatically — no manual work.",
      example: "Set up monthly rent of UGX 500,000 for John, due on the 1st of each month. System auto-generates the invoice and sends a notification.",
      selector: "table",
      placement: "top",
    },
  ],
};

const paymentProofsTour: PageTourConfig = {
  route: "/payment-proofs",
  title: "Payment Proofs",
  description: "Tenants upload payment receipts/screenshots for verification.",
  steps: [
    {
      title: "Payment Verification",
      content: "When tenants pay via mobile money or bank transfer, they upload proof here. You review and approve to reconcile their account.",
      example: "Tenant Sarah uploads M-Pesa screenshot showing UGX 600,000 transfer. You verify, approve, and her balance updates to zero.",
      selector: "table",
      placement: "top",
    },
  ],
};

const rentalMessagesTour: PageTourConfig = {
  route: "/rental-messages",
  title: "Rental Messages",
  description: "Communicate with tenants through the built-in messaging system.",
  steps: [
    {
      title: "Messaging Center",
      content: "Send and receive messages from tenants. All communication is logged and searchable — no more lost WhatsApp messages.",
      example: "Message from Sarah: 'The kitchen tap is leaking.' You reply: 'Maintenance team will visit tomorrow at 10am.' Both messages are logged.",
      selector: "table",
      placement: "top",
    },
  ],
};

const eLeasingTour: PageTourConfig = {
  route: "/e-leasing",
  title: "E-Leasing",
  description: "Digital lease creation, sending, and e-signature collection.",
  steps: [
    {
      title: "Digital Leases",
      content: "Create leases digitally, send to tenants for review, and collect legally binding e-signatures. No printing, scanning, or paper needed.",
      example: "Create lease for Sarah → Send via email → She reviews on her phone → Signs with a tap → You receive the signed PDF automatically.",
      selector: "table",
      placement: "top",
    },
  ],
};

const rentalIdCardsTour: PageTourConfig = {
  route: "/rental-id-cards",
  title: "Rental ID Cards",
  description: "Generate and manage tenant identification cards.",
  steps: [
    {
      title: "ID Card Management",
      content: "Generate professional tenant ID cards with their photo, name, unit, lease dates, and emergency contact. Useful for building access control.",
      example: "Generate ID card for Sarah Okello, Unit 3, Sunset Apartments, Valid: April 2026 - March 2027.",
      selector: "table",
      placement: "top",
    },
  ],
};

const listingBannersTour: PageTourConfig = {
  route: "/listing-banners",
  title: "Listing Banners",
  description: "Create marketing banners for vacant units and properties.",
  steps: [
    {
      title: "Marketing Banners",
      content: "Generate eye-catching banners with property photos, price, and contact info. Post on social media to attract tenants faster.",
      example: "Banner: '2BR Apartment in Ntinda — UGX 800K/month — Habico Property Managers — Call 0756742220'",
      selector: ".grid",
      placement: "top",
    },
  ],
};

const maintenanceTour: PageTourConfig = {
  route: "/maintenance",
  title: "Maintenance Requests",
  description: "Track and resolve tenant maintenance requests and repairs.",
  steps: [
    {
      title: "Maintenance Queue",
      content: "All tenant-reported issues sorted by priority and date. Average response time should be under 48 hours for non-emergency repairs.",
      example: "Request #15: 'Broken bathroom tile, Unit 5' — Priority: Medium, Assigned to: Maintenance team, ETA: 2 days.",
      selector: "table",
      placement: "top",
    },
  ],
};

const preventativeMaintenanceTour: PageTourConfig = {
  route: "/preventative-maintenance",
  title: "Preventative Maintenance",
  description: "Schedule recurring maintenance to prevent costly emergency repairs.",
  steps: [
    {
      title: "Scheduled Maintenance",
      content: "Set up recurring tasks like AC servicing, plumbing checks, pest control. Prevention costs 5x less than emergency repairs.",
      example: "Schedule: AC servicing every 3 months (next: 1 April), Pest control monthly, Plumbing inspection quarterly.",
      selector: "table",
      placement: "top",
    },
  ],
};

const rentalTaxDashboardTour: PageTourConfig = {
  route: "/rental-tax-dashboard",
  title: "Tax Dashboard",
  description: "Uganda Revenue Authority (URA) tax compliance for rental income.",
  steps: [
    {
      title: "Tax Compliance",
      content: "Track rental income tax obligations, withholding tax, and VAT. Stay compliant with URA deadlines to avoid penalties.",
      example: "Q1 2026 rental income: UGX 25M, Withholding tax (6%): UGX 1.5M, Due to URA by: 30 April. File on time!",
      selector: ".grid.gap-4",
      placement: "bottom",
    },
  ],
};

const moveServiceTour: PageTourConfig = {
  route: "/move-service",
  title: "Move In/Out Service",
  description: "Manage tenant move-in and move-out logistics.",
  steps: [
    {
      title: "Move Management",
      content: "Coordinate tenant moves — scheduling, inventory check, deposit handling, and unit condition reports. Smooth moves = happy tenants.",
      example: "Move-out for Unit 3: Scheduled 31 March, Deposit: UGX 600,000, Condition: Minor wall marks (deduct UGX 50,000), Refund: UGX 550,000.",
      selector: "table",
      placement: "top",
    },
  ],
};

const moveBookingsTour: PageTourConfig = {
  route: "/move-bookings",
  title: "Move Bookings",
  description: "Schedule and manage upcoming tenant move bookings.",
  steps: [
    {
      title: "Booking Calendar",
      content: "All scheduled moves in one view. Prevent double-booking lift access and ensure units are prepared before tenant arrival.",
      example: "31 March: Sarah moving IN to Unit 3 (unit prepped ✓), John moving OUT from Unit 7 (inspection scheduled).",
      selector: "table",
      placement: "top",
    },
  ],
};

const assetsTour: PageTourConfig = {
  route: "/assets",
  title: "Company Assets",
  description: "Track company-owned assets, equipment, and vehicles.",
  steps: [
    {
      title: "Asset Register",
      content: "Every company asset should be registered: vehicle, laptop, tools, furniture. Track depreciation, maintenance, and assignment.",
      example: "Toyota Hilux (Reg: UAX 123B), Assigned to: Site Manager, Last service: 15 Feb, Next service: 15 May, Value: UGX 85M.",
      selector: "table",
      placement: "top",
    },
  ],
};

const equipmentRentalsTour: PageTourConfig = {
  route: "/equipment-rentals",
  title: "Equipment Rentals",
  description: "Track rented equipment, costs, and return schedules.",
  steps: [
    {
      title: "Rental Tracker",
      content: "Log all rented equipment with daily/weekly rates, rental period, and total cost. Avoid late returns — they eat into project margins.",
      example: "CAT Excavator: Rented from BuildTech, UGX 1.5M/week, Start: 1 March, Expected return: 15 March, Cost: UGX 3M.",
      selector: "table",
      placement: "top",
    },
  ],
};

const settingsTour: PageTourConfig = {
  route: "/settings",
  title: "Settings",
  description: "Manage your account, company profile, branding, and integrations.",
  steps: [
    {
      title: "Account Settings",
      content: "Update your profile, change password, manage notification preferences, and configure company branding for documents.",
      example: "Upload your company logo in Branding tab to appear on all receipts, quotations, and tenancy agreements automatically.",
      selector: ".space-y-6",
      placement: "bottom",
    },
  ],
};

const habicoFinanceTour: PageTourConfig = {
  route: "/habico-finance",
  title: "Habico Finance",
  steps: [
    {
      title: "Company Financial Health",
      content: "This is Habico's overall financial dashboard combining rental income and construction revenue. See total revenue, expenses, net profit, and collection rate at a glance.",
      example: "The summary cards show Total Revenue, Total Expenses, Net Profit, Active Projects, and Collection Rate across both rental and construction divisions.",
      selector: ".grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-5",
      placement: "bottom",
    },
    {
      title: "Revenue Breakdown",
      content: "Monthly bar chart comparing rental income (blue) vs construction income (green) side by side. Quickly see which division is driving revenue each month.",
      example: "Use this to identify seasonal trends — rental tends to be steady while construction fluctuates with project milestones.",
      selector: ".recharts-responsive-container",
      placement: "top",
    },
    {
      title: "Project Profitability",
      content: "Table showing each project's financial performance: budget, invoices sent, invoices paid, expenses, and profit margin. Color-coded green for profit, red for loss.",
      example: "A project with 90% margin means for every UGX 100 billed, UGX 90 is profit after costs.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Monthly P&L",
      content: "Profit & Loss statement broken down by month showing rental income, construction income, total revenue, expenses, and net profit. Export as PDF for accounting.",
      example: "Use the PDF Download button to generate a formal P&L report for board meetings or tax filings.",
      selector: "button:has(.lucide-download)",
      placement: "bottom",
    },
  ],
};

const constructionFinanceTour: PageTourConfig = {
  route: "/construction-finance",
  title: "Construction Finance",
  steps: [
    {
      title: "Construction P&L Overview",
      content: "Summary cards showing Total Revenue (paid invoices), Total Costs (subcontracts + bills + expenses + POs), Gross Profit, and Gross Margin percentage for all construction projects.",
      example: "A Gross Margin of 25% means for every UGX 100 billed to clients, UGX 25 is profit after all construction costs.",
      selector: ".grid-cols-2.md\\:grid-cols-3.lg\\:grid-cols-6",
      placement: "bottom",
    },
    {
      title: "Revenue vs Costs Chart",
      content: "Monthly bar chart comparing construction revenue (green) against construction costs (red). Quickly see if costs are exceeding revenue in any month.",
      example: "If the red bar exceeds the green bar in a month, you're spending more than you're earning — time to investigate.",
      selector: ".recharts-responsive-container",
      placement: "top",
    },
    {
      title: "Cost Breakdown",
      content: "Shows where construction money is going: Subcontracts (labor), Bills (materials), Expenses, Purchase Orders, and Change Orders. Each category shows total and percentage of total costs.",
      example: "If Subcontracts are 60% of costs, that's typical for construction. If Expenses are high, review your expense categories.",
      selector: "table",
      placement: "top",
    },
    {
      title: "Project P&L Table",
      content: "Detailed profit and loss for each project: name, status, budget, revenue, all cost categories, total costs, profit/loss, and margin %. Color-coded green (profit) or red (loss).",
      example: "Sort by margin % to find your most and least profitable projects. Use this to price future bids more accurately.",
      selector: "table:last-of-type",
      placement: "top",
    },
    {
      title: "Outstanding Receivables",
      content: "Lists all unpaid construction invoices with project, client, amount, paid amount, outstanding balance, and days overdue. Follow up on these to improve cash flow.",
      example: "An invoice 45 days overdue for UGX 50M means you should contact the client immediately.",
      selector: "button:has(.lucide-download)",
      placement: "bottom",
    },
  ],
};

export const allTourConfigs: PageTourConfig[] = [
  dashboardTour,
  propertiesTour,
  tenantsTour,
  paymentsTour,
  leasesTour,
  landlordsTour,
  projectsTour,
  projectDashboardTour,
  projectSchedulesTour,
  projectTasksTour,
  leadsTour,
  estimatesTour,
  quotationsTour,
  constructionInvoicesTour,
  expensesTour,
  suppliersTour,
  purchaseOrdersTour,
  receiptsTour,
  employeesTour,
  timesheetsTour,
  inventoryTour,
  projectDocumentsTour,
  projectPhotosTour,
  dailyLogsTour,
  rfisTour,
  submittalsTour,
  meetingMinutesTour,
  safetyIncidentsTour,
  punchListTour,
  sopTour,
  sopChecklistsTour,
  sopFormsTour,
  costCodesTour,
  reportsTour,
  financialReportsTour,
  recurringBillingTour,
  paymentProofsTour,
  rentalMessagesTour,
  eLeasingTour,
  rentalIdCardsTour,
  listingBannersTour,
  maintenanceTour,
  preventativeMaintenanceTour,
  rentalTaxDashboardTour,
  moveServiceTour,
  moveBookingsTour,
  projectBudgetTour,
  subcontractsTour,
  changeOrdersTour,
  allowancesTour,
  billsTour,
  lienWaiversTour,
  commitmentLogTour,
  progressPaymentsTour,
  assetsTour,
  equipmentRentalsTour,
  settingsTour,
  habicoFinanceTour,
  constructionFinanceTour,
];

export function getTourConfig(route: string): PageTourConfig | undefined {
  return allTourConfigs.find((t) => t.route === route);
}
