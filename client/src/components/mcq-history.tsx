import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Copy, Check, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { MCQHistoryItem } from "@/types";

interface MCQHistoryProps {
  items: MCQHistoryItem[];
  onEdit?: (mcq: MCQHistoryItem) => void;
  onDelete?: (id: number) => void;
}

export function MCQHistory({ items, onEdit, onDelete }: MCQHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (mcq: MCQHistoryItem, id: number) => {
    const formattedMCQ = `CLINICAL SCENARIO:\n${mcq.clinical_scenario}\n\nQUESTION:\n${mcq.question}\n\nOPTIONS:\nA) ${mcq.options.A}\nB) ${mcq.options.B}\nC) ${mcq.options.C}\nD) ${mcq.options.D}\nE) ${mcq.options.E}\n\nCORRECT ANSWER: ${mcq.correct_answer}\n\nEXPLANATION:\n${mcq.explanation}`;

    navigator.clipboard.writeText(formattedMCQ).then(() => {
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
        No saved MCQs yet. Generate an MCQ and save it to your library!
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id.toString()}>
          <div className="flex items-center justify-between">
            <AccordionTrigger className="flex-1">
              <div className="text-left">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  Topic: {item.topic} • Created {format(new Date(item.created_at), "PPpp")}
                </div>
              </div>
            </AccordionTrigger>
            <div className="flex gap-2 pr-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(item, item.id);
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
                  onEdit?.(item);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item.id);
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Clinical Scenario</h4>
                <p className="text-sm">{item.clinical_scenario}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Question</h4>
                <p className="text-sm">{item.question}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Options</h4>
                <div className="space-y-1 text-sm">
                  <p>A) {item.options.A}</p>
                  <p>B) {item.options.B}</p>
                  <p>C) {item.options.C}</p>
                  <p>D) {item.options.D}</p>
                  <p>E) {item.options.E}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Correct Answer</h4>
                <p className="text-sm">{item.correct_answer}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Explanation</h4>
                <p className="text-sm">{item.explanation}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}