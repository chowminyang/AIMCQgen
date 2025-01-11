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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import type { ParsedMCQ } from "@/types";

// Make all fields optional in the form initially
const formSchema = z.object({
  clinicalScenario: z.string().optional(),
  question: z.string().optional(),
  options: z.object({
    A: z.string().optional(),
    B: z.string().optional(),
    C: z.string().optional(),
    D: z.string().optional(),
    E: z.string().optional(),
  }),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
}).superRefine((data, ctx) => {
  // Only validate required fields on submit
  if (!data.clinicalScenario) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Clinical scenario is required",
      path: ["clinicalScenario"],
    });
  }
  if (!data.question) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Question is required",
      path: ["question"],
    });
  }
  if (!data.correctAnswer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Correct answer is required",
      path: ["correctAnswer"],
    });
  }
  if (!data.explanation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Explanation is required",
      path: ["explanation"],
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  mcq: ParsedMCQ;
  onSave: (data: ParsedMCQ) => void;
  isLoading?: boolean;
}

export function MCQEditForm({ mcq, onSave, isLoading = false }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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

  const onSubmit = (data: FormData) => {
    // Convert back to ParsedMCQ type
    const submissionData: ParsedMCQ = {
      clinicalScenario: data.clinicalScenario || "",
      question: data.question || "",
      options: {
        A: data.options.A || "",
        B: data.options.B || "",
        C: data.options.C || "",
        D: data.options.D || "",
        E: data.options.E || "",
      },
      correctAnswer: data.correctAnswer || "",
      explanation: data.explanation || "",
    };
    onSave(submissionData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit MCQ</CardTitle>
      </CardHeader>
      <CardContent>
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
                      placeholder="Enter clinical scenario..."
                      className="min-h-[150px]"
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
                      placeholder="Enter question..."
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
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter correct answer (A-E)..."
                      maxLength={1}
                      {...field}
                    />
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
                      placeholder="Enter explanation..."
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
                  Saving Changes...
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
      </CardContent>
    </Card>
  );
}