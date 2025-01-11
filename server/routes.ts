import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

const openai = new OpenAI();

// System prompt template - using assistant message since o1-mini doesn't support system messages
const SYSTEM_PROMPT = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists. Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please create a question following these guidelines:

1. Clinical Scenario:
   - Write a 200-word clinical scenario in the present tense.
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - Do not reveal the diagnosis or include investigations that immediately give away the answer.

2. Question:
   - Ensure the question tests at least second-order thinking.
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.

3. Multiple Choice Options:
   - Provide 5 options in alphabetical order:
     a) One best and correct answer
     b) One correct answer, but not the best option
     c-e) Plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.

4. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.

Output should be in JSON format with these fields:
- clinicalScenario: string
- question: string
- options: { A: string, B: string, C: string, D: string, E: string }
- correctAnswer: string
- feedback: string`;

export function registerRoutes(app: Express): Server {
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, purpose, referenceText } = req.body;

      const userPrompt = `Topic: ${topic}\nPurpose: ${purpose}\n${
        referenceText ? `Reference Material:\n${referenceText}` : ""
      }

Please generate an MCQ according to the guidelines provided.`;

      const response = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [
          { role: "assistant", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      // Assert that content exists and parse it
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const mcq = JSON.parse(content);
      res.json(mcq);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}