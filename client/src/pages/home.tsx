import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Loader2, Save } from "lucide-react";
import { MCQLoadingState } from "@/components/mcq-loading-state";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().min(1, "Reference text is required"),
});

const mcqFormSchema = z.object({
  clinicalScenario: z.string().min(1, "Clinical scenario is required"),
  question: z.string().min(1, "Question is required"),
  options: z.object({
    A: z.string().min(1, "Option A is required"),
    B: z.string().min(1, "Option B is required"),
    C: z.string().min(1, "Option C is required"),
    D: z.string().min(1, "Option D is required"),
    E: z.string().min(1, "Option E is required"),
  }),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().min(1, "Explanation is required"),
});

type FormData = z.infer<typeof formSchema>;
type MCQFormData = z.infer<typeof mcqFormSchema>;

export default function Home() {
  const { toast } = useToast();
  const [mcq, setMcq] = useState<MCQFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const generateForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      referenceText: "",
    },
  });

  const editForm = useForm<MCQFormData>({
    resolver: zodResolver(mcqFormSchema),
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
      setMcq(result.mcq);
      setIsEditing(true);
      editForm.reset(result.mcq);
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate MCQ",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSave = async (mcqData: MCQFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/mcq/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...mcqData,
          topic: generateForm.getValues("topic"),
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
              <Form {...generateForm}>
                <form onSubmit={generateForm.handleSubmit(onGenerate)} className="space-y-6">
                  <FormField
                    control={generateForm.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter the medical topic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generateForm.control}
                    name="referenceText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the reference text or content"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isGenerating}>
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

          {/* Loading State or Edit Form */}
          <AnimatePresence mode="wait">
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

            {mcq && isEditing && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="w-full max-w-4xl mx-auto">
                  <CardHeader>
                    <CardTitle>Edit MCQ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit(onSave)} className="space-y-6">
                        <FormField
                          control={editForm.control}
                          name="clinicalScenario"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Clinical Scenario</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[200px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="question"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {(['A', 'B', 'C', 'D', 'E'] as const).map((key) => (
                          <FormField
                            key={key}
                            control={editForm.control}
                            name={`options.${key}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Option {key}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                        <FormField
                          control={editForm.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correct Answer</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="explanation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Explanation</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="min-h-[150px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save MCQ
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}