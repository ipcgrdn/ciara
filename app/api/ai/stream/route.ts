import { NextRequest } from "next/server";
import { getAiService } from "@/lib/anthropic";
import { ChatMessage } from "@/lib/chat-history";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    // 메시지 검증
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "메시지가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 대화 히스토리 검증 및 변환
    const validHistory = Array.isArray(conversationHistory)
      ? conversationHistory
          .filter(
            (msg: any) =>
              msg &&
              typeof msg === "object" &&
              ["user", "assistant"].includes(msg.role) &&
              typeof msg.content === "string" &&
              msg.content.trim().length > 0
          )
          .slice(-10) // 최근 10개만 사용
      : [];

    // AI 서비스 호출
    const aiService = getAiService();
    const stream = aiService.chatStream(message, validHistory);

    // ReadableStream 생성
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Server-Sent Events 형식으로 데이터 전송
            const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }

          // 스트림 종료 신호
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream Error:", error);
          const errorData = `data: ${JSON.stringify({
            error: "AI 스트림 오류가 발생했습니다.",
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      },
    });

    // Server-Sent Events 응답 헤더 설정
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "API 서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
