import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import type { MCQResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface MCQDisplayProps {
  mcq: MCQResponse;
  formData: {
    topic: string;
    purpose: string;
    referenceText: string;
  };
}

export function MCQDisplay({ mcq, formData }: MCQDisplayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState(mcq.text);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/mcq/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          generatedText: mcq.text,
          editedText: editedText !== mcq.text ? editedText : null
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcq/history"] });
      toast({
        title: "MCQ saved",
        description: "Your MCQ has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedText).then(() => {
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="h-8 w-8"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="h-8 w-8"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />
      </CardContent>
    </Card>
  );
}