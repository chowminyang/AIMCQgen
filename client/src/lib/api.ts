import type { MCQFormData, MCQResponse, MCQHistoryItem } from "@/types";

export interface MCQResponse {
  raw: string;
  parsed: ParsedMCQ;
}

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

export async function saveMCQ(data: {
  name: string;
  topic: string;
  rawContent: string;
  parsedContent: any;
}): Promise<MCQHistoryItem> {
  const response = await fetch('/api/mcq/save', {
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

export async function getMCQ(id: number): Promise<MCQHistoryItem> {
  const response = await fetch(`/api/mcq/${id}`);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function deleteMCQ(id: number): Promise<void> {
  const response = await fetch(`/api/mcq/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}