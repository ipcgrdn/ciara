import { NextRequest, NextResponse } from "next/server";
import {
  processWithCiara,
  ConversationContext,
  UserRequest,
  StreamingMessage,
} from "@/ai/ciara-agent";

// API 요청 인터페이스
interface CiaraApiRequest {
  message: string;
  context: {
    userId: string;
    documentId?: string;
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: string;
    }>;
    currentDocumentState?: {
      title: string;
      hasContent: boolean;
      hasIndex: boolean;
      lastModified: string;
    };
  };
}

// API 응답 인터페이스
interface CiaraApiResponse {
  success: boolean;
  response?: string;
  actionsTaken?: string[];
  nextSuggestions?: string[];
  error?: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 요청 본문 파싱
    const body: CiaraApiRequest = await request.json();

    // 필수 필드 검증
    if (!body.message || typeof body.message !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "메시지가 필요합니다.",
        } as CiaraApiResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!body.context?.userId || typeof body.context.userId !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "사용자 ID가 필요합니다.",
        } as CiaraApiResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 스트리밍 응답을 위한 TransformStream 생성
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // 비동기적으로 CIARA 처리 시작
    (async () => {
      try {
        // 컨텍스트 구성
        const conversationContext: ConversationContext = {
          userId: body.context.userId,
          documentId: body.context.documentId,
          conversationHistory: body.context.conversationHistory || [],
          currentDocumentState: body.context.currentDocumentState,
        };

        // CIARA 에이전트 요청 구성
        const userRequest: UserRequest = {
          message: body.message,
          context: conversationContext,
        };

        // CIARA 에이전트 호출 (스트리밍 콜백과 함께)
        const result = await processWithCiara(userRequest, {
          onStreamChunk: (chunk: StreamingMessage) => {
            // 각 청크를 JSON 형태로 스트리밍 (라벨 포함)
            const data = JSON.stringify({
              type: "chunk",
              label: chunk.label,
              content: chunk.content,
              metadata: chunk.metadata,
            });
            writer.write(new TextEncoder().encode(`data: ${data}\n\n`));
          },
        });

        // 최종 결과 전송
        const finalData = JSON.stringify({
          type: "final",
          success: result.success,
          response: result.response,
          actionsTaken: result.actionsTaken,
          nextSuggestions: result.nextSuggestions,
          error: result.error,
        });

        writer.write(new TextEncoder().encode(`data: ${finalData}\n\n`));
        writer.write(new TextEncoder().encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("CIARA API 오류:", error);

        const errorData = JSON.stringify({
          type: "error",
          success: false,
          error:
            error instanceof Error
              ? `서버 오류: ${error.message}`
              : "알 수 없는 서버 오류가 발생했습니다.",
        });

        writer.write(new TextEncoder().encode(`data: ${errorData}\n\n`));
      } finally {
        writer.close();
      }
    })();

    // 스트리밍 응답 반환
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("CIARA API 파싱 오류:", error);

    const errorResponse: CiaraApiResponse = {
      success: false,
      error:
        error instanceof Error
          ? `요청 파싱 오류: ${error.message}`
          : "요청을 처리할 수 없습니다.",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET 요청 처리 (상태 확인용)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "CIARA AI 에이전트 API가 정상적으로 작동 중입니다.",
    version: "1.0.0",
    endpoints: {
      POST: "/api/ai/ciara - CIARA 에이전트 (스트리밍)",
    },
  });
}
