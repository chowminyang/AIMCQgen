import { useState } from "react";
import { MCQForm } from "@/components/mcq-form";
import { MCQDisplay } from "@/components/mcq-display";
import { MCQHistory } from "@/components/mcq-history";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateMCQ, getMCQHistory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { MCQFormData, MCQResponse, MCQHistoryItem } from "@/types";

export default function Home() {
  const { toast } = useToast();
  const [mcq, setMcq] = useState<MCQResponse | null>(null);
  const [currentFormData, setCurrentFormData] = useState<MCQFormData | null>(null);
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ["/api/mcq/history"],
    queryFn: getMCQHistory,
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
    setCurrentFormData(data);
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">MCQ Generator</h1>
          <ThemeToggle />
        </div>
      </nav>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="grid gap-8">
          <div className="space-y-4">
            <MCQForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
          </div>

          {mcq && currentFormData && (
            <div className="space-y-4">
              <MCQDisplay mcq={mcq} formData={currentFormData} />
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">History</h2>
            <MCQHistory items={history as MCQHistoryItem[]} />
          </div>
        </div>
      </main>
    </div>
  );
}