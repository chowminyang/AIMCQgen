import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { MCQFormData } from "@/types";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  purpose: z.string().min(1, "Purpose is required"),
  referenceText: z.string().optional(),
});

interface MCQFormProps {
  onSubmit: (data: MCQFormData) => void;
  isLoading: boolean;
}

export function MCQForm({ onSubmit, isLoading }: MCQFormProps) {
  const form = useForm<MCQFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      purpose: "",
      referenceText: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purpose</FormLabel>
              <FormControl>
                <Input placeholder="Enter MCQ purpose..." {...field} />
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate MCQ"}
        </Button>
      </form>
    </Form>
  );
}