import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyBranding {
  id: string;
  company_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  document_footer: string | null;
  receipt_footer: string | null;
  company_name_override: string | null;
}

export function useCompanyBranding() {
  return useQuery({
    queryKey: ["my-company-branding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_company_branding")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data ?? null) as CompanyBranding | null;
    },
    staleTime: 1000 * 60 * 5,
  });
}
