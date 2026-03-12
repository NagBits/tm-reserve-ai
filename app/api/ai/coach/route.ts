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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        let prompt = "";
        let content: any[] = [];

        if (audio === "Stats Report Request" && stats) {
            prompt = `
                You are a Toastmasters Mentor for ${userName || "a member"}.
                Based on their role history: ${JSON.stringify(stats)}, 
                provide a high-quality progress report.
                
                Structure your response with:
                ### 🚀 Progress Summary
                A 2-sentence encouraging summary of their journey so far.
                
                ### 🎯 Next Leadership Goal
                Identify the specific role they should aim for next and why.
                
                ### 💡 Mentorship Tip
                One advanced Toastmasters tip tailored to their level.
                
                Use bold text and bullet points. Be inspiring and professional.
            `;
            content = [prompt];
        } else {
            prompt = `
                You are an expert Toastmasters Speech Coach. 
                Analyze this audio recording of a speech and provide constructive feedback.
                
                Structure your evaluation exactly like this:
                
                ### 🎤 Vocal Analysis
                * **Pace:** [Too fast/slow?]
                * **Filler Words:** [Count and type]
                * **Tone:** [Engagement level]
                
                ### 📝 Content & Structure
                [Feedback on opening, body, and conclusion]
                
                ### 🌟 The Golden Tip
                [One actionable improvement for next time]
                
                ### ✅ Key Strengths
                * [Strength 1]
                * [Strength 2]
                
                Be encouraging, specific, and use professional Toastmasters terminology.
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
