export interface MCQFormData {
  topic: string;
  purpose: string;
  referenceText: string;
}

export interface MCQResponse {
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
  feedback: string;
}
