import {
  ArrowRight, FileText, Send, CheckCircle, Download, Plus,
  Calendar, DollarSign, Users, FolderKanban, ClipboardList,
  Receipt, FileCheck, AlertTriangle, Truck, Package,
} from "lucide-react";

export interface WorkflowAction {
  label: string;
  to: string;
  icon?: any;
  variant?: "default" | "outline" | "secondary" | "destructive";
  color?: string;
  paramKey?: string;
  paramValue?: (item: any) => string;
  precondition?: (item: any) => boolean;
}

export interface StatusConfig {
  color: string;
  bg: string;
  label: string;
}

export interface EntityWorkflowConfig {
  statuses: Record<string, StatusConfig>;
  actions: WorkflowAction[];
  metricFields?: { key: string; label: string; format?: "currency" | "number" | "date" }[];
  subtitleField?: string;
  titleField?: string;
  icon?: any;
}

const UGX = (n: number) => `UGX ${n.toLocaleString()}`;

export const workflowConfigs: Record<string, EntityWorkflowConfig> = {
  leads: {
    titleField: "contact_name",
    subtitleField: "company",
    icon: Users,
    statuses: {
      new: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "New" },
      contacted: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Contacted" },
      qualified: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Qualified" },
      proposal: { color: "text-purple-700", bg: "bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400", label: "Proposal" },
      won: { color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Won" },
      lost: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Lost" },
    },
    metricFields: [
      { key: "budget_range_min", label: "Budget Min", format: "currency" },
      { key: "budget_range_max", label: "Budget Max", format: "currency" },
    ],
    actions: [
      { label: "Create Estimate", to: "/estimates", icon: FileText, paramKey: "lead_id", precondition: (i) => i.status !== "lost" },
      { label: "Create Quotation", to: "/quotations", icon: Send, paramKey: "lead_id", precondition: (i) => i.status !== "lost" },
      { label: "Create Proposal", to: "/proposals", icon: FileCheck, paramKey: "lead_id", precondition: (i) => i.status === "won" || i.status === "proposal" },
      { label: "Create Project", to: "/projects", icon: FolderKanban, paramKey: "client_name", precondition: (i) => i.status === "won" },
    ],
  },

  estimates: {
    titleField: "title",
    subtitleField: "estimate_number",
    icon: FileText,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "total_amount", label: "Total", format: "currency" },
      { key: "subtotal", label: "Subtotal", format: "currency" },
    ],
    actions: [
      { label: "Send Quotation", to: "/quotations", icon: Send, paramKey: "lead_id", precondition: (i) => i.status === "approved" },
      { label: "Create Proposal", to: "/proposals", icon: FileCheck, paramKey: "estimate_id", precondition: (i) => i.status === "approved" },
      { label: "Create Project", to: "/projects", icon: FolderKanban, precondition: (i) => i.status === "approved" },
    ],
  },

  quotations: {
    titleField: "title",
    subtitleField: "quotation_number",
    icon: Send,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      sent: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Sent" },
      accepted: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Accepted" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "total_amount", label: "Total", format: "currency" },
      { key: "client_name", label: "Client" },
    ],
    actions: [
      { label: "Create Project", to: "/projects", icon: FolderKanban, precondition: (i) => i.status === "accepted" },
      { label: "Create Invoice", to: "/construction-invoices", icon: Receipt, precondition: (i) => i.status === "accepted" },
    ],
  },

  proposals: {
    titleField: "title",
    subtitleField: "proposal_number",
    icon: FileCheck,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      sent: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Sent" },
      reviewing: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Reviewing" },
      accepted: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Accepted" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "total_amount", label: "Total", format: "currency" },
    ],
    actions: [
      { label: "Create Project", to: "/projects", icon: FolderKanban, precondition: (i) => i.status === "accepted" },
    ],
  },

  projects: {
    titleField: "name",
    subtitleField: "location",
    icon: FolderKanban,
    statuses: {
      planning: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Planning" },
      in_progress: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "In Progress" },
      on_hold: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "On Hold" },
      completed: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Completed" },
      cancelled: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Cancelled" },
    },
    metricFields: [
      { key: "budget", label: "Budget", format: "currency" },
      { key: "start_date", label: "Start", format: "date" },
      { key: "target_end_date", label: "Target End", format: "date" },
    ],
    actions: [
      { label: "Tasks", to: "/project-tasks", icon: ClipboardList },
      { label: "Schedule", to: "/project-schedules", icon: Calendar },
      { label: "Budget", to: "/project-budget", icon: DollarSign },
      { label: "Invoices", to: "/construction-invoices", icon: Receipt },
      { label: "Subcontracts", to: "/subcontracts", icon: FileCheck },
      { label: "Daily Logs", to: "/daily-logs", icon: Calendar },
    ],
  },

  "construction-invoices": {
    titleField: "invoice_number",
    subtitleField: "client_name",
    icon: Receipt,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      sent: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Sent" },
      paid: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Paid" },
      overdue: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Overdue" },
      cancelled: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Cancelled" },
    },
    metricFields: [
      { key: "total_amount", label: "Total", format: "currency" },
      { key: "amount_paid", label: "Paid", format: "currency" },
    ],
    actions: [
      { label: "Record Payment", to: "/payments", icon: DollarSign, precondition: (i) => i.status !== "paid" && i.status !== "cancelled" },
    ],
  },

  subcontracts: {
    titleField: "subcontractor_name",
    subtitleField: "scope_of_work",
    icon: FileCheck,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      active: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
      completed: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Completed" },
      terminated: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Terminated" },
    },
    metricFields: [
      { key: "contract_amount", label: "Amount", format: "currency" },
      { key: "paid_to_date", label: "Paid", format: "currency" },
    ],
    actions: [
      { label: "Create Invoice", to: "/construction-invoices", icon: Receipt, precondition: (i) => i.status === "active" },
      { label: "Record Bill", to: "/bills", icon: FileText, precondition: (i) => i.status === "active" },
    ],
  },

  bills: {
    titleField: "vendor_name",
    subtitleField: "bill_number",
    icon: FileText,
    statuses: {
      unpaid: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Unpaid" },
      paid: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Paid" },
      overdue: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Overdue" },
      cancelled: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Cancelled" },
    },
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
      { key: "due_date", label: "Due", format: "date" },
    ],
    actions: [
      { label: "Record Payment", to: "/payments", icon: DollarSign, precondition: (i) => i.status === "unpaid" || i.status === "overdue" },
    ],
  },

  change_orders: {
    titleField: "title",
    subtitleField: "order_number",
    icon: AlertTriangle,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
    ],
    actions: [],
  },

  employees: {
    titleField: "full_name",
    subtitleField: "role",
    icon: Users,
    statuses: {
      active: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
      inactive: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Inactive" },
    },
    metricFields: [
      { key: "daily_rate", label: "Daily Rate", format: "currency" },
      { key: "phone", label: "Phone" },
    ],
    actions: [
      { label: "Log Timesheet", to: "/timesheets", icon: Calendar },
      { label: "Record Expense", to: "/expenses", icon: DollarSign },
    ],
  },

  suppliers: {
    titleField: "name",
    subtitleField: "category",
    icon: Truck,
    statuses: {
      active: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
      inactive: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Inactive" },
      blacklisted: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Blacklisted" },
    },
    metricFields: [
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
    ],
    actions: [
      { label: "Create Purchase Order", to: "/purchase-orders", icon: Package, paramKey: "supplier_id" },
    ],
  },

  "purchase-orders": {
    titleField: "po_number",
    subtitleField: "supplier_name",
    icon: Package,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      approved: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Approved" },
      ordered: { color: "text-purple-700", bg: "bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400", label: "Ordered" },
      received: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Received" },
    },
    metricFields: [
      { key: "total_amount", label: "Total", format: "currency" },
    ],
    actions: [
      { label: "Receive Items", to: "/inventory", icon: Package, precondition: (i) => i.status === "ordered" },
    ],
  },

  inventory: {
    titleField: "name",
    subtitleField: "category",
    icon: Package,
    statuses: {
      in_stock: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "In Stock" },
      low_stock: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Low Stock" },
      out_of_stock: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Out of Stock" },
    },
    metricFields: [
      { key: "quantity", label: "Qty", format: "number" },
      { key: "unit_price", label: "Price", format: "currency" },
    ],
    actions: [],
  },

  allowances: {
    titleField: "name",
    subtitleField: "category",
    icon: DollarSign,
    statuses: {
      open: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Open" },
      exhausted: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Exhausted" },
      closed: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Closed" },
    },
    metricFields: [
      { key: "budgeted_amount", label: "Budget", format: "currency" },
      { key: "spent_amount", label: "Spent", format: "currency" },
    ],
    actions: [],
  },

  timesheets: {
    titleField: "employee_name",
    subtitleField: "project_name",
    icon: Calendar,
    statuses: {
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "hours_worked", label: "Hours", format: "number" },
    ],
    actions: [],
  },

  expenses: {
    titleField: "description",
    subtitleField: "category",
    icon: DollarSign,
    statuses: {
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
    ],
    actions: [
      { label: "Attach Receipt", to: "/receipts", icon: FileText },
    ],
  },

  "bid-packages": {
    titleField: "title",
    subtitleField: "package_number",
    icon: FolderKanban,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      sent: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Sent" },
      under_review: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Under Review" },
      awarded: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Awarded" },
      closed: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Closed" },
    },
    metricFields: [
      { key: "budget", label: "Budget", format: "currency" },
    ],
    actions: [],
  },

  "lien-waivers": {
    titleField: "vendor_name",
    subtitleField: "waiver_type",
    icon: FileCheck,
    statuses: {
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      signed: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Signed" },
      received: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Received" },
    },
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
    ],
    actions: [],
  },

  "commitment-log": {
    titleField: "description",
    subtitleField: "type",
    icon: ClipboardList,
    statuses: {
      pending: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      executed: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Executed" },
      completed: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Completed" },
    },
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
    ],
    actions: [],
  },

  "progress-payments": {
    titleField: "payment_number",
    subtitleField: "period",
    icon: DollarSign,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      submitted: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Submitted" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      paid: { color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Paid" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
    },
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
    ],
    actions: [],
  },

  "project-budget": {
    titleField: "category",
    subtitleField: "description",
    icon: DollarSign,
    statuses: {},
    metricFields: [
      { key: "budgeted_amount", label: "Budget", format: "currency" },
      { key: "committed_amount", label: "Committed", format: "currency" },
      { key: "spent_amount", label: "Spent", format: "currency" },
    ],
    actions: [],
  },

  "project-tasks": {
    titleField: "title",
    subtitleField: "project_name",
    icon: ClipboardList,
    statuses: {
      todo: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "To Do" },
      in_progress: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "In Progress" },
      review: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Review" },
      done: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Done" },
      cancelled: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Cancelled" },
    },
    metricFields: [
      { key: "estimated_hours", label: "Est. Hours", format: "number" },
      { key: "actual_hours", label: "Actual Hours", format: "number" },
    ],
    actions: [],
  },

  "daily-logs": {
    titleField: "date",
    subtitleField: "weather",
    icon: Calendar,
    statuses: {},
    metricFields: [
      { key: "workers_on_site", label: "Workers", format: "number" },
      { key: "hours_worked", label: "Hours", format: "number" },
    ],
    actions: [],
  },

  rfis: {
    titleField: "rfi_number",
    subtitleField: "subject",
    icon: AlertTriangle,
    statuses: {
      open: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Open" },
      answered: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Answered" },
      closed: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Closed" },
    },
    actions: [],
  },

  submittals: {
    titleField: "title",
    subtitleField: "submittal_number",
    icon: FileCheck,
    statuses: {
      draft: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Draft" },
      submitted: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Submitted" },
      under_review: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Under Review" },
      approved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Approved" },
      rejected: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" },
      revised: { color: "text-purple-700", bg: "bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400", label: "Revised" },
    },
    actions: [],
  },

  "meeting-minutes": {
    titleField: "title",
    subtitleField: "meeting_date",
    icon: Users,
    statuses: {},
    actions: [],
  },

  "punch-list": {
    titleField: "description",
    subtitleField: "location",
    icon: ClipboardList,
    statuses: {
      open: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Open" },
      in_progress: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "In Progress" },
      completed: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Completed" },
      verified: { color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Verified" },
    },
    actions: [],
  },

  "safety-incidents": {
    titleField: "title",
    subtitleField: "incident_type",
    icon: AlertTriangle,
    statuses: {
      reported: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Reported" },
      investigating: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "Investigating" },
      resolved: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Resolved" },
      closed: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Closed" },
    },
    actions: [],
  },

  "project-schedules": {
    titleField: "name",
    subtitleField: "project_name",
    icon: Calendar,
    statuses: {
      planned: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Planned" },
      in_progress: { color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", label: "In Progress" },
      completed: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Completed" },
      delayed: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Delayed" },
    },
    metricFields: [
      { key: "start_date", label: "Start", format: "date" },
      { key: "end_date", label: "End", format: "date" },
    ],
    actions: [],
  },

  assets: {
    titleField: "name",
    subtitleField: "category",
    icon: Package,
    statuses: {
      active: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
      maintenance: { color: "text-yellow-700", bg: "bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Maintenance" },
      disposed: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Disposed" },
      stored: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Stored" },
    },
    metricFields: [
      { key: "purchase_price", label: "Value", format: "currency" },
    ],
    actions: [],
  },

  "equipment-rentals": {
    titleField: "equipment_name",
    subtitleField: "rental_company",
    icon: Truck,
    statuses: {
      active: { color: "text-green-700", bg: "bg-green-100 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
      returned: { color: "text-gray-700", bg: "bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400", label: "Returned" },
      overdue: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Overdue" },
      damaged: { color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400", label: "Damaged" },
      lost: { color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/30 dark:text-red-400", label: "Lost" },
    },
    metricFields: [
      { key: "daily_rate", label: "Rate/Day", format: "currency" },
    ],
    actions: [],
  },

  receipts: {
    titleField: "vendor_name",
    subtitleField: "receipt_number",
    icon: FileText,
    statuses: {},
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
    ],
    actions: [],
  },

  "vendor-payments": {
    titleField: "payee_name",
    subtitleField: "description",
    icon: Receipt,
    statuses: {},
    metricFields: [
      { key: "amount", label: "Amount", format: "currency" },
      { key: "payment_date", label: "Date", format: "date" },
      { key: "receipt_number", label: "Receipt #" },
    ],
    actions: [],
  },
};
