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
import { generateMCQ, getMCQHistory, saveMCQ, deleteMCQ } from "@/lib/api";
import type { ParsedMCQ, MCQHistoryItem, MCQFormData } from "@/types";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { PromptEditor } from "@/components/prompt-editor";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [editedMCQ, setEditedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQHistoryItem | null>(null);
  const [currentMCQTopic, setCurrentMCQTopic] = useState<string>("");

  const { data: mcqHistory = [] } = useQuery<MCQHistoryItem[]>({
    queryKey: ['/api/mcq/history'],
    enabled: isAuthenticated,
  });

  const { data: promptData } = useQuery({
    queryKey: ['/api/prompt'],
    enabled: isAuthenticated,
  });

  const updatePromptMutation = useMutation({
    mutationFn: async (newPrompt: string) => {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: newPrompt }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prompt'] });
      toast({
        title: "Success",
        description: "System prompt has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update prompt",
      });
    },
  });

  const onGenerate = async (data: MCQFormData) => {
    setIsGenerating(true);
    try {
      const result = await generateMCQ(data);
      setGeneratedMCQ(result.raw);
      setParsedMCQ(result.parsed);
      setCurrentMCQTopic(data.topic);
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
    console.log('Saving edits:', editedMCQ);
    setEditedMCQ(editedMCQ);
    setShowSaveDialog(true);
  };

  const handleSaveMCQ = async (name: string) => {
    if (!editedMCQ) return;

    setIsSaving(true);
    try {
      await saveMCQ({
        name,
        topic: currentMCQTopic,
        rawContent: generatedMCQ || '',
        parsedContent: editedMCQ,
      });

      toast({
        title: "Success",
        description: "MCQ has been saved to library",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/mcq/history'] });
      setShowSaveDialog(false);
      setShowEditor(false);
      setEditingMCQ(null);
      setEditedMCQ(null);
      setParsedMCQ(null);
      setGeneratedMCQ(null);
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
    setCurrentMCQTopic(mcq.topic);
    setShowEditor(true);
  };

  const handleDeleteMCQ = async (id: number) => {
    try {
      await deleteMCQ(id);
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
              <p className="text-sm text-muted-foreground">
                This app leverages OpenAI's o1-mini reasoning model to generate high-quality Single Best Answer (SBA) questions. Simply input your medical topic, and the AI will thoughtfully construct a challenging question following structured educational guidelines by reasoning through a chain-of-thought process.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This application is experimental and copyrighted to Chow Minyang, 2025.
              </p>
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
                    isLoading={isSaving}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditor(false);
                      setEditingMCQ(null);
                      setGeneratedMCQ(null);
                      setParsedMCQ(null);
                      setEditedMCQ(null);
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

          {/* Prompt Editor - Moved below MCQ Library */}
          <div className="w-full max-w-4xl mx-auto">
            <PromptEditor
              currentPrompt={promptData?.prompt || ''}
              onSave={(newPrompt) => updatePromptMutation.mutate(newPrompt)}
            />
          </div>
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