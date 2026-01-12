import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExamPaperData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const examSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "The subject of the exam (e.g., Math, Physics)." },
    scope: { type: Type.STRING, description: "The scope or chapter of the exam (e.g., Chapter 1, Algebra)." },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.INTEGER, description: "The extracted question number." },
          text: { type: Type.STRING, description: "The content of the question." },
          optionA: { type: Type.STRING, description: "Option A text." },
          optionB: { type: Type.STRING, description: "Option B text." },
          optionC: { type: Type.STRING, description: "Option C text." },
          optionD: { type: Type.STRING, description: "Option D text." },
          correctAnswer: { type: Type.STRING, description: "The correct answer letter (A, B, C, or D). Solve the problem to find this." },
          explanation: { type: Type.STRING, description: "A detailed explanation of why the answer is correct." },
          diagramCoordinates: {
            type: Type.ARRAY,
            description: "If the question has an accompanying diagram/image, provide the bounding box [ymin, xmin, ymax, xmax] on a 0-1000 scale. If no diagram, leave empty.",
            items: { type: Type.INTEGER }
          }
        },
        required: ["text", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "explanation"],
      },
    },
  },
  required: ["subject", "scope", "questions"],
};

export const analyzeExamImage = async (base64Image: string, mimeType: string): Promise<ExamPaperData> => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Switch to Pro for better reasoning on complex exam tasks
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
            {
              text: `Analyze this image of an exam paper. 
            1. Identify the Subject and Scope.
            2. Extract all multiple-choice questions.
            3. For each question, extract the text and options.
            4. SOLVE the question to determine the 'correctAnswer' (A, B, C, or D).
            5. Provide a detailed 'explanation'.
            6. CRITICAL: If a question includes a diagram, graph, geometry figure, or illustration, you MUST identify its bounding box coordinates [ymin, xmin, ymax, xmax] normalized to a 0-1000 scale.
            
            IMPORTANT: Return the 'explanation', 'subject', and 'scope' in Traditional Chinese (繁體中文), even if the exam is in English.
            Return the result in JSON format matching the schema.`
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: examSchema,
          temperature: 0.1, // Low temperature for factual extraction
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from Gemini");
      }

      return JSON.parse(text) as ExamPaperData;
    } catch (error: any) {
      console.warn(`Gemini Analysis Attempt ${attempt} failed:`, error);
      lastError = error;
      
      // If it's the last attempt, don't wait, just let it throw in the final block
      if (attempt < maxRetries) {
        // Exponential backoff: 1000ms, 2000ms, 4000ms
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error("Gemini Analysis Final Error:", lastError);
  throw lastError;
};
