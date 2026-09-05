import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth, useHighestRole } from "@/hooks/use-auth";
import { LandlordPortalLayout } from "@/components/landlord-portal-layout";

export const Route = createFileRoute("/landlord")({
  beforeLoad: ({ context }) => {
    const role = context?.auth?.highestRole;
    if (!role || !["owner"].includes(role)) {
      throw redirect({ to: "/" });
    }
  },
  component: LandlordPortalLayout,
});