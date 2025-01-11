import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQHistory } from "@/components/mcq-history";
import { MCQForm } from "@/components/mcq-form";
import { PasswordOverlay } from "@/components/password-overlay";
import { generateMCQ, getMCQHistory } from "@/lib/api";
import { parseMCQText } from "@/lib/utils";
import type { ParsedMCQ, MCQHistoryItem, MCQFormData } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { toast } = useToast();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQHistoryItem | null>(null);

  const { data: mcqHistory = [], refetch: refetchHistory } = useQuery<MCQHistoryItem[]>({
    queryKey: ['/api/mcq/history'],
    enabled: isAuthenticated,
  });

  const onGenerate = async (data: MCQFormData) => {
    setIsGenerating(true);
    try {
      const result = await generateMCQ(data);
      setGeneratedMCQ(result.generated);

      const parsed = parseMCQText(result.generated);
      if (!parsed) {
        throw new Error("Failed to parse generated MCQ");
      }
      setParsedMCQ(parsed);
      setEditingMCQ(null);
      setShowEditor(false);
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

  const handleSave = async (name: string) => {
    if (!parsedMCQ) return;

    try {
      await fetch('/api/mcq/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          topic: editingMCQ?.topic || "General",
          ...parsedMCQ,
        }),
      });

      toast({
        title: "Success",
        description: "MCQ has been saved to your library",
      });

      refetchHistory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save MCQ",
      });
    }
  };

  const handleEdit = (mcq: MCQHistoryItem) => {
    setEditingMCQ(mcq);
    setParsedMCQ({
      clinicalScenario: mcq.clinical_scenario,
      question: mcq.question,
      options: mcq.options,
      correctAnswer: mcq.correct_answer,
      explanation: mcq.explanation,
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/mcq/${id}`, { method: 'DELETE' });
      toast({
        title: "Success",
        description: "MCQ has been deleted from your library",
      });
      refetchHistory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete MCQ",
      });
    }
  };

  const handleSaveEdits = async (editedMCQ: ParsedMCQ) => {
    if (!editingMCQ) return;

    try {
      await fetch(`/api/mcq/${editingMCQ.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editedMCQ,
          name: editingMCQ.name,
          topic: editingMCQ.topic,
        }),
      });

      toast({
        title: "Success",
        description: "MCQ has been updated successfully",
      });

      setShowEditor(false);
      setEditingMCQ(null);
      refetchHistory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update MCQ",
      });
    }
  };

  if (!isAuthenticated) {
    return <PasswordOverlay onSuccess={() => setIsAuthenticated(true)} />;
  }

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
          {!isGenerating && generatedMCQ && !showEditor && (
            <div className="w-full max-w-4xl mx-auto">
              <MCQDisplay 
                mcqText={generatedMCQ} 
                onSave={handleSave}
              />
            </div>
          )}

          {/* Edit MCQ Form */}
          {!isGenerating && showEditor && parsedMCQ && (
            <div className="w-full max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingMCQ ? `Editing: ${editingMCQ.name}` : "Edit MCQ"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MCQEditForm
                    mcq={parsedMCQ}
                    onSave={editingMCQ ? handleSaveEdits : undefined}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* MCQ Library */}
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>MCQ Library</CardTitle>
            </CardHeader>
            <CardContent>
              <MCQHistory 
                items={mcqHistory} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}