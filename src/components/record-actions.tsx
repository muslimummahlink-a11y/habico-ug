import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Trash2, Edit2, Copy2, Loader2, Eye, EyeOff } from "lucide-react";
import { useRecordActions } from "@/hooks/use-record-actions";

interface RecordActionsProps<T> {
  item: T;
  table: string;
  // Optional custom handlers
  onDeleteConfirm?: (id: string) => void;
  onEdit?: (item: T) => void;
  onCopy?: (item: T) => void;
  // Custom column data for copy (which fields to exclude/copy)
  copyExcludeKeys?: (key: keyof T) => boolean;
}

export function RecordActions<T>({ item, table, onDeleteConfirm, onEdit, onCopy, copyExcludeKeys }: RecordActionsProps<T>) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { deleteMutation, editMutation, copyMutation } = useRecordActions({ table });

  const handleDelete = async (id: string) => {
    setOpen(true);
  };

  const handleEdit = () => {
    onEdit?.(item);
    setOpen(false);
  };

  const handleCopy = () => {
    onCopy?.(item);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Edit button */}
      <button
        onClick={handleEdit}
        className="text-primary hover:text-primary-foreground transition-colors p-1 rounded hover:bg-primary/10"
        title="Edit"
      >
        <Edit2 className="h-4 w-4" />
      </button>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="text-secondary hover:text-secondary-foreground transition-colors p-1 rounded hover:bg-secondary/10"
        title="Copy"
      >
        <Copy2 className="h-4 w-4" />
      </button>

      {/* Delete button with confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            onClick={() => handleDelete(item?.id ?? "")}
            className="text-destructive hover:text-destructive-foreground transition-colors p-1 rounded hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this item. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(item.id ?? "");
                setOpen(false);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}