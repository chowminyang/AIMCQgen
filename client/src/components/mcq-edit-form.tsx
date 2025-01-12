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
import { Loader2, Save } from "lucide-react";
import type { ParsedMCQ } from "@/types";

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
  correctAnswer: z.string().refine(val => /^[A-E]$/.test(val), {
    message: "Correct answer must be a single letter (A-E)",
  }),
  explanation: z.string().min(1, "Explanation is required"),
});

type Props = {
  mcq: ParsedMCQ;
  onSave: (data: ParsedMCQ) => void;
  isLoading?: boolean;
};

export function MCQEditForm({ mcq, onSave, isLoading = false }: Props) {
  const form = useForm<ParsedMCQ>({
    resolver: zodResolver(mcqFormSchema),
    defaultValues: mcq,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
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

        {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => (
          <FormField
            key={letter}
            control={form.control}
            name={`options.${letter}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option {letter}</FormLabel>
                <FormControl>
                  <Input placeholder={`Enter option ${letter}...`} {...field} />
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