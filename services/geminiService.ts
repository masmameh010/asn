
import { GoogleGenAI, Type } from "@google/genai";
import { ImageAnalysisResult } from '../types';

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


export const analyzeImage = async (base64ImageData: string, mimeType: string): Promise<ImageAnalysisResult> => {
    if (!ai) {
        throw new Error('Gemini API Key is not configured. Please set it in your environment variables to use this feature.');
    }

    const imagePart = {
        inlineData: {
            data: base64ImageData,
            mimeType,
        },
    };

    const textPart = {
        text: `Analyze this image and describe it. Based on the analysis, generate a detailed, descriptive prompt that could have created this image. Also, provide a list of 5-10 relevant tags as an array of strings. Finally, suggest a suitable AI art platform (options: 'tensor', 'midjourney', 'leonardo', 'gemini') based on the style.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedPrompt: {
                            type: Type.STRING,
                            description: "A detailed, descriptive prompt that could have been used to create the image."
                        },
                        suggestedTags: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 5 to 10 relevant keywords or tags for the image."
                        },
                        suggestedPlatform: {
                            type: Type.STRING,
                            description: "The most suitable AI art platform for this image style (e.g., 'tensor', 'midjourney')."
                        }
                    },
                    required: ["suggestedPrompt", "suggestedTags", "suggestedPlatform"],
                },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result as ImageAnalysisResult;

    } catch (error) {
        console.error("Gemini image analysis failed:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('The Gemini API key is not valid. Please check your configuration.');
        }
        throw new Error("Failed to analyze image with Gemini.");
    }
};