import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface PasswordOverlayProps {
  onSuccess: () => void;
}

export function PasswordOverlay({ onSuccess }: PasswordOverlayProps) {
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const CORRECT_PASSWORD = "CMYMCQ";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      onSuccess();
      toast({
        title: "Access granted",
        description: "Welcome to the MCQ Generator",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Incorrect password",
      });
      setPassword("");
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Enter Password to Continue
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
