import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQHistory } from "@/components/mcq-history";
import { MCQForm } from "@/components/mcq-form";
import { generateMCQ, getMCQHistory } from "@/lib/api";
import type { ParsedMCQ, MCQHistoryItem, MCQFormData } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { toast } = useToast();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const { data: mcqHistory = [], refetch: refetchHistory } = useQuery<MCQHistoryItem[]>({
    queryKey: ['/api/mcq/history'],
  });

  const onGenerate = async (data: MCQFormData) => {
    setIsGenerating(true);
    try {
      const result = await generateMCQ(data);
      setGeneratedMCQ(result.raw);
      setParsedMCQ(result.parsed);
      setShowEditor(true);

      // Save to database
      await fetch('/api/mcq/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: data.topic,
          referenceText: data.referenceText,
          generatedText: result.raw,
        }),
      });

      // Refresh history
      refetchHistory();
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate MCQ",
      });
      setGeneratedMCQ(null);
      setParsedMCQ(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = (editedMCQ: ParsedMCQ) => {
    setParsedMCQ(editedMCQ);
    toast({
      title: "Success",
      description: "MCQ has been updated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4">
        <div className="space-y-8">
          {/* Generation Form */}
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Generating SBAs using reasoning LLMs (o1-mini)</CardTitle>
            </CardHeader>
            <CardContent>
              <MCQForm onSubmit={onGenerate} isLoading={isGenerating} />
            </CardContent>
          </Card>

          {/* Loading State */}
          {isGenerating && (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Generating MCQ...</CardTitle>
              </CardHeader>
              <CardContent>
                <MCQLoadingState />
              </CardContent>
            </Card>
          )}

          {/* Display Generated MCQ */}
          {!isGenerating && !showEditor && generatedMCQ && (
            <div className="w-full max-w-4xl mx-auto">
              <MCQDisplay mcqText={generatedMCQ} />
              <div className="mt-4 flex justify-center">
                <Button onClick={() => setShowEditor(true)}>
                  Edit MCQ
                </Button>
              </div>
            </div>
          )}

          {/* Edit MCQ Form */}
          {!isGenerating && showEditor && parsedMCQ && (
            <div className="w-full max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Edit MCQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <MCQEditForm
                    mcq={parsedMCQ}
                    onSave={handleSaveEdits}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowEditor(false)}
                    className="mt-4"
                  >
                    Back to View
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MCQ History */}
          {mcqHistory.length > 0 && (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>MCQ Library</CardTitle>
              </CardHeader>
              <CardContent>
                <MCQHistory items={mcqHistory} />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}