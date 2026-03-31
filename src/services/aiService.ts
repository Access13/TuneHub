import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getMoodRecommendations(mood: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 music genres or search terms for someone feeling "${mood}". Return only a comma-separated list of terms.`,
    });
    
    const text = response.text || "";
    return text.split(',').map(s => s.trim());
  } catch (error) {
    console.error("AI Error:", error);
    return ["Lo-fi", "Chill", "Ambient", "Jazz", "Electronic"];
  }
}

export async function getPersonalizedRecommendations(history: string[]): Promise<string[]> {
  try {
    const historyStr = history.join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this listening history: [${historyStr}], suggest 5 music genres or search terms for a personalized mix. Return only a comma-separated list of terms.`,
    });
    
    const text = response.text || "";
    return text.split(',').map(s => s.trim());
  } catch (error) {
    console.error("AI Error:", error);
    return ["New Releases", "Discover", "Top Hits", "Indie", "Pop"];
  }
}
