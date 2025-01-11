import { useState } from "react";
import { MCQForm } from "@/components/mcq-form";
import { MCQDisplay } from "@/components/mcq-display";
import { useMutation } from "@tanstack/react-query";
import { generateMCQ } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { MCQFormData, MCQResponse } from "@/types";

export default function Home() {
  const { toast } = useToast();
  const [mcq, setMcq] = useState<MCQResponse | null>(null);

  const mutation = useMutation({
    mutationFn: generateMCQ,
    onSuccess: (data) => {
      setMcq(data);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = (data: MCQFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">MCQ Generator</h1>
      
      <div className="grid gap-8">
        <div className="space-y-4">
          <MCQForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
        </div>

        {mcq && (
          <div className="space-y-4">
            <MCQDisplay mcq={mcq} />
          </div>
        )}
      </div>
    </div>
  );
}
