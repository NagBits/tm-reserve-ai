import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { transcript, role } = await req.json();

  const prompt = `Evaluate this Toastmasters ${role} speech. 
    Provide: 1. Filler word count 2. A confidence score (0-100) 3. Two tips for improvement. 
    Format as JSON: { "score": number, "fillerWords": number, "feedback": "string" }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: `${prompt}\n\nTranscript: ${transcript}` }],
    response_format: { type: "json_object" }
  });

  return NextResponse.json(JSON.parse(completion.choices[0].message.content || "{}"));
}
