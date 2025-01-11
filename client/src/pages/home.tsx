import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQHistory } from "@/components/mcq-history";
import { generateMCQ, getMCQHistory } from "@/lib/api";
import type { ParsedMCQ, MCQHistoryItem } from "@/types";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string>("");

  const { data: mcqHistory = [], refetch: refetchHistory } = useQuery<MCQHistoryItem[]>({
    queryKey: ['/api/mcq/history'],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      referenceText: "",
    },
  });

  const onGenerate = async (data: FormData) => {
    setIsGenerating(true);
    setCurrentTopic(data.topic);
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

  const handleSaveToLibrary = async (mcq: ParsedMCQ) => {
    setIsSaving(true);
    try {
      await fetch('/api/mcq/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: currentTopic,
          clinical_scenario: mcq.clinicalScenario,
          question: mcq.question,
          options: mcq.options,
          correct_answer: mcq.correctAnswer,
          explanation: mcq.explanation,
          reference_text: form.getValues().referenceText,
        }),
      });

      toast({
        title: "Success",
        description: "MCQ has been saved to your library",
      });

      // Refresh history
      refetchHistory();
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save MCQ",
      });
    } finally {
      setIsSaving(false);
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
              <CardTitle>Generate Medical MCQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter MCQ topic..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referenceText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Material (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste reference text here..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate MCQ"
                    )}
                  </Button>
                </form>
              </Form>
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
                  <div className="mt-4 flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditor(false)}
                    >
                      Back to View
                    </Button>
                    <Button
                      onClick={() => handleSaveToLibrary(parsedMCQ)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving to Library...
                        </>
                      ) : (
                        "Save to Library"
                      )}
                    </Button>
                  </div>
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