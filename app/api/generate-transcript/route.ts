import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TranscriptSegment } from "@/types";

const parseTranscript = (text: string): TranscriptSegment[] => {
  const lines = text.split("\n");
  const segments: TranscriptSegment[] = [];

  const timeRegex = /\[?(\d{1,2}:\d{2})\]?/;
  let segmentIndex = 0;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const timestamp = match[1];
      const content = line
        .replace(match[0], "")
        .replace(/^[-:]\s*/, "")
        .trim();
      if (content) {
        segments.push({
          id: `seg-${segmentIndex++}`,
          timestamp,
          text: content,
        });
      }
    } else if (line.trim().length > 0 && segments.length > 0) {
      segments[segments.length - 1].text += " " + line.trim();
    }
  }

  if (segments.length === 0 && text.trim().length > 0) {
    segments.push({
      id: `seg-${segmentIndex}`,
      timestamp: "00:00",
      text: text.trim(),
    });
  }

  return segments;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "API Key is missing. Please set the GEMINI_API_KEY environment variable.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.2,
      },
    });

    const prompt = `
You are an expert transcriber. 
Please transcribe the audio from this video into English.

Rules:
1. If the audio is in a language other than English, translate it to English.
2. Provide timestamps at the beginning of each segment in the format [MM:SS].
3. Ignore background noise or silence.
4. Format the output clearly with one segment per line.
    `.trim();

    // Generate transcript
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type || "video/mp4",
          data: base64Data,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const rawText = response.text() || "No transcript generated.";
    const segments = parseTranscript(rawText);

    return NextResponse.json({
      raw: rawText,
      segments,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate transcript." },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
