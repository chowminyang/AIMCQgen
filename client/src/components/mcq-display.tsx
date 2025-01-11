import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MCQDisplayProps {
  mcqText: string;
}

export function MCQDisplay({ mcqText }: MCQDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mcqText).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "MCQ has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Split the text into sections
  //This section is removed because the edited code doesn't use it.
  // const sections = mcqText.split('\n\n');

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
          <pre className="text-sm whitespace-pre-wrap font-sans">
            {mcqText}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}