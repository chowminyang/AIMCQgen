import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQHistory } from "@/components/mcq-history";
import { MCQForm } from "@/components/mcq-form";
import { PasswordOverlay } from "@/components/password-overlay";
import { SaveMCQDialog } from "@/components/save-mcq-dialog";
import { generateMCQ, getMCQHistory, saveMCQ, updateMCQ } from "@/lib/api";
import type { ParsedMCQ, MCQHistoryItem, MCQFormData } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { toast } = useToast();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingMcqId, setEditingMcqId] = useState<number | null>(null);

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
      setShowEditor(false);
      setEditingMcqId(null);
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

  const handleSaveToLibrary = async (name: string) => {
    if (!parsedMCQ || !generatedMCQ) return;

    try {
      await saveMCQ({
        name,
        topic: "",
        generatedText: generatedMCQ,
        parsedData: parsedMCQ,
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

  const handleEditSaved = async (mcq: MCQHistoryItem) => {
    if (!mcq.parsed_data) return;

    setGeneratedMCQ(mcq.generated_text);
    setParsedMCQ(mcq.parsed_data);
    setEditingMcqId(mcq.id);
    setShowEditor(true);
  };

  const handleSaveEdits = async (editedMCQ: ParsedMCQ) => {
    try {
      if (editingMcqId) {
        // Updating existing MCQ
        await updateMCQ(editingMcqId, {
          name: mcqHistory.find(m => m.id === editingMcqId)?.name || "Edited MCQ",
          generatedText: generatedMCQ || "",
          parsedData: editedMCQ,
        });
      }

      setParsedMCQ(editedMCQ);
      toast({
        title: "Success",
        description: "MCQ has been updated successfully",
      });
      refetchHistory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save edits",
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
              <CardTitle>Generate MCQs using o1-mini</CardTitle>
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
            <div className="w-full max-w-4xl mx-auto space-y-4">
              <MCQDisplay mcqText={generatedMCQ} />
              <div className="flex justify-center gap-4">
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
                    {editingMcqId ? "Edit Saved MCQ" : "Edit Generated MCQ"}
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
                      setEditingMcqId(null);
                    }}
                    className="mt-4"
                  >
                    Back to View
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MCQ Library */}
          {mcqHistory.length > 0 && (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>MCQ Library</CardTitle>
              </CardHeader>
              <CardContent>
                <MCQHistory
                  items={mcqHistory}
                  onEdit={handleEditSaved}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && parsedMCQ && (
          <SaveMCQDialog
            isOpen={showSaveDialog}
            onClose={() => setShowSaveDialog(false)}
            onSave={handleSaveToLibrary}
            mcq={parsedMCQ}
          />
        )}
      </main>
    </div>
  );
}