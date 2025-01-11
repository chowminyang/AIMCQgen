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

  // Split the text into sections based on headers
  const sections = mcq.text.split('\n\n').reduce((acc: Record<string, string>, section) => {
    const headerMatch = section.match(/^(CLINICAL SCENARIO|QUESTION|OPTIONS|CORRECT ANSWER|EXPLANATION):/i);
    if (headerMatch) {
      const header = headerMatch[1].toUpperCase();
      const content = section.replace(/^.*?:/, '').trim();
      acc[header] = content;
    }
    return acc;
  }, {});

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
        {sections['CLINICAL SCENARIO'] && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Clinical Scenario</h3>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm whitespace-pre-wrap">{sections['CLINICAL SCENARIO']}</p>
            </div>
          </div>
        )}

        {/* Question Section */}
        {sections['QUESTION'] && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Question</h3>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm">{sections['QUESTION']}</p>
            </div>
          </div>
        )}

        {/* Options Section */}
        {sections['OPTIONS'] && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Options</h3>
            <div className="rounded-lg bg-muted/50 p-4">
              <pre className="text-sm font-sans whitespace-pre-wrap">
                {sections['OPTIONS']}
              </pre>
            </div>
          </div>
        )}

        {/* Correct Answer Section */}
        {sections['CORRECT ANSWER'] && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Correct Answer</h3>
            <div className="rounded-lg bg-green-100 dark:bg-green-900/20 p-4">
              <p className="text-sm">Option {sections['CORRECT ANSWER']}</p>
            </div>
          </div>
        )}

        {/* Explanation Section */}
        {sections['EXPLANATION'] && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Explanation</h3>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm whitespace-pre-wrap">{sections['EXPLANATION']}</p>
            </div>
          </div>
        )}

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