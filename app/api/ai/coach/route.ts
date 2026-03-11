import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { audio, mimeType, stats, userName } = await req.json();

        if (!audio && !stats) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        console.log("AI Coach API hit. Type:", stats ? "Stats Report" : "Audio Analysis");
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = "";
        let content: any[] = [];

        if (audio === "Stats Report Request" && stats) {
            prompt = `
                You are a Toastmasters Mentor for ${userName || "a member"}.
                Based on their role history: ${JSON.stringify(stats)}, 
                provide a 3-sentence summary of their progress and a specific suggestion for their next leadership goal.
                Be inspiring, concise, and professional.
            `;
            content = [prompt];
        } else {
            prompt = `
                You are an expert Toastmasters Speech Coach. 
                Analyze this audio recording of a speech and provide constructive feedback.
                Focus on:
                1. Pace and Rhythm (too fast, too slow, good pauses?)
                2. Filler words (um, ah, like, you know)
                3. Tone and Energy (enthusiastic, monotonous, professional?)
                4. Content & Structure (clear opening, body, closing?)
                5. One "Golden Tip" for improvement.

                Format your response as a clean JSON-like structure (but as text) with sections. 
                Be encouraging and professional. Keep it concise.
            `;
            content = [
                prompt,
                {
                    inlineData: {
                        data: audio,
                        mimeType: mimeType || "audio/webm"
                    }
                }
            ];
        }

        console.log("Calling Gemini API...");
        const result = await model.generateContent(content);

        if (!result.response) {
            throw new Error("No response from AI Engine");
        }

        const responseText = result.response.text();

        if (!responseText) {
            console.warn("AI generated an empty response");
            return NextResponse.json({ error: "Empty feedback generated. Try speaking longer." }, { status: 400 });
        }

        console.log("Feedback generated successfully. Length:", responseText.length);

        return NextResponse.json({ feedback: responseText });
    } catch (error: any) {
        console.error("AI Coach Server Error:", error);

        // Specific handling for Gemini safety blocks
        if (error.message?.includes('Safety')) {
            return NextResponse.json({ error: "Feedback was blocked for safety reasons. Please try a different recording." }, { status: 500 });
        }

        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
