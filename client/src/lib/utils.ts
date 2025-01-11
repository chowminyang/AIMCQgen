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

      // More flexible section detection with case-insensitive matching
      if (/^CLINICAL\s+SCENARIO:/i.test(trimmedSection)) {
        mcq.clinicalScenario = trimmedSection.replace(/^CLINICAL\s+SCENARIO:/i, '').trim();
      } else if (/^QUESTION:/i.test(trimmedSection)) {
        mcq.question = trimmedSection.replace(/^QUESTION:/i, '').trim();
      } else if (/^OPTIONS:/i.test(trimmedSection)) {
        // Process options in the next iterations
        currentSection = 'OPTIONS';
      } else if (/^CORRECT\s+ANSWER:/i.test(trimmedSection)) {
        const answer = trimmedSection.replace(/^CORRECT\s+ANSWER:/i, '').trim();
        // Extract just the letter if it includes explanation
        const match = answer.match(/^[A-E]/);
        mcq.correctAnswer = match ? match[0] : answer;
        currentSection = '';
      } else if (/^EXPLANATION:/i.test(trimmedSection)) {
        mcq.explanation = trimmedSection.replace(/^EXPLANATION:/i, '').trim();
        currentSection = '';
      } else if (currentSection === 'OPTIONS') {
        // Process options line by line with more flexible matching
        const lines = trimmedSection.split('\n');
        for (const line of lines) {
          // Match both A) and A. format
          const optionMatch = line.match(/^([A-E])[).]\s*(.*)/);
          if (optionMatch) {
            const [, letter, content] = optionMatch;
            mcq.options[letter as keyof typeof mcq.options] = content.trim();
          }
        }
      }
    }

    // More lenient validation
    // Count how many fields are populated
    const requiredFields = {
      clinicalScenario: mcq.clinicalScenario,
      question: mcq.question,
      correctAnswer: mcq.correctAnswer,
      explanation: mcq.explanation,
    };

    const populatedFields = Object.values(requiredFields).filter(field => field.length > 0).length;
    const hasOptions = Object.values(mcq.options).some(option => option.length > 0);

    // If we have at least 3 fields populated and some options, consider it valid
    if (populatedFields >= 3 && hasOptions) {
      console.log('Successfully parsed MCQ:', { mcq });
      return mcq;
    }

    console.log('Insufficient fields populated:', { 
      populatedFields,
      hasOptions,
      fields: requiredFields,
      options: mcq.options 
    });
    return null;

  } catch (error) {
    console.error('Error parsing MCQ text:', error);
    return null;
  }
}