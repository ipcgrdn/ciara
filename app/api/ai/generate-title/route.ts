import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 }
      );
    }

    // 메시지가 너무 길면 첫 100자만 사용
    const truncatedMessage =
      message.length > 100 ? message.substring(0, 100) + "..." : message;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // 가장 가벼운 모델
      max_tokens: 20, // 최소 토큰
      messages: [
        {
          role: "user",
          content: `"${truncatedMessage}" message title in korean, less than 10 words.`,
        },
      ],
    });

    const title =
      response.content[0].type === "text"
        ? response.content[0].text.trim().replace(/"/g, "")
        : `새로운 대화 ${new Date().toLocaleDateString()}`;

    return NextResponse.json({ title });
  } catch (error) {
    console.error("제목 생성 중 오류:", error);
    // 간단한 키워드 기반 제목 생성
    const { message } = await request.json();
    const keywords = message.split(" ").slice(0, 2).join(" ");
    const fallbackTitle =
      keywords.length > 8 ? keywords.substring(0, 8) : keywords || "새 대화";

    return NextResponse.json({ title: fallbackTitle }, { status: 200 });
  }
}
