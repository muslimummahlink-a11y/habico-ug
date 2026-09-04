import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RecordActionType = "delete" | "edit" | "copy";

interface UseRecordActionsOptions<T> {
  table: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

interface UseRecordActionsReturn<T> {
  // Delete
  deleteMutation: any;
  isDeleting: boolean;
  deleteError: Error | null;
  
  // Edit
  editMutation: any;
  isEditing: boolean;
  editError: Error | null;
  
  // Copy
  copyMutation: any;
  isCopying: boolean;
  copyError: Error | null;
  
  // Generic mutation helper
  mutate: (id: string, values?: T) => Promise<any>;
}

export function useRecordActions<T = any>(options: UseRecordActionsOptions<T> = { table: "records" }): UseRecordActionsReturn<T> {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { table, onSuccess, onError } = options;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast({
        title: "Success",
        description: "Record deleted successfully",
        variant: "destructive",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive",
      });
      onError?.(error);
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (vals: { id: string; data: T }) => {
      const { id, data } = vals;
      const { error } = await supabase.from(table).update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
      });
      onError?.(error);
    },
  });

  // Copy mutation
  const copyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
      if (error) throw error;
      // Create new record with incremented ID or default values
      const { error: insertError } = await supabase.from(table).insert({
        ...data,
        // Could customize copy logic here based on table structure
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      toast({
        title: "Success",
        description: "Record copied successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy record",
      });
      onError?.(error);
    },
  });

  // Generic mutate function
  const mutate = async (id: string, values?: T) => {
    if (values) {
      return editMutation.mutate({ id, data: values });
    }
    return deleteMutation.mutate(id);
  };

  return {
    // Delete
    deleteMutation,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    
    // Edit
    editMutation,
    isEditing: editMutation.isPending,
    editError: editMutation.error,
    
    // Copy
    copyMutation,
    isCopying: copyMutation.isPending,
    copyError: copyMutation.error,
    
    mutate,
  };
}