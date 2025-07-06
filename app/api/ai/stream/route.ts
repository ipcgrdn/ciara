import { NextRequest } from "next/server";
import {
  getAgentAI,
  AgentMessage,
  AgentResult,
  ToolStatusMessage,
} from "@/lib/agent";

// 요청 바디 타입 정의
interface RequestBody {
  message: string;
  documentId: string;
  userId: string;
  conversationHistory?: unknown[];
  proposalResponse?: {
    action: "approve" | "reject";
    feedback?: string;
    customContent?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      message,
      documentId,
      userId,
      conversationHistory = [],
      proposalResponse,
    } = body;

    // 필수 파라미터 검증
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

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "사용자 ID가 필요합니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 메시지가 AgentMessage 타입인지 확인하는 타입 가드 함수
    const isValidMessage = (msg: unknown): msg is AgentMessage => {
      return (
        msg !== null &&
        typeof msg === "object" &&
        "role" in msg &&
        "content" in msg &&
        ["user", "assistant"].includes((msg as AgentMessage).role) &&
        typeof (msg as AgentMessage).content === "string" &&
        (msg as AgentMessage).content.trim().length > 0
      );
    };

    // 대화 히스토리 검증 및 변환
    const validHistory: AgentMessage[] = Array.isArray(conversationHistory)
      ? conversationHistory.filter(isValidMessage).slice(-10) // 최근 10개만 사용
      : [];

    // 에이전트 AI 서비스 호출
    const agentAI = await getAgentAI();
    const stream = agentAI.agentStream(
      message,
      documentId,
      userId,
      validHistory,
      proposalResponse
    );

    // ReadableStream 생성
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let finalResult: AgentResult | null = null;

          for await (const chunk of stream) {
            if (typeof chunk === "string") {
              // 일반 텍스트 응답 스트리밍
              const data = `data: ${JSON.stringify({ text: chunk })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            } else if (
              typeof chunk === "object" &&
              chunk !== null &&
              "type" in chunk &&
              chunk.type === "tool_status"
            ) {
              // 도구 상태 메시지 스트리밍
              const toolStatus = chunk as ToolStatusMessage;
              const data = `data: ${JSON.stringify({
                toolStatus: {
                  toolName: toolStatus.toolName,
                  status: toolStatus.status,
                  message: toolStatus.message,
                },
              })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            } else if (
              typeof chunk === "object" &&
              chunk !== null &&
              "type" in chunk &&
              (chunk as any).type === "modification_proposal"
            ) {
              // 수정 제안 스트리밍
              const proposalData = chunk as unknown as {
                type: "modification_proposal";
                data: unknown;
              };
              const data = `data: ${JSON.stringify({
                modificationProposal: proposalData.data,
              })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            } else if (
              typeof chunk === "object" &&
              chunk !== null &&
              !("type" in chunk)
            ) {
              // 최종 결과 저장 (AgentResult)
              finalResult = chunk as AgentResult;
            }
          }

          // 최종 결과가 있으면 전송
          if (finalResult) {
            const result = finalResult as AgentResult;
            const data = `data: ${JSON.stringify({
              result: {
                toolsUsed: result.toolsUsed,
                reasoning: result.reasoning,
              },
              final: true,
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }

          // 스트림 종료 신호
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Agent Stream Error:", error);
          const errorData = `data: ${JSON.stringify({
            error: "AI 처리 중 오류가 발생했습니다.",
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
