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
import { encode } from "gpt-tokenizer";
import type { MCQFormData } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  referenceText: z.string().optional().default(""),
});

interface MCQFormProps {
  onSubmit: (data: MCQFormData) => void;
  isLoading: boolean;
}

const MAX_TOKENS = 128000;
const WARNING_THRESHOLD = 0.75; // 75%
const DANGER_THRESHOLD = 0.90; // 90%

// Base prompt template that's used for every request
const BASE_PROMPT = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists about "TOPIC_PLACEHOLDER". Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please follow these steps to create the question:

1. Clinical Scenario:
   - Write a 200-word clinical scenario in the present tense.
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - Do not reveal the diagnosis or include investigations that immediately give away the answer.

2. Question:
   - Test second-order thinking skills about TOPIC_PLACEHOLDER.
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
   - Do not reveal or hint at the diagnosis in the question.
   - Avoid including obvious investigations or management options that would immediately give away the answer.

3. Multiple Choice Options:
   - Provide 5 options (A-E) in alphabetical order:
     a) One best and correct answer
     b) One correct answer, but not the best option
     c-e) Plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.

4. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.`;

const REFERENCE_TEXT_PREFIX = "   - Use this reference text in your explanations where relevant: ";

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
  const watchTopic = form.watch("topic");

  useEffect(() => {
    // Calculate tokens for the base prompt with the current topic
    const promptWithTopic = BASE_PROMPT.replace(/TOPIC_PLACEHOLDER/g, watchTopic || "");
    const baseTokens = encode(promptWithTopic).length;

    // Calculate tokens for reference text with its prefix
    const referenceTextTokens = watchReferenceText ?
      encode(REFERENCE_TEXT_PREFIX + watchReferenceText).length : 0;

    // Set the total token count
    setTokenCount(baseTokens + referenceTextTokens);
  }, [watchReferenceText, watchTopic]);

  const tokenCounterStyles = useMemo(() => {
    const usageRatio = tokenCount / MAX_TOKENS;
    return cn(
      "text-sm transition-colors duration-200",
      {
        "text-green-500": usageRatio < WARNING_THRESHOLD,
        "text-yellow-500": usageRatio >= WARNING_THRESHOLD && usageRatio < DANGER_THRESHOLD,
        "text-orange-500": usageRatio >= DANGER_THRESHOLD && usageRatio < 1,
        "text-destructive font-medium": usageRatio >= 1
      }
    );
  }, [tokenCount]);

  const remainingTokens = MAX_TOKENS - tokenCount;

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
                <div className={tokenCounterStyles}>
                  {remainingTokens.toLocaleString()} tokens remaining
                  {remainingTokens < 0 && (
                    <span className="block font-medium">
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
          disabled={isLoading || remainingTokens < 0}
          className="w-full"
        >
          {isLoading ? "Generating..." : "Generate MCQ"}
        </Button>
      </form>
    </Form>
  );
}