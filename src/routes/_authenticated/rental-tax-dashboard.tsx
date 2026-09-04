import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/use-company-id";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, FileText, Calculator, CalendarDays, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useHighestRole } from "@/hooks/use-auth";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/rental-tax-dashboard")({
  head: () => ({ meta: [{ title: "URA Tax Compliance — Habico Portal" }] }),
  component: RentalTaxDashboard,
});

function formatUGX(amount: number) {
  if (amount >= 1_000_000) return `UGX ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `UGX ${(amount / 1_000).toFixed(1)}K`;
  return `UGX ${amount.toLocaleString()}`;
}

function CircularScore({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  const riskLabel = score >= 80 ? "Low Risk" : score >= 50 ? "Medium Risk" : "High Risk";
  const riskVariant: "default" | "secondary" | "destructive" = score >= 80 ? "default" : score >= 50 ? "secondary" : "destructive";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg width={180} height={180} className="-rotate-90">
          <circle
            cx={90} cy={90} r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={14}
          />
          <circle
            cx={90} cy={90} r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={14}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{score}%</span>
          <span className="text-xs font-medium text-muted-foreground">Compliance</span>
        </div>
      </div>
      <Badge variant={riskVariant}>{riskLabel}</Badge>
    </div>
  );
}

function useTaxDashboardData(companyId?: string | null) {
  return useQuery({
    queryKey: ["rental-tax-dashboard", companyId],
    queryFn: async () => {
      const now = new Date();
      const currentYear = now.getFullYear();

      const taxYearEnd = now > new Date(currentYear, 5, 30)
        ? new Date(currentYear + 1, 5, 30)
        : new Date(currentYear, 5, 30);
      const daysToDeadline = Math.max(0, Math.ceil((taxYearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      const [paymentsRes, leasesRes, expensesRes, propertiesRes, unitsRes, checklistRes, alertsRes, stepsRes] = await Promise.all([
        companyId
          ? supabase.from("payments").select("amount, payment_date, payment_type, lease_id, leases!inner(unit_id, units!inner(company_id))").eq("leases.units.company_id", companyId)
          : supabase.from("payments").select("amount, payment_date, payment_type, lease_id"),
        companyId
          ? supabase.from("leases").select("id, monthly_rent, status, unit_id, units!inner(company_id)").eq("status", "active").eq("units.company_id", companyId)
          : supabase.from("leases").select("id, monthly_rent, status, unit_id").eq("status", "active"),
        companyId
          ? supabase.from("expenses").select("amount, expense_date, expense_categories(name)").eq("company_id", companyId)
          : supabase.from("expenses").select("amount, expense_date, expense_categories(name)"),
        companyId
          ? supabase.from("properties").select("id, name, valuation_amount, last_valuation_date, depreciation_rate").eq("company_id", companyId)
          : supabase.from("properties").select("id, name, valuation_amount, last_valuation_date, depreciation_rate"),
        companyId
          ? supabase.from("units").select("id, monthly_rent, property_id, status").eq("company_id", companyId)
          : supabase.from("units").select("id, monthly_rent, property_id, status"),
        supabase.from("tax_checklist_items").select("*").order("sort_order"),
        supabase.from("tax_alerts").select("*").eq("is_active", true).order("created_at"),
        supabase.from("tax_next_steps").select("*").order("sort_order"),
      ]);

      const allPayments = (paymentsRes.data as any) ?? [];
      const activeLeases = (leasesRes.data as any) ?? [];
      const expenses = (expensesRes.data as any) ?? [];
      const properties = (propertiesRes.data as any) ?? [];
      const units = (unitsRes.data as any) ?? [];

      let checklistItems = (checklistRes.data as any) ?? [];
      let alertsData = (alertsRes.data as any) ?? [];
      let stepsData = (stepsRes.data as any) ?? [];

      if (checklistItems.length === 0) {
        await supabase.from("tax_checklist_items").upsert([
          { label: "Property Deeds / Titles", sort_order: 1 },
          { label: "Rental Receipts / Income Statements", sort_order: 2 },
          { label: "Expense Receipts", sort_order: 3 },
          { label: "Bank Statements", sort_order: 4 },
          { label: "Insurance Certificates", sort_order: 5 },
          { label: "Tenancy Agreements", sort_order: 6 },
          { label: "Property Valuation Report", sort_order: 7 },
          { label: "Depreciation Schedule", sort_order: 8 },
          { label: "Tax Clearance Certificate", sort_order: 9 },
          { label: "Previous Year Returns", sort_order: 10 },
        ], { onConflict: "label" });
        const { data: rc } = await supabase.from("tax_checklist_items").select("*").order("sort_order");
        checklistItems = (rc ?? []);
      }
      if (alertsData.length === 0) {
        await supabase.from("tax_alerts").upsert([
          { title: "Q4 Provisional Tax Deadline", description: "Final quarter provisional tax payment due by January 31. Avoid penalties by filing on time.", alert_type: "warning" },
          { title: "Property Valuation Requirement", description: "Properties must be revalued every 5 years for accurate depreciation calculations under URA guidelines.", alert_type: "info" },
          { title: "Annual Filing Deadline Approaching", description: "Annual rental income tax return must be filed by June 30. Prepare your documents now.", alert_type: "warning" },
        ], { onConflict: "title" });
        const { data: ra } = await supabase.from("tax_alerts").select("*").eq("is_active", true).order("created_at");
        alertsData = (ra ?? []);
      }
      if (stepsData.length === 0) {
        await supabase.from("tax_next_steps").upsert([
          { label: "Register for URA TIN", description: "Obtain or verify your Tax Identification Number with URA", sort_order: 1 },
          { label: "File Provisional Tax Return", description: "Submit estimated tax for the current income year", sort_order: 2 },
          { label: "Prepare Financial Statements", description: "Compile income statements and balance sheet for the year", sort_order: 3 },
          { label: "Calculate Taxable Income", description: "Apply allowable deductions to gross rental income", sort_order: 4 },
          { label: "File Annual Return", description: "Submit final tax return before June 30 deadline", sort_order: 5 },
          { label: "Pay Balance Due", description: "Settle any outstanding tax liability to avoid interest", sort_order: 6 },
        ], { onConflict: "label" });
        const { data: rs } = await supabase.from("tax_next_steps").select("*").order("sort_order");
        stepsData = (rs ?? []);
      }

      const payments = allPayments.filter((p: any) => !p.payment_type || p.payment_type === "rent");
      const taxPayments = allPayments.filter((p: any) => p.payment_type === "tax");

      const grossRentalIncome = payments.reduce((s: number, p: any) => s + Number(p.amount), 0);

      const curMonthPayments = payments.filter((p: any) => {
        const d = new Date(p.payment_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const collectedThisMonth = curMonthPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

      const expectedMonthlyRent = activeLeases.reduce((s: number, l: any) => s + Number(l.monthly_rent), 0);
      const uncollectedAmount = Math.max(0, expectedMonthlyRent - collectedThisMonth);

      const paymentMonths = new Set(payments.map((p: any) => {
        const d = new Date(p.payment_date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }));
      const monthsWithData = Math.max(1, paymentMonths.size);
      const monthlyAvgIncome = grossRentalIncome / monthsWithData;
      const projectedAnnualIncome = monthlyAvgIncome * 12;

      let maintenanceExpenses = 0;
      let managementFees = 0;
      let insuranceExpenses = 0;
      let propertyTaxes = 0;
      let otherDeductions = 0;

      for (const e of expenses) {
        const catName = (e.expense_categories?.name ?? "").toLowerCase();
        const amt = Number(e.amount);
        if (catName.includes("maintenance") || catName.includes("repair")) {
          maintenanceExpenses += amt;
        } else if (catName.includes("management") || catName.includes("fee")) {
          managementFees += amt;
        } else if (catName.includes("insurance")) {
          insuranceExpenses += amt;
        } else if (catName.includes("tax") || catName.includes("rates") || catName.includes("levy")) {
          propertyTaxes += amt;
        } else {
          otherDeductions += amt;
        }
      }

      const totalMonthlyRent = units.reduce((s: number, u: any) => s + Number(u.monthly_rent), 0);

      const propertiesWithValuation = (propertiesRes.data as any)?.filter((p: any) => p.valuation_amount) ?? [];
      const totalValuation = propertiesWithValuation.reduce((s: number, p: any) => s + Number(p.valuation_amount), 0);
      const avgDepreciationRate = propertiesWithValuation.length > 0
        ? propertiesWithValuation.reduce((s: number, p: any) => s + Number(p.depreciation_rate || 5), 0) / propertiesWithValuation.length
        : 5;
      const estimatedPropertyValue = totalValuation > 0 ? totalValuation : totalMonthlyRent * 12 * 10;
      const depreciation = estimatedPropertyValue * (avgDepreciationRate / 100);

      const provisionalTaxPaid = taxPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

      const totalDeductions = maintenanceExpenses + managementFees + insuranceExpenses + propertyTaxes + depreciation + otherDeductions;
      const taxableIncome = Math.max(0, grossRentalIncome - totalDeductions);
      const taxDue = taxableIncome * 0.30;
      const taxPaid = provisionalTaxPaid > 0 ? provisionalTaxPaid : grossRentalIncome * 0.10;
      const balanceDue = Math.max(0, taxDue - taxPaid);

      const collectionRate = expectedMonthlyRent > 0 ? Math.round((collectedThisMonth / expectedMonthlyRent) * 100) : 100;

      return {
        grossRentalIncome,
        expectedMonthlyRent,
        collectedThisMonth,
        uncollectedAmount,
        projectedAnnualIncome,
        maintenanceExpenses,
        managementFees,
        insuranceExpenses,
        propertyTaxes,
        depreciation,
        otherDeductions,
        totalDeductions,
        taxableIncome,
        taxDue,
        taxPaid,
        balanceDue,
        collectionRate,
        daysToDeadline,
        estimatedPropertyValue,
        totalProperties: properties.length,
        totalUnits: units.length,
        activeLeasesCount: activeLeases.length,
        checklistItems,
        alertsData,
        stepsData,
        provisionalTaxPaid,
      } as any;
    },
  });
}

function RentalTaxDashboard() {
  const qc = useQueryClient();
  const role = useHighestRole();
  const { data: companyId, isLoading: companyLoading } = useCompanyId();
  const { data: d, isLoading } = useTaxDashboardData(companyId);

  const toggleChecklist = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const { error } = await supabase
        .from("tax_checklist_items")
        .update({ checked, checked_at: checked ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rental-tax-dashboard"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleStep = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("tax_next_steps")
        .update({ is_completed, completed_at: is_completed ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rental-tax-dashboard"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading || !d) {
    return <div className="text-sm text-muted-foreground">Loading tax compliance data…</div>;
  }

  const checklistLen = d.checklistItems?.length ?? 1;
  const checkedCount = d.checklistItems?.filter((c: any) => c.checked).length ?? 0;
  const docsRatio = (checkedCount / checklistLen) * 100;

  const taxPaidRatio = d.taxDue > 0 ? Math.min(100, Math.round((d.taxPaid / d.taxDue) * 100)) : 100;
  const complianceScore = Math.min(100, Math.round(
    d.collectionRate * 0.25 +
    taxPaidRatio * 0.35 +
    docsRatio * 0.40
  ));

  const deadlineUrgency = d.daysToDeadline <= 30 ? "text-red-600" : d.daysToDeadline <= 60 ? "text-amber-600" : "text-green-600";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/rental-tax-dashboard" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">URA Tax Compliance</p>
          <h1 className="display text-3xl font-bold">Rental Tax Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Uganda Revenue Authority — rental income tax compliance overview
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          Staff Only
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Compliance Score
            </CardTitle>
            <CardDescription>Overall URA tax compliance rating for your rental portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <CircularScore score={complianceScore} />
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Collection Rate</span>
                    <span className="font-semibold">{d.collectionRate}%</span>
                  </div>
                  <Progress value={d.collectionRate} className="h-2 [&>div]:bg-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax Payment Progress</span>
                    <span className="font-semibold">{taxPaidRatio}%</span>
                  </div>
                  <Progress value={taxPaidRatio} className="h-2 [&>div]:bg-blue-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Document Readiness</span>
                    <span className="font-semibold">{Math.round(docsRatio)}%</span>
                  </div>
                  <Progress value={docsRatio} className="h-2 [&>div]:bg-purple-500" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 text-center text-sm">
                  <div>
                    <p className="text-2xl font-bold">{d.totalProperties}</p>
                    <p className="text-xs text-muted-foreground">Properties</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{d.totalUnits}</p>
                    <p className="text-xs text-muted-foreground">Units</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{d.activeLeasesCount}</p>
                    <p className="text-xs text-muted-foreground">Active Leases</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              Filing Deadline
            </CardTitle>
            <CardDescription>Ugandan tax year ends June 30</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className={`text-6xl font-bold ${deadlineUrgency}`}>
              {d.daysToDeadline}
            </div>
            <p className="text-sm text-muted-foreground">days remaining</p>
            <Progress
              value={Math.max(0, Math.min(100, ((365 - d.daysToDeadline) / 365) * 100))}
              className="h-2 w-full [&>div]:bg-amber-500"
            />
            <p className="text-xs text-muted-foreground text-center">
              Annual rental income tax return due by June 30.<br />
              File on time to avoid penalties.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              Income
            </CardTitle>
            <CardDescription>Rental income overview for tax computation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Gross Rental Income</span>
                <span className="text-lg font-bold">{formatUGX(d.grossRentalIncome)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Expected Rent (This Month)</span>
              <span className="font-semibold">{formatUGX(d.expectedMonthlyRent)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Collected (This Month)</span>
              <span className="font-semibold text-green-600">{formatUGX(d.collectedThisMonth)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Uncollected Amount</span>
              <span className="font-semibold text-red-600">{formatUGX(d.uncollectedAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">Projected Annual Income</span>
              <span className="font-semibold">{formatUGX(d.projectedAnnualIncome)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Based on monthly average of {formatUGX(Math.round(d.grossRentalIncome / Math.max(1, d.activeLeasesCount || 1)))} per active lease
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Allowable Deductions
            </CardTitle>
            <CardDescription>URA-approved deductible expenses (Section 22, Income Tax Act)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Property Maintenance</span>
              <span className="font-medium">{formatUGX(d.maintenanceExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Property Management Fees</span>
              <span className="font-medium">{formatUGX(d.managementFees)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Insurance</span>
              <span className="font-medium">{formatUGX(d.insuranceExpenses)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Property Taxes</span>
              <span className="font-medium">{formatUGX(d.propertyTaxes)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Depreciation (5% of est. value)</span>
              <span className="font-medium">{formatUGX(d.depreciation)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Other Deductions</span>
              <span className="font-medium">{formatUGX(d.otherDeductions)}</span>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between font-semibold">
                <span>Total Deductions</span>
                <span className="text-green-600">{formatUGX(d.totalDeductions)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Est. property value: {formatUGX(Math.round(d.estimatedPropertyValue))} (units × 12 × 10 cap rate)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              Tax Calculation
            </CardTitle>
            <CardDescription>Rental income tax at 30% per URA Individual Income Tax Act</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Gross Rental Income</span>
                <span className="font-semibold">{formatUGX(d.grossRentalIncome)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Less: Allowable Deductions</span>
                <span className="font-semibold text-red-600">− {formatUGX(d.totalDeductions)}</span>
              </div>
              <div className="flex items-center justify-between border-b-2 border-border pb-2 text-base">
                <span className="font-medium">Taxable Income</span>
                <span className="font-bold">{formatUGX(d.taxableIncome)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Tax Rate</span>
                <span className="font-semibold">30%</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Tax Due</span>
                <span className="font-semibold text-amber-600">{formatUGX(d.taxDue)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">Less: Provisional Tax Paid (est.)</span>
                <span className="font-semibold text-green-600">− {formatUGX(d.taxPaid)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-lg">
                <span className="font-bold">Balance Due</span>
                <span className={`font-bold ${d.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                  {d.balanceDue > 0 ? formatUGX(d.balanceDue) : "UGX 0 — Fully Paid"}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Provisional tax payments from actual tax payments ({formatUGX(Math.round(d.provisionalTaxPaid))}). Auto-calculated at 10% of gross income when no tax payments recorded.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              Document Checklist
            </CardTitle>
            <CardDescription>Required documents for URA annual tax filing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {d.checklistItems?.map((item: any) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => toggleChecklist.mutate({ id: item.id, checked: !item.checked })}
                />
                <span className={item.checked ? "text-muted-foreground line-through" : ""}>
                  {item.label}
                </span>
                {item.checked && (
                  <CheckCircle className="ml-auto h-4 w-4 shrink-0 text-green-500" />
                )}
              </label>
            ))}
            <div className="border-t border-border pt-3 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documents Ready</span>
                <span className="font-semibold">
                  {checkedCount} / {checklistLen}
                </span>
              </div>
              <Progress
                value={docsRatio}
                className="mt-2 h-2 [&>div]:bg-purple-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Alerts &amp; Reminders
            </CardTitle>
            <CardDescription>Important URA compliance notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.alertsData?.map((alert: any) => {
              const Icon = alert.alert_type === "critical" ? AlertTriangle : alert.alert_type === "warning" ? AlertTriangle : FileText;
              const isWarning = alert.alert_type === "warning" || alert.alert_type === "critical";
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                    isWarning
                      ? "border-warning/30 bg-warning/10"
                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isWarning ? "text-warning-foreground" : "text-blue-600 dark:text-blue-400"
                  }`} />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="display flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              Next Steps
            </CardTitle>
            <CardDescription>Recommended actions for full URA compliance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {d.stepsData?.map((step: any, i: number) => (
              <div
                key={step.id}
                className="flex items-start gap-4 border-b border-border last:border-0 py-3 cursor-pointer transition-colors hover:bg-muted/20"
                onClick={() => toggleStep.mutate({ id: step.id, is_completed: !step.is_completed })}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.is_completed
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-accent/10 text-accent"
                }`}>
                  {step.is_completed ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${step.is_completed ? "text-muted-foreground line-through" : ""}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                {step.is_completed && (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        <p>
          This dashboard provides estimated tax calculations for informational purposes only.
          Consult a qualified tax professional for accurate URA filing.
          Tax rates and deductions based on the Uganda Income Tax Act (Cap. 340).
        </p>
      </div>
    </div>
  );
}
