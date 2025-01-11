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
    const content = `Clinical Scenario:\n${mcq.clinicalScenario}\n\nQuestion:\n${mcq.question}\n\nOptions:\nA. ${mcq.options.A}\nB. ${mcq.options.B}\nC. ${mcq.options.C}\nD. ${mcq.options.D}\nE. ${mcq.options.E}\n\nCorrect Answer: ${mcq.correctAnswer}\n\nFeedback:\n${mcq.feedback}`;

    navigator.clipboard.writeText(content).then(() => {
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
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Clinical Scenario</h3>
          <p className="text-sm whitespace-pre-wrap">{mcq.clinicalScenario}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Question</h3>
          <p className="text-sm">{mcq.question}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Options</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(mcq.options).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium">{key}.</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Correct Answer</h3>
          <p className="text-sm">{mcq.correctAnswer}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Feedback</h3>
          <p className="text-sm whitespace-pre-wrap">{mcq.feedback}</p>
        </div>
      </CardContent>
    </Card>
  );
}
