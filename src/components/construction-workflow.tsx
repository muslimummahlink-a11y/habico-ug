import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WorkflowStage {
  label: string;
  route: string;
  description: string;
  subRoutes?: string[];
}

const stages: WorkflowStage[] = [
  { label: "Lead", route: "/leads", description: "Capture a potential client or project inquiry." },
  { label: "Estimate", route: "/estimates", description: "Prepare a detailed cost estimate for the work." },
  { label: "Quotation", route: "/quotations", description: "Send a branded quotation to the client." },
  { label: "Project", route: "/projects", description: "Create the project and begin execution.", subRoutes: ["/project-dashboard", "/project-schedules", "/project-tasks", "/project-documents", "/project-photos", "/project-budget", "/meeting-minutes", "/submittals", "/safety-incidents"] },
  { label: "Daily Logs", route: "/daily-logs", description: "Record daily site activities, weather, and manpower." },
  { label: "RFIs", route: "/rfis", description: "Submit and track requests for information or clarifications." },
  { label: "Punch List", route: "/punch-list", description: "Track defects and incomplete items before handover." },
  { label: "Invoice", route: "/construction-invoices", description: "Issue invoices for completed work.", subRoutes: ["/progress-payments", "/change-orders", "/subcontracts", "/bills", "/purchase-orders", "/inventory", "/suppliers", "/commitment-log", "/lien-waivers", "/allowances", "/expenses", "/timesheets", "/employees", "/receipts", "/assets", "/equipment-rentals", "/cost-codes"] },
];

function resolveStage(pathname: string): number {
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (s.route === pathname) return i;
    if (s.subRoutes?.includes(pathname)) return i;
  }
  return -1;
}

export function ConstructionWorkflow() {
  const loc = useLocation();
  const currentIdx = resolveStage(loc.pathname);

  if (currentIdx === -1) return null;

  const prevStage = currentIdx > 0 ? stages[currentIdx - 1] : null;
  const nextStage = currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null;

  return (
    <div className="mb-6 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        {prevStage ? (
          <Link to={prevStage.route} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0">
            <ChevronLeft className="h-3 w-3" />
            <span className="hidden sm:inline">{prevStage.label}</span>
          </Link>
        ) : <div />}

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {stages.map((stage, i) => {
            const isCurrent = i === currentIdx;
            const isPast = i < currentIdx;
            return (
              <div key={stage.route} className="flex items-center gap-1.5">
                <Link
                  to={stage.route}
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : isPast
                        ? "bg-accent/10 text-accent hover:bg-accent/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {stage.label}
                </Link>
                {i < stages.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {nextStage ? (
          <Link to={nextStage.route} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0">
            <span className="hidden sm:inline">{nextStage.label}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        ) : <div />}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{stages[currentIdx].description}</p>
    </div>
  );
}

export function useIsConstructionRoute(): boolean {
  const loc = useLocation();
  return resolveStage(loc.pathname) !== -1;
}
