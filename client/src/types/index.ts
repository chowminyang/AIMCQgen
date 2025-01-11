export interface MCQFormData {
  topic: string;
  purpose: string;
  referenceText?: string;
}

export interface MCQOptions {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

export interface MCQData {
  clinicalScenario: string;
  question: string;
  options: MCQOptions;
  correctAnswer: string;
  explanation: string;
}

export interface MCQResponse {
  text: string;
  mcq: MCQData;
}

export interface MCQHistoryItem {
  id: number;
  topic: string;
  purpose: string;
  referenceText: string | null;
  generatedText: string;
  createdAt: string;
}