import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useCompanyId() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["current-company-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      return (data as { company_id: string | null } | null)?.company_id ?? null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
