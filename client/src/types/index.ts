export interface MCQFormData {
  topic: string;
  purpose: string;
  referenceText?: string;
}

export interface MCQResponse {
  text: string;
}

export interface MCQHistoryItem {
  id: number;
  topic: string;
  purpose: string;
  referenceText: string | null;
  generatedText: string;
  createdAt: string;
}