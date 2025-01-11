import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MCQResponse } from "@/types";

interface MCQDisplayProps {
  mcq: MCQResponse;
}

export function MCQDisplay({ mcq }: MCQDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mcq.text).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "MCQ has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated MCQ</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm">{mcq.text}</pre>
      </CardContent>
    </Card>
  );
}