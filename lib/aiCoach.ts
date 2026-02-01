import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getParticipationSuggestion(history: string[]) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = history.length === 0 
      ? "I am a new Toastmasters member. Give me a warm 1-sentence welcome and suggest I start with a simple role like 'Timer' or 'Ah-Counter'."
      : `Based on this Toastmasters role history: ${history.join(", ")}. Suggest the next logical step in my leadership or speaking journey. Be brief (20 words max).`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "Keep growing! Every role brings you closer to mastery.";
  }
}
