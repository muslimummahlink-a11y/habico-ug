import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface DeleteProtectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  itemLabel?: string;
}

export function DeleteProtectionDialog({
  open,
  onOpenChange,
  onVerified,
  itemLabel,
}: DeleteProtectionDialogProps) {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const { data: hasPassword } = useQuery({
    queryKey: ["has-protect-delete-password"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_protect_delete_password");
      if (error) return false;
      return data === true;
    },
  });

  const handleVerify = async () => {
    if (hasPassword && !password) {
      setError("Please enter your delete protection password");
      return;
    }

    if (!hasPassword) {
      onVerified();
      onOpenChange(false);
      return;
    }

    setVerifying(true);
    setError("");
    try {
      const { data: result, error: rpcError } = await supabase.rpc("verify_protect_delete_password", {
        p_password: password,
      });
      if (rpcError) throw rpcError;
      if (result === true) {
        onVerified();
        onOpenChange(false);
        setPassword("");
      } else {
        setError("Incorrect password");
      }
    } catch (e: any) {
      setError(e?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  if (hasPassword === false) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-accent" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            {itemLabel
              ? `Enter your delete protection password to delete this ${itemLabel}.`
              : "Enter your delete protection password to confirm this action."}
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="delete-password">Delete protection password</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter password"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button variant="destructive" onClick={handleVerify} disabled={verifying}>
            {verifying ? "Verifying..." : "Confirm delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
