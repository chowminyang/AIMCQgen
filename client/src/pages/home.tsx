import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQHistory } from "@/components/mcq-history";
import { MCQForm } from "@/components/mcq-form";
import { SaveMCQDialog } from "@/components/save-mcq-dialog";
import { PasswordOverlay } from "@/components/password-overlay";
import { generateMCQ, getMCQHistory, saveMCQ } from "@/lib/api";
import type { ParsedMCQ, MCQHistoryItem, MCQFormData } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      setGeneratedMCQ(result.raw);
      setParsedMCQ(result.parsed);
      setShowEditor(true);
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

  const handleSaveEdits = async (editedMCQ: ParsedMCQ) => {
    setParsedMCQ(editedMCQ);
    setShowSaveDialog(true);
  };

  const handleSaveMCQ = async (name: string) => {
    if (!parsedMCQ || !generatedMCQ) return;

    setIsSaving(true);
    try {
      await saveMCQ({
        name,
        topic: "Medical Topic", // You might want to store this from the form
        rawContent: generatedMCQ,
        parsedContent: parsedMCQ,
      });

      toast({
        title: "Success",
        description: "MCQ has been saved to library",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/mcq/history'] });
      setShowSaveDialog(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save MCQ",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMCQ = (mcq: MCQHistoryItem) => {
    setEditingMCQ(mcq);
    setGeneratedMCQ(mcq.raw_content);
    setParsedMCQ(mcq.parsed_content);
    setShowEditor(true);
  };

  const handleDeleteMCQ = async (id: number) => {
    try {
      await fetch(`/api/mcq/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['/api/mcq/history'] });
      toast({
        title: "Success",
        description: "MCQ deleted from library",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete MCQ",
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
              <CardTitle>Generating SBAs using reasoning LLMs</CardTitle>
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
              <div className="mt-4 flex justify-center gap-4">
                <Button onClick={() => setShowEditor(true)}>
                  Edit MCQ
                </Button>
                <Button onClick={() => setShowSaveDialog(true)}>
                  Save to Library
                </Button>
              </div>
            </div>
          )}

          {/* Edit MCQ Form */}
          {!isGenerating && showEditor && parsedMCQ && (
            <div className="w-full max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingMCQ ? `Editing: ${editingMCQ.name}` : 'Edit MCQ'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MCQEditForm
                    mcq={parsedMCQ}
                    onSave={handleSaveEdits}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditor(false);
                      setEditingMCQ(null);
                    }}
                    className="mt-4"
                  >
                    Back to View
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MCQ History */}
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>MCQ Library</CardTitle>
            </CardHeader>
            <CardContent>
              <MCQHistory
                items={mcqHistory}
                onEdit={handleEditMCQ}
                onDelete={handleDeleteMCQ}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <SaveMCQDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveMCQ}
        isLoading={isSaving}
      />
    </div>
  );
}