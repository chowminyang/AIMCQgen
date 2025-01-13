import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQHistory } from "@/components/mcq-history";
import { MCQForm } from "@/components/mcq-form";
import { PasswordOverlay } from "@/components/password-overlay";
import { generateMCQ, getMCQHistory, saveMCQ, deleteMCQ } from "@/lib/api";
import type { ParsedMCQ, MCQHistoryItem, MCQFormData } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PromptEditor } from "@/components/prompt-editor";
import { AppInfoModal } from "@/components/app-info-modal";
import { ModelSelector } from "@/components/model-selector";
import { TutorialModal } from "@/components/tutorial-modal";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState<MCQHistoryItem | null>(null);
  const [currentMCQTopic, setCurrentMCQTopic] = useState<string>("");

  const { data: mcqHistory = [] } = useQuery<MCQHistoryItem[]>({
    queryKey: ['/api/mcq/history'],
    enabled: isAuthenticated,
  });

  const { data: promptData } = useQuery<{ prompt: string }>({
    queryKey: ['/api/prompt'],
    enabled: isAuthenticated,
  });

  const handleRateMCQ = async (id: number, rating: number) => {
    try {
      await fetch(`/api/mcq/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/mcq/history'] });
      toast({
        title: "Success",
        description: "MCQ rating has been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update MCQ rating",
      });
    }
  };

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

  const handleSaveEdits = async (editedMCQ: ParsedMCQ & { name: string }) => {
    if (editingMCQ) {
      try {
        const response = await fetch(`/api/mcq/${editingMCQ.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editedMCQ.name,
            parsedContent: {
              clinicalScenario: editedMCQ.clinicalScenario,
              question: editedMCQ.question,
              options: editedMCQ.options,
              correctAnswer: editedMCQ.correctAnswer,
              explanation: editedMCQ.explanation,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        queryClient.invalidateQueries({ queryKey: ['/api/mcq/history'] });
        toast({
          title: "Success",
          description: "MCQ has been updated",
        });

        setShowEditor(false);
        setEditingMCQ(null);
        setParsedMCQ(null);
        setGeneratedMCQ(null);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update MCQ",
        });
      }
    } else {
      // Direct save without dialog
      setIsSaving(true);
      try {
        await saveMCQ({
          name: editedMCQ.name,
          topic: currentMCQTopic,
          rawContent: generatedMCQ || '',
          parsedContent: {
            clinicalScenario: editedMCQ.clinicalScenario,
            question: editedMCQ.question,
            options: editedMCQ.options,
            correctAnswer: editedMCQ.correctAnswer,
            explanation: editedMCQ.explanation,
          },
        });

        toast({
          title: "Success",
          description: "MCQ has been saved to library",
        });

        queryClient.invalidateQueries({ queryKey: ['/api/mcq/history'] });
        setShowEditor(false);
        setEditingMCQ(null);
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
    }
  };

  const handleEditMCQ = (mcq: MCQHistoryItem) => {
    setEditingMCQ(mcq);
    setGeneratedMCQ(mcq.raw_content);
    setParsedMCQ({
      ...mcq.parsed_content,
      name: mcq.name,
    });
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

  const handleUpdatePrompt = async (newPrompt: string) => {
    try {
      await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: newPrompt }),
      });

      queryClient.invalidateQueries({ queryKey: ['/api/prompt'] });
      toast({
        title: "Success",
        description: "System prompt has been updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update prompt",
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
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="mb-2">Generating SBAs using reasoning LLMs</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This app leverages OpenAI's o1 series of reasoning models to generate high-quality Single Best Answer (SBA) questions. Simply input your medical topic, and the AI will thoughtfully construct a challenging question following structured educational guidelines by reasoning through a chain-of-thought process.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This application is experimental and copyrighted to <em className="font-bold">Chow Minyang, 2025</em>.
                </p>
                <div className="mt-4">
                  <ModelSelector />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <ThemeToggle />
                <TutorialModal />
                <AppInfoModal />
              </div>
            </CardHeader>
            <CardContent>
              <MCQForm onSubmit={onGenerate} isLoading={isGenerating} />
            </CardContent>
          </Card>

          {isGenerating && (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="mb-2">Generating MCQ...</CardTitle>
              </CardHeader>
              <CardContent>
                <MCQLoadingState />
              </CardContent>
            </Card>
          )}

          {!isGenerating && showEditor && parsedMCQ && (
            <div className="w-full max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="mb-2">
                    {editingMCQ ? `Editing: ${editingMCQ.name}` : 'Edit MCQ'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MCQEditForm
                    mcq={{
                      ...parsedMCQ,
                      name: editingMCQ?.name || '',
                    }}
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
                    }}
                    className="mt-4"
                  >
                    Back to View
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="mb-2">MCQ Library</CardTitle>
            </CardHeader>
            <CardContent>
              <MCQHistory
                items={mcqHistory}
                onEdit={handleEditMCQ}
                onDelete={handleDeleteMCQ}
                onRate={handleRateMCQ}
              />
            </CardContent>
          </Card>

          <div className="w-full max-w-4xl mx-auto">
            <PromptEditor
              currentPrompt={promptData?.prompt || ''}
              onSave={handleUpdatePrompt}
            />
          </div>
        </div>
      </main>
    </div>
  );
}