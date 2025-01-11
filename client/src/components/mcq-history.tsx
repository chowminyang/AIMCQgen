import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { MCQHistoryItem } from "@/types";
import { MCQEditForm } from "@/components/mcq-edit-form";

interface MCQHistoryProps {
  items: MCQHistoryItem[];
  onEdit: (mcq: MCQHistoryItem) => void;
}

export function MCQHistory({ items, onEdit }: MCQHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingMcq, setEditingMcq] = useState<MCQHistoryItem | null>(null);

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
        No saved MCQs yet. Generate and save an MCQ to see it here!
      </div>
    );
  }

  const handleEdit = (mcq: MCQHistoryItem) => {
    if (!mcq.parsed_data) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "This MCQ cannot be edited as it has no parsed data.",
      });
      return;
    }
    onEdit(mcq);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id.toString()}>
          <AccordionTrigger className="flex items-center gap-4">
            <div className="flex-1 text-left">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(item.created_at), "PPpp")}
              </div>
              {item.topic && (
                <div className="text-sm text-muted-foreground">
                  Topic: {item.topic}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item.generated_text, item.id);
                }}
              >
                {copiedId === item.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              {item.parsed_data && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              {/* Preview of the MCQ */}
              <div className="space-y-2">
                <div className="font-medium">Question Preview:</div>
                <div className="text-sm">
                  {item.parsed_data?.question || item.generated_text.slice(0, 200) + "..."}
                </div>
              </div>

              {item.reference_text && (
                <div>
                  <span className="font-medium">Reference:</span>
                  <pre className="mt-1 text-sm whitespace-pre-wrap">
                    {item.reference_text}
                  </pre>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const element = document.createElement("pre");
                  element.style.whiteSpace = "pre-wrap";
                  element.textContent = item.generated_text;

                  const range = document.createRange();
                  range.selectNode(element);
                  const selection = window.getSelection();
                  selection?.removeAllRanges();
                  selection?.addRange(range);

                  document.execCommand("copy");
                  selection?.removeAllRanges();

                  toast({
                    title: "Full MCQ copied",
                    description: "The complete MCQ has been copied to your clipboard",
                  });
                }}
              >
                View Full MCQ
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}