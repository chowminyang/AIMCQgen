import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ParsedMCQ } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseMCQText(text: string): ParsedMCQ | null {
  try {
    // Initialize the structure with empty values
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

    // Split by double newlines and process each section
    const sections = text.split('\n\n');
    let currentSection = '';

    for (const section of sections) {
      const trimmedSection = section.trim();

      if (trimmedSection.startsWith('CLINICAL SCENARIO:')) {
        mcq.clinicalScenario = trimmedSection.replace('CLINICAL SCENARIO:', '').trim();
      } else if (trimmedSection.startsWith('QUESTION:')) {
        mcq.question = trimmedSection.replace('QUESTION:', '').trim();
      } else if (trimmedSection.startsWith('OPTIONS:')) {
        // Process options in the next iterations
        currentSection = 'OPTIONS';
      } else if (trimmedSection.startsWith('CORRECT ANSWER:')) {
        mcq.correctAnswer = trimmedSection.replace('CORRECT ANSWER:', '').trim();
        currentSection = '';
      } else if (trimmedSection.startsWith('EXPLANATION:')) {
        mcq.explanation = trimmedSection.replace('EXPLANATION:', '').trim();
        currentSection = '';
      } else if (currentSection === 'OPTIONS') {
        // Process options line by line
        const lines = trimmedSection.split('\n');
        for (const line of lines) {
          const optionMatch = line.match(/^([A-E])\)(.*)/);
          if (optionMatch) {
            const [, letter, content] = optionMatch;
            mcq.options[letter as keyof typeof mcq.options] = content.trim();
          }
        }
      }
    }

    // Basic validation
    if (!mcq.clinicalScenario || !mcq.question || !mcq.correctAnswer || !mcq.explanation) {
      console.log('Missing required fields:', { mcq });
      return null;
    }

    // Ensure all options have some content
    const hasOptions = Object.values(mcq.options).some(option => option.length > 0);
    if (!hasOptions) {
      console.log('No options found:', { mcq });
      return null;
    }

    console.log('Successfully parsed MCQ:', { mcq });
    return mcq;
  } catch (error) {
    console.error('Error parsing MCQ text:', error);
    return null;
  }
}