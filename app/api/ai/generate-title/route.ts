import { NextRequest, NextResponse } from "next/server";
import { getAiService } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const aiService = getAiService();
    const titleStream = aiService.chatStream(
      `Based on the following message, please create an appropriate title for the conversation session in Korean, using 3-5 words. Answer with the title only: "${message}"`
    );

    let title = "";
    for await (const chunk of titleStream) {
      title += chunk;
    }

    // 제목이 너무 길거나 비어있으면 기본값 사용
    const cleanTitle = title.trim().replace(/['"]/g, "");
    const finalTitle =
      cleanTitle.length > 0 && cleanTitle.length <= 30
        ? cleanTitle
        : `새 대화 ${new Date().toLocaleDateString()}`;

    return NextResponse.json({ title: finalTitle });
  } catch (error) {
    console.error("Error generating title:", error);

    // 오류 발생 시 기본 제목 반환
    const defaultTitle = `새 대화 ${new Date().toLocaleDateString()}`;
    return NextResponse.json({ title: defaultTitle });
  }
}
