import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

const openai = new OpenAI();

// MCQ generation prompt template
const MCQ_PROMPT = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists. Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please create a question following these guidelines and format your response as a JSON object with these exact fields:
{
  "clinicalScenario": "string containing the scenario",
  "question": "string containing the question",
  "options": {
    "A": "string for option A",
    "B": "string for option B",
    "C": "string for option C",
    "D": "string for option D",
    "E": "string for option E"
  },
  "correctAnswer": "string with letter A-E",
  "feedback": "string containing feedback"
}

Guidelines for creation:
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
   - Provide option-specific explanations for why each option is correct or incorrect.`;

export function registerRoutes(app: Express): Server {
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, purpose, referenceText } = req.body;

      const userPrompt = `${MCQ_PROMPT}\n\nTopic: ${topic}\nPurpose: ${purpose}\n${
        referenceText ? `Reference Material:\n${referenceText}` : ""
      }\n\nPlease generate an MCQ according to the guidelines above and ensure the output is in the specified JSON format.`;

      const response = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [
          { role: "user", content: userPrompt }
        ],
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