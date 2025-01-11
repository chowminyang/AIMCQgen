import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MCQResponse } from "@/types";
import { cn } from "@/lib/utils";

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Generated MCQ</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="h-8 w-8"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Clinical Scenario Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Clinical Scenario</h3>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm whitespace-pre-wrap">{mcq.mcq.clinicalScenario}</p>
          </div>
        </div>

        {/* Question Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Question</h3>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm">{mcq.mcq.question}</p>
          </div>
        </div>

        {/* Options Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Options</h3>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            {Object.entries(mcq.mcq.options).map(([key, value]) => (
              <div
                key={key}
                className={cn(
                  "text-sm p-2 rounded",
                  mcq.mcq.correctAnswer.trim() === key
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "hover:bg-muted/50"
                )}
              >
                <span className="font-semibold">{key}) </span>
                {value}
              </div>
            ))}
          </div>
        </div>

        {/* Correct Answer Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Correct Answer</h3>
          <div className="rounded-lg bg-green-100 dark:bg-green-900/20 p-4">
            <p className="text-sm">Option {mcq.mcq.correctAnswer}</p>
          </div>
        </div>

        {/* Explanation Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Explanation</h3>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm whitespace-pre-wrap">{mcq.mcq.explanation}</p>
          </div>
        </div>

        {/* Raw Text Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Raw Response</h3>
          <div className="rounded-lg bg-muted/50 p-4">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap font-mono">
              {mcq.text}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}