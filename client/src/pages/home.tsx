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
import { MCQDisplay } from "@/components/mcq-display";
import { MCQLoadingState } from "@/components/mcq-loading-state";
import { generateMCQ } from "@/lib/api";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const [generatedMCQ, setGeneratedMCQ] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      const result = await generateMCQ(data);
      setGeneratedMCQ(result);
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate MCQ",
      });
      setGeneratedMCQ(null);
    } finally {
      setIsGenerating(false);
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
          {!isGenerating && generatedMCQ && (
            <div className="w-full max-w-4xl mx-auto">
              <MCQDisplay mcqText={generatedMCQ} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}