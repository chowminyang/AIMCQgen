export interface MCQFormData {
  topic: string;
  referenceText?: string;
}

export interface MCQResponse {
  raw: string;
  parsed: ParsedMCQ;
}

export interface GeneratedMCQResponse {
  generated: string;
}

export interface ParsedMCQ {
  name?: string;
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
  clinical_scenario: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correct_answer: string;
  explanation: string;
  created_at: string;
}

export interface SaveMCQData extends ParsedMCQ {
  name: string;
  topic: string;
}