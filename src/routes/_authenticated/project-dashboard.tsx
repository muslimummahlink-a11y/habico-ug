// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  BarChart3, CheckCircle2, ClipboardList, Clock, DollarSign,
  FileText, HardHat, Loader2, MessageSquare, Target, TrendingDown,
  TrendingUp, ArrowRight, CalendarDays,
} from "lucide-react";
import { PageTour } from "@/components/page-tour";
import { ConstructionWorkflow } from "@/components/construction-workflow";

export const Route = createFileRoute("/_authenticated/project-dashboard")({
  head: () => ({ meta: [{ title: "Project Dashboard — Habico Portal" }] }),
  component: ProjectDashboardPage,
});

const taskStatusColor: Record<string, string> = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const rfiStatusColor: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  answered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

function ProjectDashboardPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const projectId = selectedProjectId || (projects.length > 0 ? projects[0].id : null);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ["project-dashboard", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const [projectRes, tasksRes, rfisRes, expensesRes, logsRes, punchRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("project_tasks").select("*").eq("project_id", projectId),
        supabase.from("rfis").select("*").eq("project_id", projectId),
        supabase.from("expenses").select("amount").eq("project_id", projectId),
        supabase.from("daily_logs").select("*").eq("project_id", projectId).order("log_date", { ascending: false }).limit(10),
        supabase.from("project_punch_items").select("*").eq("project_id", projectId),
      ]);

      if (projectRes.error) throw projectRes.error;

      const project = projectRes.data as any;
      const tasks = (tasksRes.data as any[]) ?? [];
      const rfis = (rfisRes.data as any[]) ?? [];
      const expenses = (expensesRes.data as any[]) ?? [];
      const dailyLogs = (logsRes.data as any[]) ?? [];
      const punchItems = (punchRes.data as any[]) ?? [];

      const totalSpent = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      const budget = Number(project.budget || 0);
      const budgetPercent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;

      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t: any) => t.status === "done").length;
      const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
      const todoTasks = tasks.filter((t: any) => t.status === "todo").length;
      const scheduleProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      const openRfis = rfis.filter((r: any) => r.status === "open").length;
      const answeredRfis = rfis.filter((r: any) => r.status === "answered").length;

      const openPunch = punchItems.filter((p: any) => p.status === "open" || p.status === "in_progress").length;

      const recentActivity: any[] = [];

      for (const t of tasks.slice(0, 5)) {
        recentActivity.push({
          id: t.id,
          type: "task",
          title: t.title,
          status: t.status,
          date: t.created_at,
          icon: ClipboardList,
        });
      }

      for (const r of rfis.slice(0, 5)) {
        recentActivity.push({
          id: r.id,
          type: "rfi",
          title: r.subject ?? r.title ?? "RFI",
          status: r.status,
          date: r.created_at,
          icon: MessageSquare,
        });
      }

      for (const l of dailyLogs.slice(0, 5)) {
        recentActivity.push({
          id: l.id,
          type: "daily_log",
          title: l.summary ?? `Daily log — ${l.log_date}`,
          status: null,
          date: l.log_date,
          icon: FileText,
        });
      }

      recentActivity.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      recentActivity.splice(10);

      return {
        project,
        totalSpent,
        budget,
        budgetPercent,
        totalTasks,
        doneTasks,
        inProgressTasks,
        todoTasks,
        scheduleProgress,
        openRfis,
        answeredRfis,
        totalRfis: rfis.length,
        openPunch,
        totalPunch: punchItems.length,
        recentActivity,
      } as any;
    },
    enabled: !!projectId,
  });

  if (!projectId && !isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageTour route="/project-dashboard" role={role} />
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Project Dashboard</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No projects found. Create a project first.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/project-dashboard" role={role} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
          <h1 className="display text-3xl font-bold">Project Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Project</label>
          <SearchableSelect
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            placeholder="Select a project"
            options={
              projects.length === 0
                ? [{ value: "", label: "No projects" }]
                : projects.map((p: any) => ({ value: p.id, label: p.name }))
            }
          />
        </div>
      </div>

      <ConstructionWorkflow />

      {isLoading || !projectData ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Budget vs Actual</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.budgetPercent}%</div>
                <div className="mt-1 text-xs text-muted-foreground">UGX {projectData.totalSpent.toLocaleString()} / UGX {projectData.budget.toLocaleString()}</div>
                <Progress value={projectData.budgetPercent} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Schedule Progress</CardTitle><BarChart3 className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.scheduleProgress}%</div>
                <div className="mt-1 text-xs text-muted-foreground">{projectData.doneTasks} of {projectData.totalTasks} tasks done</div>
                <Progress value={projectData.scheduleProgress} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open RFIs</CardTitle><MessageSquare className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.openRfis}</div>
                <div className="mt-1 text-xs text-muted-foreground">{projectData.answeredRfis} answered · {projectData.totalRfis} total</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open Tasks</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.todoTasks + projectData.inProgressTasks}</div>
                <div className="mt-1 text-xs text-muted-foreground">{projectData.inProgressTasks} in progress · {projectData.todoTasks} todo</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Open Punch Items</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.openPunch}</div>
                <div className="mt-1 text-xs text-muted-foreground">{projectData.totalPunch} total punch items</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Safety Incidents</CardTitle><HardHat className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <div className="mt-1 text-xs text-muted-foreground">No incidents reported</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="display">Budget Overview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="font-semibold">UGX {projectData.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Spent</span>
                  <span className="font-semibold text-destructive">UGX {projectData.totalSpent.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-green-600">UGX {Math.max(0, projectData.budget - projectData.totalSpent).toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{projectData.budgetPercent}% spent</span>
                    <span>{100 - projectData.budgetPercent}% remaining</span>
                  </div>
                  <Progress value={projectData.budgetPercent} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="display">Quick Actions</CardTitle></CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline" className="justify-start"><Link to="/project-tasks"><ClipboardList className="mr-2 h-4 w-4" />Tasks</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/rfis"><MessageSquare className="mr-2 h-4 w-4" />RFIs</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/daily-logs"><FileText className="mr-2 h-4 w-4" />Daily Logs</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/project-budget"><DollarSign className="mr-2 h-4 w-4" />Budget</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/project-dashboard"><BarChart3 className="mr-2 h-4 w-4" />Dashboard</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link to="/project-schedules"><CalendarDays className="mr-2 h-4 w-4" />Schedules</Link></Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="display">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {projectData.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No recent activity for this project.</div>
              ) : (
                <div className="space-y-3">
                  {(projectData.recentActivity as any[]).map((item: any, i: number) => (
                    <div key={`${item.type}-${item.id}-${i}`} className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <div className="rounded-full bg-muted p-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge className={cn("border-0 capitalize", item.type === "task" ? taskStatusColor[item.status] : item.type === "rfi" ? rfiStatusColor[item.status] : "")} variant="outline">{item.type.replace("_", " ")}</Badge>
                          <span>{item.date ? new Date(item.date).toLocaleDateString() : ""}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="display">Project Info</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold">{projectData.project.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{projectData.project.status?.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold">{projectData.project.location ?? "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-semibold">{projectData.project.client_name ?? "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-semibold">{projectData.project.start_date ?? "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target End</p>
                <p className="font-semibold">{projectData.project.target_end_date ?? "\u2014"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-semibold">UGX {Number(projectData.project.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="font-semibold">UGX {projectData.totalSpent.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
