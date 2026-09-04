import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHighestRole } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, FileText, FolderTree, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageTour } from "@/components/page-tour";

export const Route = createFileRoute("/_authenticated/sop")({
  head: () => ({ meta: [{ title: "SOP — Habico Portal" }] }),
  component: SopPage,
});

function SopPage() {
  const role = useHighestRole();
  const isStaff = role === "admin" || role === "manager";

  const { data: checklists = [], isLoading: loadingChecklists } = useQuery({
    queryKey: ["sop-checklists-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sop_checklists").select("id").limit(1);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: forms = [], isLoading: loadingForms } = useQuery({
    queryKey: ["sop-forms-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sop_forms").select("id, category").limit(100);
      if (error) throw error;
      return data as any[];
    },
  });

  const categories = [...new Set(forms.map((f: any) => f.category).filter(Boolean))];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageTour route="/sop" role={role} />
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-accent">Operations</div>
        <h1 className="display text-3xl font-bold">Standard Operating Procedures</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage checklists and forms for your projects.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Checklists</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingChecklists ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{checklists.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingForms ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold">{forms.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-accent" />
              SOP Checklists
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create and manage step-by-step checklists for recurring tasks. Track completion and assign items to team members.
            </p>
            {isStaff && (
              <Link to="/sop-checklists">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Manage Checklists <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-accent" />
              SOP Forms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Design and maintain structured forms with custom JSON field definitions for standardised data collection.
            </p>
            {isStaff && (
              <Link to="/sop-forms">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Manage Forms <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {!isStaff && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          You do not have permission to manage SOPs.
        </div>
      )}
    </div>
  );
}
