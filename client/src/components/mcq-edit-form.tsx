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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Wand2 } from "lucide-react";
import type { ParsedMCQ } from "@/types";
import { rewriteClinicalScenario } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const mcqFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clinicalScenario: z.string().min(1, "Clinical scenario is required"),
  question: z.string().min(1, "Question is required"),
  options: z.object({
    A: z.string().min(1, "Option A is required"),
    B: z.string().min(1, "Option B is required"),
    C: z.string().min(1, "Option C is required"),
    D: z.string().min(1, "Option D is required"),
    E: z.string().min(1, "Option E is required"),
  }),
  correctAnswer: z.string().refine(val => /^[A-E]$/.test(val), {
    message: "Correct answer must be a single letter (A-E)",
  }),
  explanation: z.string().min(1, "Explanation is required"),
});

type FormData = z.infer<typeof mcqFormSchema>;

type Props = {
  mcq: ParsedMCQ & { name: string };
  onSave: (data: FormData) => void;
  isLoading?: boolean;
};

export function MCQEditForm({ mcq, onSave, isLoading = false }: Props) {
  const { toast } = useToast();
  const [isRewriting, setIsRewriting] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(mcqFormSchema),
    defaultValues: {
      name: mcq.name || '',
      clinicalScenario: mcq.clinicalScenario || '',
      question: mcq.question || '',
      options: mcq.options || {
        A: '',
        B: '',
        C: '',
        D: '',
        E: '',
      },
      correctAnswer: mcq.correctAnswer?.trim() || '',
      explanation: mcq.explanation || '',
    },
  });

  const handleRewrite = async () => {
    const currentText = form.getValues("clinicalScenario");
    if (!currentText.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Clinical scenario field is empty",
      });
      return;
    }

    setIsRewriting(true);
    try {
      const rewrittenText = await rewriteClinicalScenario(currentText);
      form.setValue("clinicalScenario", rewrittenText);
      toast({
        title: "Success",
        description: "Clinical scenario has been rewritten",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to rewrite clinical scenario",
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const onSubmit = (data: FormData) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>MCQ Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter MCQ name..." 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clinicalScenario"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Clinical Scenario</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRewrite}
                  disabled={isRewriting}
                  className="gap-2"
                >
                  {isRewriting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isRewriting ? "Rewriting..." : "Re-write with AI"}
                </Button>
              </div>
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

        <FormField
          control={form.control}
          name="correctAnswer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correct Answer</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E'].map(letter => (
                    <SelectItem key={letter} value={letter}>
                      Option {letter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
  );
}