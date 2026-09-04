import { useHighestRole } from "@/hooks/use-auth";
import { PageTour } from "./page-tour";

export function usePageTour(route: string) {
  const role = useHighestRole();
  return { role, Tour: () => <PageTour route={route} role={role} /> };
}
