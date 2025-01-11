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
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().min(1, "Reference text is required"),
});

type FormData = z.infer<typeof formSchema>;

type MCQ = {
  clinicalScenario: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correctAnswer: string;
  explanation: string;
};

type MCQResponse = {
  mcq: MCQ;
};

export default function Home() {
  const { toast } = useToast();
  const [mcq, setMcq] = useState<MCQ | null>(null);
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

  const editForm = useForm<MCQ>({
    defaultValues: mcq || {
      clinicalScenario: "",
      question: "",
      options: { A: "", B: "", C: "", D: "", E: "" },
      correctAnswer: "",
      explanation: "",
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
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result: MCQResponse = await response.json();
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

  const onSave = async (mcqData: MCQ) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/mcq/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
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

          {/* Edit Form */}
          {mcq && isEditing && (
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
                    {["A", "B", "C", "D", "E"].map((option) => (
                      <FormField
                        key={option}
                        control={editForm.control}
                        name={`options.${option}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Option {option}</FormLabel>
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
          )}
        </div>
      </main>
    </div>
  );
}