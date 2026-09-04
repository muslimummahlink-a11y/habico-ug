import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/qbo-callback")({
  head: () => ({ meta: [{ title: "Connecting QuickBooks\u2026" }] }),
  component: QboCallbackPage,
});

function QboCallbackPage() {
  const search = useSearch({ strict: false }) as { code?: string; realmId?: string; error?: string };

  useEffect(() => {
    if (search.error) {
      window.opener?.postMessage(
        { type: "qbo-callback", error: search.error },
        window.location.origin
      );
      window.close();
      return;
    }

    if (search.code && search.realmId) {
      window.opener?.postMessage(
        { type: "qbo-callback", payload: { code: search.code, realmId: search.realmId } },
        window.location.origin
      );
      window.close();
    }
  }, [search.code, search.realmId, search.error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Completing QuickBooks connection\u2026</p>
    </div>
  );
}
