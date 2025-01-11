import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Edit, Loader2 } from "lucide-react";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQEditForm } from "@/components/mcq-edit-form";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { parseMCQText } from "@/lib/utils";
import type { ParsedMCQ } from "@/types";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const [generatedMCQ, setGeneratedMCQ] = useState<{ text: string } | null>(null);
  const [parsedMCQ, setParsedMCQ] = useState<ParsedMCQ | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      referenceText: "",
    },
  });

  const onGenerate = async (data: FormData) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/mcq/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setGeneratedMCQ(result);

      // Parse the generated text
      const parsed = parseMCQText(result.text);
      if (parsed) {
        setParsedMCQ(parsed);
      } else {
        throw new Error("Failed to parse MCQ text");
      }
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

  const onSave = async (editedMCQ: ParsedMCQ) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/mcq/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: form.getValues("topic"),
          generatedText: generatedMCQ?.text,
          parsedData: editedMCQ,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Success",
        description: "MCQ saved successfully",
      });

      setIsEditing(false);
      setParsedMCQ(editedMCQ);
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
                        <FormLabel>Reference Text (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the reference text or content (optional)"
                            className="min-h-[150px]"
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

          {/* Display Generated MCQ or Edit Form */}
          {!isGenerating && generatedMCQ && parsedMCQ && (
            <div className="w-full max-w-4xl mx-auto space-y-4">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit MCQ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MCQEditForm
                      mcq={parsedMCQ}
                      onSave={onSave}
                      isLoading={isSaving}
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="ml-auto"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit MCQ
                    </Button>
                  </div>
                  <MCQDisplay mcq={generatedMCQ} />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}