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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import type { ParsedMCQ } from "@/types";

const optionsSchema = z.object({
  A: z.string().optional().default(""),
  B: z.string().optional().default(""),
  C: z.string().optional().default(""),
  D: z.string().optional().default(""),
  E: z.string().optional().default(""),
});

const mcqFormSchema = z.object({
  clinicalScenario: z.string().min(1, "Clinical scenario is required"),
  question: z.string().min(1, "Question is required"),
  options: optionsSchema,
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().min(1, "Explanation is required"),
});

type MCQFormData = z.infer<typeof mcqFormSchema>;

interface Props {
  mcq: ParsedMCQ;
  onSave: (data: ParsedMCQ) => void;
  isLoading?: boolean;
}

export function MCQEditForm({ mcq, onSave, isLoading = false }: Props) {
  console.log("Initial MCQ data:", mcq); // Debug log

  const form = useForm<MCQFormData>({
    resolver: zodResolver(mcqFormSchema),
    defaultValues: {
      clinicalScenario: mcq.clinicalScenario || "",
      question: mcq.question || "",
      options: {
        A: mcq.options.A || "",
        B: mcq.options.B || "",
        C: mcq.options.C || "",
        D: mcq.options.D || "",
        E: mcq.options.E || "",
      },
      correctAnswer: mcq.correctAnswer || "",
      explanation: mcq.explanation || "",
    },
  });

  const onSubmit = (data: MCQFormData) => {
    console.log("Form submission data:", data); // Debug log
    onSave(data as ParsedMCQ);
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="clinicalScenario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clinical Scenario</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the clinical scenario..."
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the question..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="font-medium">Options</h3>
            {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => (
              <FormField
                key={letter}
                control={form.control}
                name={`options.${letter}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {letter}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Enter option ${letter}...`} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <FormField
            control={form.control}
            name="correctAnswer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer (A-E)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the correct answer letter..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Explanation</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the explanation..."
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}