import type { MCQFormData, MCQResponse, MCQHistoryItem } from "@/types";

export async function generateMCQ(data: MCQFormData): Promise<MCQResponse> {
  const response = await fetch('/api/mcq/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function getMCQHistory(): Promise<MCQHistoryItem[]> {
  const response = await fetch('/api/mcq/history');

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}