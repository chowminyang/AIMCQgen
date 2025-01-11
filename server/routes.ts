import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerRoutes(app: Express): Server {
  // MCQ Generation endpoint
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, referenceText } = req.body;

      if (!topic) {
        return res.status(400).send("Topic is required");
      }

      const prompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists about "${topic}". Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please follow these steps to create the question:

1. Clinical Scenario:
   - Write a 200-word clinical scenario in the present tense.
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - Do not reveal the diagnosis or include investigations that immediately give away the answer.

2. Question:
   - Test second-order thinking skills about ${topic}.
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
   - Do not reveal or hint at the diagnosis in the question.
   - Avoid including obvious investigations or management options that would immediately give away the answer.

3. Multiple Choice Options:
   - Provide 5 options (A-E) in alphabetical order:
     a) One best and correct answer
     b) One correct answer, but not the best option
     c-e) Plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.

4. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.
   ${referenceText ? `   - Use this reference text in your explanations where relevant: ${referenceText}` : ''}

Format your response in the following structure, using clear section headers:

CLINICAL SCENARIO:
[Your clinical scenario here]

QUESTION:
[Your question here]

OPTIONS:
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
E) [Fifth option]

CORRECT ANSWER: [Single letter A-E]

EXPLANATION:
[Your detailed explanation here]`;

      const completion = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [{ role: "user", content: prompt }]
      });

      const generatedContent = completion.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      const parsePrompt = `Given this MCQ text, extract and format the content into the following sections. Return ONLY a JSON object matching this structure exactly:

{
  "clinicalScenario": "The clinical scenario text here",
  "question": "The question text here",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text",
    "E": "Option E text"
  },
  "correctAnswer": "A single letter (A-E)",
  "explanation": "The explanation text here"
}

Here's the MCQ to parse:

${generatedContent}`;

      const parsedCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "You are a precise MCQ parser. Extract the MCQ sections and format them into a JSON object exactly matching the specified structure. Return only the raw JSON object without any markdown formatting, code blocks, or additional text." 
          },
          { role: "user", content: parsePrompt }
        ]
      });

      const parsedContent = parsedCompletion.choices[0].message.content;
      if (!parsedContent) {
        throw new Error("Failed to parse MCQ content");
      }

      try {
        const cleanedContent = parsedContent
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        const parsedJson = JSON.parse(cleanedContent);
        res.json({
          raw: generatedContent,
          parsed: parsedJson
        });
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw parsed content:', parsedContent);
        throw new Error("Invalid JSON format received from parsing");
      }
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).send(error.message || "Failed to generate MCQ");
    }
  });

  // Save MCQ endpoint with parsed data
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { name, topic, referenceText, generatedText, parsedData } = req.body;

      if (!name) {
        return res.status(400).send("MCQ name is required");
      }

      const [newMcq] = await db.insert(mcqs).values({
        name,
        topic,
        reference_text: referenceText,
        generated_text: generatedText,
        parsed_data: parsedData,
      }).returning();

      res.json(newMcq);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).send(error.message || "Failed to save MCQ");
    }
  });

  // Update MCQ endpoint
  app.put("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      if (isNaN(mcqId)) {
        return res.status(400).send("Invalid MCQ ID");
      }

      const { name, topic, referenceText, generatedText, parsedData } = req.body;

      const [updatedMcq] = await db
        .update(mcqs)
        .set({
          name,
          topic,
          reference_text: referenceText,
          generated_text: generatedText,
          parsed_data: parsedData,
        })
        .where(eq(mcqs.id, mcqId))
        .returning();

      if (!updatedMcq) {
        return res.status(404).send("MCQ not found");
      }

      res.json(updatedMcq);
    } catch (error: any) {
      console.error('Update MCQ error:', error);
      res.status(500).send(error.message || "Failed to update MCQ");
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      res.json(mcqHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).send(error.message || "Failed to fetch MCQ history");
    }
  });

  app.get("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      if (isNaN(mcqId)) {
        return res.status(400).send("Invalid MCQ ID");
      }

      const [mcq] = await db.select().from(mcqs).where(eq(mcqs.id, mcqId));
      if (!mcq) {
        return res.status(404).send("MCQ not found");
      }

      res.json(mcq);
    } catch (error: any) {
      console.error('Get MCQ error:', error);
      res.status(500).send(error.message || "Failed to fetch MCQ");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}