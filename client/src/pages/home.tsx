import { useState } from "react";
import { MCQForm } from "@/components/mcq-form";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQHistory } from "@/components/mcq-history";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateMCQ, getMCQHistory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { MCQFormData, MCQResponse, MCQHistoryItem } from "@/types"; // Assuming MCQHistoryItem type

export default function Home() {
  const { toast } = useToast();
  const [mcq, setMcq] = useState<MCQResponse | null>(null);
  const queryClient = useQueryClient(); // Added queryClient

  const { data: history = [] } = useQuery({
    queryKey: ["/api/mcq/history"],
    queryFn: getMCQHistory, // Added queryFn
  });

  const mutation = useMutation({
    mutationFn: generateMCQ,
    onSuccess: (data) => {
      setMcq(data);
      queryClient.invalidateQueries({ queryKey: ["/api/mcq/history"] });
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

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">History</h2>
          <MCQHistory items={history as MCQHistoryItem[]} /> {/* Type assertion */}
        </div>
      </div>
    </div>
  );
}