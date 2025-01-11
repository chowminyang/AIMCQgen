export interface MCQFormData {
  topic: string;
  referenceText?: string;
}

export interface MCQResponse {
  raw: string;
  parsed: ParsedMCQ;
}

export interface ParsedMCQ {
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
  topic: string;
  generated_text: string;
  created_at: string;
}