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
  name: string;
  topic?: string;
  reference_text?: string;
  generated_text: string;
  parsed_data?: ParsedMCQ;
  created_at: string;
}

export interface SaveMCQFormData {
  name: string;
  topic?: string;
  referenceText?: string;
  generatedText: string;
  parsedData: ParsedMCQ;
}