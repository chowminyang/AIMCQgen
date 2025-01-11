import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ParsedMCQ } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseMCQText(text: string): ParsedMCQ | null {
  try {
    // Initialize the structure
    const mcq: ParsedMCQ = {
      clinicalScenario: "",
      question: "",
      options: {
        A: "",
        B: "",
        C: "",
        D: "",
        E: "",
      },
      correctAnswer: "",
      explanation: "",
    };

    // Clean up the text
    const cleanText = text
      .replace(/\*\*/g, '') // Remove markdown bold markers
      .trim()
      .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines

    // Split into sections and process each section
    const sections = cleanText.split(/\n\s*\n/);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();

      // Match section headers more flexibly
      if (/^CLINICAL SCENARIO:?/i.test(section)) {
        mcq.clinicalScenario = section.replace(/^CLINICAL SCENARIO:?/i, '').trim();
      }
      else if (/^QUESTION:?/i.test(section)) {
        mcq.question = section.replace(/^QUESTION:?/i, '').trim();
      }
      else if (/^OPTIONS:?/i.test(section)) {
        const optionsText = section.replace(/^OPTIONS:?/i, '').trim();
        const optionLines = optionsText.split('\n');

        optionLines.forEach(line => {
          const match = line.match(/^([A-E])[).:\s-]\s*(.+)/i);
          if (match) {
            const [, letter, content] = match;
            mcq.options[letter.toUpperCase() as keyof typeof mcq.options] = content.trim();
          }
        });
      }
      else if (/^CORRECT ANSWER:?/i.test(section)) {
        const answerMatch = section.match(/^CORRECT ANSWER:?\s*([A-E])/i);
        if (answerMatch) {
          mcq.correctAnswer = answerMatch[1].toUpperCase();
        }
      }
      else if (/^EXPLANATION:?/i.test(section) || /^CORRECT ANSWER AND FEEDBACK:?/i.test(section)) {
        mcq.explanation = section
          .replace(/^EXPLANATION:?/i, '')
          .replace(/^CORRECT ANSWER AND FEEDBACK:?/i, '')
          .trim();
      }
    }

    // Validate all required fields are present
    const missingFields = [];
    if (!mcq.clinicalScenario) missingFields.push('Clinical Scenario');
    if (!mcq.question) missingFields.push('Question');
    if (!mcq.correctAnswer) missingFields.push('Correct Answer');
    Object.entries(mcq.options).forEach(([letter, content]) => {
      if (!content) missingFields.push(`Option ${letter}`);
    });

    if (missingFields.length > 0) {
      console.error('Missing required MCQ fields:', missingFields.join(', '));
      return null;
    }

    return mcq;
  } catch (error) {
    console.error('Error parsing MCQ text:', error);
    return null;
  }
}