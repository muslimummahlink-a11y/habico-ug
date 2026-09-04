import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CreditCard } from "lucide-react";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/card")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Card Verification — Habico Portal" }] }),
  component: CardPage,
});

function CardPage() {
  const { c: cardNumber } = Route.useSearch();
  const nav = useNavigate();

  if (cardNumber) {
    nav({ to: "/auth", search: { c: cardNumber }, replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
          <div className="flex flex-col items-center gap-4 rounded-lg border py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-bold">ID Card Verification</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan your card or enter the number on the sign-in page.
              </p>
            </div>
            <Link to="/auth">
              <Button>Go to Sign In</Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
