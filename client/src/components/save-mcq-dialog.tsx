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
import { Save } from "lucide-react";
import type { ParsedMCQ } from "@/types";

interface SaveMCQDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  mcq: ParsedMCQ;
}

export function SaveMCQDialog({ isOpen, onClose, onSave, mcq }: SaveMCQDialogProps) {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please provide a name for this MCQ",
      });
      return;
    }

    onSave(name);
    setName("");
    onClose();
  };

  const defaultName = mcq.question.slice(0, 50) + "...";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save MCQ to Library
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="mcq-name" className="text-sm font-medium">
              MCQ Name
            </label>
            <Input
              id="mcq-name"
              placeholder={defaultName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            Save to Library
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
