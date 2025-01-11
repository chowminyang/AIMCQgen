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
import { encode } from "gpt-tokenizer";
import type { MCQFormData } from "@/types";
import { useState, useEffect } from "react";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().optional().default(""),
});

interface MCQFormProps {
  onSubmit: (data: MCQFormData) => void;
  isLoading: boolean;
}

const MAX_TOKENS = 128000;

export function MCQForm({ onSubmit, isLoading }: MCQFormProps) {
  const [tokenCount, setTokenCount] = useState(0);
  const form = useForm<MCQFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      referenceText: "",
    },
  });

  const watchReferenceText = form.watch("referenceText");

  useEffect(() => {
    if (watchReferenceText) {
      const tokens = encode(watchReferenceText).length;
      setTokenCount(tokens);
    } else {
      setTokenCount(0);
    }
  }, [watchReferenceText]);

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
                <Input placeholder="Enter medical topic for MCQ..." {...field} />
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
              <div className="space-y-2">
                <FormControl>
                  <Textarea
                    placeholder="Paste reference text here..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <div className={`text-sm ${tokenCount > MAX_TOKENS ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {tokenCount} / {MAX_TOKENS} tokens used
                  {tokenCount > MAX_TOKENS && (
                    <span className="block text-destructive">
                      Text exceeds maximum token limit
                    </span>
                  )}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading || tokenCount > MAX_TOKENS} 
          className="w-full"
        >
          {isLoading ? "Generating..." : "Generate MCQ"}
        </Button>
      </form>
    </Form>
  );
}