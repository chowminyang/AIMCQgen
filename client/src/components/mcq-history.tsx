import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { MCQHistoryItem } from "@/types";

interface MCQHistoryProps {
  items: MCQHistoryItem[];
}

export function MCQHistory({ items }: MCQHistoryProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (mcq: MCQHistoryItem, id: number) => {
    const formattedMCQ = `CLINICAL SCENARIO:
${mcq.clinical_scenario}

QUESTION:
${mcq.question}

OPTIONS:
A) ${mcq.options.A}
B) ${mcq.options.B}
C) ${mcq.options.C}
D) ${mcq.options.D}
E) ${mcq.options.E}

CORRECT ANSWER: ${mcq.correct_answer}

EXPLANATION:
${mcq.explanation}`;

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
        No MCQs saved yet. Create and save one to your library!
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id.toString()}>
          <AccordionTrigger className="flex items-center gap-4">
            <div className="flex-1 text-left">
              <div className="font-medium">{item.topic}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(item.created_at), "PPpp")}
              </div>
            </div>
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
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {item.reference_text && (
                <div>
                  <div className="font-medium mb-1">Reference Material:</div>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                    {item.reference_text}
                  </pre>
                </div>
              )}
              <div>
                <div className="font-medium mb-1">Clinical Scenario:</div>
                <div className="text-sm">{item.clinical_scenario}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Question:</div>
                <div className="text-sm">{item.question}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Options:</div>
                <div className="text-sm space-y-1">
                  {Object.entries(item.options).map(([letter, text]) => (
                    <div key={letter}>
                      <span className="font-medium">{letter}) </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Correct Answer:</div>
                <div className="text-sm">{item.correct_answer}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Explanation:</div>
                <div className="text-sm">{item.explanation}</div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}