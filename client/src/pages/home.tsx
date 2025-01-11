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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().min(1, "Reference text is required"),
});

type FormData = z.infer<typeof formSchema>;

type MCQQuestion = {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
};

type MCQResponse = {
  questions: MCQQuestion[];
};

export default function Home() {
  const { toast } = useToast();
  const [mcqs, setMcqs] = useState<MCQResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      referenceText: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
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
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Generated MCQs:', result); // Debug log
      setMcqs(result);
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate MCQs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Generate MCQs</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the topic (e.g., Photosynthesis)" {...field} />
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
                      <FormLabel>Reference Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the reference text or content to generate questions from"
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate MCQs"
                  )}
                </Button>
              </form>
            </Form>

            {mcqs && mcqs.questions && mcqs.questions.length > 0 && (
              <div className="mt-8 space-y-6">
                <h2 className="text-2xl font-bold">Generated MCQs</h2>
                {mcqs.questions.map((mcq, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                      {index + 1}. {mcq.question}
                    </h3>
                    <div className="space-y-2 mb-4">
                      {Object.entries(mcq.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`p-3 rounded-lg ${
                            mcq.correctAnswer === key
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold">Explanation:</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {mcq.explanation}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}