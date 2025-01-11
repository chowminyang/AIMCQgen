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
    const sections = text.split('\n\n').reduce((acc: Record<string, string>, section) => {
      const headerMatch = section.match(/^(CLINICAL SCENARIO|QUESTION|OPTIONS|CORRECT ANSWER|EXPLANATION):/i);
      if (headerMatch) {
        const header = headerMatch[1].toUpperCase();
        const content = section.replace(/^.*?:/, '').trim();
        acc[header] = content;
      }
      return acc;
    }, {});

    // Map sections to MCQ structure
    mcq.clinicalScenario = sections['CLINICAL SCENARIO'] || '';
    mcq.question = sections['QUESTION'] || '';
    mcq.correctAnswer = sections['CORRECT ANSWER']?.replace(/^[^A-E]*([A-E]).*$/i, '$1').trim() || '';
    mcq.explanation = sections['EXPLANATION'] || '';

    // Parse options
    if (sections['OPTIONS']) {
      const optionsText = sections['OPTIONS'];
      const optionLines = optionsText.split('\n');

      optionLines.forEach(line => {
        const match = line.match(/^([A-E])\)(.*)/);
        if (match) {
          const [, letter, content] = match;
          mcq.options[letter as keyof typeof mcq.options] = content.trim();
        }
      });
    }

    // Validate that we have all required fields
    if (!mcq.clinicalScenario || !mcq.question || !mcq.correctAnswer || 
        !mcq.options.A || !mcq.options.B || !mcq.options.C || !mcq.options.D || !mcq.options.E) {
      console.error('Missing required MCQ fields:', mcq);
      return null;
    }

    return mcq;
  } catch (error) {
    console.error('Error parsing MCQ text:', error);
    return null;
  }
}