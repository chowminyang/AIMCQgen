import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ParsedMCQ } from "@/types";

interface MCQDisplayProps {
  mcq: ParsedMCQ;
}

export function MCQDisplay({ mcq }: MCQDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formattedMCQ = `Clinical Scenario:
${mcq.clinicalScenario}

Question:
${mcq.question}

Options:
A) ${mcq.options.A}
B) ${mcq.options.B}
C) ${mcq.options.C}
D) ${mcq.options.D}
E) ${mcq.options.E}

Correct Answer: ${mcq.correctAnswer}

Explanation:
${mcq.explanation}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedMCQ).then(() => {
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
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Clinical Scenario</h3>
              <p className="whitespace-pre-wrap">{mcq.clinicalScenario}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Question</h3>
              <p className="whitespace-pre-wrap">{mcq.question}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Options</h3>
              {Object.entries(mcq.options).map(([letter, text]) => (
                <div key={letter} className="ml-4 mb-2">
                  <span className="font-medium">{letter}) </span>
                  {text}
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Correct Answer</h3>
              <p>{mcq.correctAnswer}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Explanation</h3>
              <p className="whitespace-pre-wrap">{mcq.explanation}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}