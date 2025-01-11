import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, Check, Pencil, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { MCQHistoryItem } from "@/types";

interface MCQHistoryProps {
  items: MCQHistoryItem[];
  onEdit: (mcq: MCQHistoryItem) => void;
  onDelete: (id: number) => void;
}

export function MCQHistory({ items, onEdit, onDelete }: MCQHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast({
        title: "Copied to clipboard",
        description: "MCQ has been copied to your clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No MCQs in library yet. Try creating one!
      </div>
    );
  }

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id.toString()}>
            <AccordionTrigger className="flex items-center gap-4">
              <div className="flex-1 text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  Topic: {item.topic} • {format(new Date(item.created_at), "PPpp")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(item.raw_content, item.id);
                  }}
                >
                  {copiedId === item.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(item.id);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm font-sans">{item.raw_content}</pre>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MCQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this MCQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}