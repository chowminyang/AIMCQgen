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
        No MCQs generated yet. Try creating one!
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
                copyToClipboard(item.generated_text, item.id);
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
            <div className="space-y-2">
              {item.reference_text && (
                <div>
                  <span className="font-medium">Reference:</span>
                  <pre className="mt-1 text-sm whitespace-pre-wrap">
                    {item.reference_text}
                  </pre>
                </div>
              )}
              <div className="mt-4">
                <pre className="whitespace-pre-wrap text-sm">{item.generated_text}</pre>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}