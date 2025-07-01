import { NextRequest } from "next/server";
import { getWritingAgent, type AgentRequest } from "@/lib/agent";

// 요청 바디 타입 정의
interface RequestBody {
  message: string;
  documentId: string;
  userId?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // JSON 파싱 에러 처리
    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "잘못된 요청 형식입니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const { message, documentId, userId, conversationHistory = [] } = body;

    // 입력 검증
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "메시지가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!documentId || typeof documentId !== "string") {
      return new Response(JSON.stringify({ error: "문서 ID가 필요합니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 메시지가 유효한지 확인하는 타입 가드 함수
    const isValidMessage = (
      msg: unknown
    ): msg is { role: "user" | "assistant"; content: string } => {
      if (!msg || typeof msg !== "object") return false;
      if (!("role" in msg) || !("content" in msg)) return false;

      const message = msg as Record<string, unknown>;
      return (
        ["user", "assistant"].includes(message.role as string) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    };

    // 대화 히스토리 검증 및 변환
    const validHistory = Array.isArray(conversationHistory)
      ? conversationHistory.filter(isValidMessage).slice(-10) // 최근 10개만 사용
      : [];

    // 로그인 확인 - 로그인 안 된 사용자는 Agent 사용 불가
    if (!userId || userId === "anonymous") {
      return new Response(
        JSON.stringify({
          error:
            "로그인이 필요합니다. Agent 기능은 로그인한 사용자만 사용할 수 있습니다.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const finalUserId = userId;

    // Agent 요청 준비
    const agentRequest: AgentRequest = {
      message,
      documentId,
      userId: finalUserId,
      conversationHistory: validHistory,
    };

    // Writing Agent 호출
    const agent = getWritingAgent();
    const stream = agent.processRequestStream(agentRequest);

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
          console.error("Agent Stream Error:", error);
          const errorData = `data: ${JSON.stringify({
            error: "Agent 스트림 오류가 발생했습니다.",
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
    console.error("Agent API Error:", error);
    return new Response(
      JSON.stringify({ error: "Agent API 서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
