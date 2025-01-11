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

    // Clean up the text and split into sections
    const cleanText = text.trim().replace(/\n{3,}/g, '\n\n');
    const sections = cleanText.split(/\n\s*\n/).reduce((acc: Record<string, string>, section) => {
      // More flexible header matching
      const headerMatch = section.match(/^[*\s]*(?:CLINICAL SCENARIO|QUESTION|OPTIONS|CORRECT ANSWER|EXPLANATION)[:.\s]*/im);
      if (headerMatch) {
        const headerStart = headerMatch[0];
        const header = headerStart.trim().split(':')[0].toUpperCase();
        const content = section.slice(headerStart.length).trim();
        acc[header] = content;
        console.log(`Parsed section ${header}:`, content.substring(0, 50) + '...');
      }
      return acc;
    }, {});

    // Map sections to MCQ structure with detailed logging
    mcq.clinicalScenario = sections['CLINICAL SCENARIO'] || '';
    console.log('Clinical Scenario found:', !!mcq.clinicalScenario);

    mcq.question = sections['QUESTION'] || '';
    console.log('Question found:', !!mcq.question);

    // Parse correct answer - handle various formats
    const rawAnswer = sections['CORRECT ANSWER'] || '';
    mcq.correctAnswer = rawAnswer.match(/[A-E]/i)?.[0].toUpperCase() || '';
    console.log('Correct Answer found:', mcq.correctAnswer);

    mcq.explanation = sections['EXPLANATION'] || '';
    console.log('Explanation found:', !!mcq.explanation);

    // Parse options with more flexible matching
    if (sections['OPTIONS']) {
      const optionsText = sections['OPTIONS'];
      const optionLines = optionsText.split('\n');

      optionLines.forEach(line => {
        // Match options in format "A) text" or "A. text" or "A - text"
        const match = line.match(/^([A-E])[\s\)\.-](.*)/i);
        if (match) {
          const [, letter, content] = match;
          mcq.options[letter.toUpperCase() as keyof typeof mcq.options] = content.trim();
          console.log(`Option ${letter} found:`, content.trim().substring(0, 30) + '...');
        }
      });
    }

    // Validate all required fields are present and log any missing ones
    const missingFields = [];
    if (!mcq.clinicalScenario) missingFields.push('Clinical Scenario');
    if (!mcq.question) missingFields.push('Question');
    if (!mcq.correctAnswer) missingFields.push('Correct Answer');
    Object.entries(mcq.options).forEach(([letter, content]) => {
      if (!content) missingFields.push(`Option ${letter}`);
    });

    if (missingFields.length > 0) {
      console.error('Missing required MCQ fields:', missingFields.join(', '));
      console.error('Raw text:', text);
      console.error('Parsed sections:', sections);
      return null;
    }

    return mcq;
  } catch (error) {
    console.error('Error parsing MCQ text:', error);
    console.error('Raw text:', text);
    return null;
  }
}