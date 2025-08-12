
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Initialize ai lazily; check for key inside the function.
// A single instance is better for performance.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generatePromptIdea = async (): Promise<string> => {
  if (!ai) {
    // Provide a user-friendly message if the key is not set.
    throw new Error('Gemini API Key is not configured. Please set it in your environment variables to use this feature.');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a creative and visually descriptive prompt for an AI image generator. The prompt should be about a surreal, fantasy landscape. Make it detailed.",
      config: {
        temperature: 1,
        topP: 0.95,
        topK: 64,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        if(error.message.includes('API key not valid')) {
            throw new Error('The Gemini API key is not valid. Please check your configuration.');
        }
    }
    throw new Error("Failed to generate prompt idea from Gemini.");
  }
};
