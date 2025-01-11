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

    // Split the text into sections
    const sections = text.split('\n\n');
    let currentSection = '';
    let isInOptions = false;

    for (const section of sections) {
      if (section.startsWith('CLINICAL SCENARIO:')) {
        currentSection = 'CLINICAL SCENARIO';
        mcq.clinicalScenario = section.replace('CLINICAL SCENARIO:', '').trim();
      } else if (section.startsWith('QUESTION:')) {
        currentSection = 'QUESTION';
        mcq.question = section.replace('QUESTION:', '').trim();
      } else if (section.startsWith('OPTIONS:')) {
        currentSection = 'OPTIONS';
        isInOptions = true;
        // Don't set content yet, will process options individually
      } else if (section.startsWith('CORRECT ANSWER:')) {
        currentSection = 'CORRECT ANSWER';
        isInOptions = false;
        mcq.correctAnswer = section.replace('CORRECT ANSWER:', '').trim();
      } else if (section.startsWith('EXPLANATION:')) {
        currentSection = 'EXPLANATION';
        isInOptions = false;
        mcq.explanation = section.replace('EXPLANATION:', '').trim();
      } else if (isInOptions) {
        // Process options
        const lines = section.trim().split('\n');
        lines.forEach(line => {
          const match = line.match(/^([A-E])\)(.*)/);
          if (match) {
            const [, letter, content] = match;
            mcq.options[letter as keyof typeof mcq.options] = content.trim();
          }
        });
      }
    }

    // Validate that we have all required fields
    if (!mcq.clinicalScenario || !mcq.question || !mcq.correctAnswer || !mcq.explanation) {
      console.error('Missing required MCQ fields');
      return null;
    }

    // Validate that we have all options
    const hasAllOptions = Object.values(mcq.options).every(option => option.length > 0);
    if (!hasAllOptions) {
      console.error('Missing one or more options');
      return null;
    }

    return mcq;
  } catch (error) {
    console.error('Error parsing MCQ text:', error);
    return null;
  }
}