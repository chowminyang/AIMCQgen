export interface MCQFormData {
  topic: string;
  referenceText?: string;
  reasoningEffort?: "low" | "medium" | "high";
}

export interface MCQResponse {
  raw: string;
  parsed: ParsedMCQ;
}

export interface ParsedMCQ {
  name: string;
  clinicalScenario: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correctAnswer: string;
  explanation: string;
}

export interface MCQHistoryItem {
  id: number;
  name: string;
  topic: string;
  raw_content: string;
  parsed_content: ParsedMCQ;
  created_at: string;
  rating: number;
}