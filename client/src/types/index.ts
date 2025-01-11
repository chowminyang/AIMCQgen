export interface MCQFormData {
  topic: string;
  referenceText?: string;
}

export interface MCQResponse {
  text: string;
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
  referenceText: string | null;
  generatedText: string;
  createdAt: string;
}