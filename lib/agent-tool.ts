import ServerSupabase from "./server-supabase";
import Anthropic from "@anthropic-ai/sdk";
import {
  getDocumentContent,
  updateDocumentContent,
  createAIUserId,
} from "./liveblocks-utils";

// 도구 결과 타입 정의
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 문서 읽기 결과 타입 (Liveblocks 기반)
export interface DocumentReadResult {
  content: string;
  metadata: {
    documentId: string;
    aiUserId: string;
    readAt: string;
  };
}

// 문서 업데이트 결과 타입 (Liveblocks 기반)
export interface DocumentUpdateResult {
  content: string;
  metadata: {
    documentId: string;
    aiUserId: string;
    updatedAt: string;
    changes: string[];
  };
}

/**
 * 문서 소유권 검증 (기존 데이터베이스 기반)
 * @param documentId - 검증할 문서 ID
 * @param userId - 검증할 사용자 ID
 * @returns 소유권 여부
 */
async function verifyDocumentOwnership(
  documentId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await ServerSupabase.from("documents")
      .select("user_id")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return false;
    }

    const isOwner = !!data;

    return isOwner;
  } catch (error) {
    return false;
  }
}

/**
 * 에이전트 도구: Liveblocks를 통한 문서 읽기
 * AI가 협업자로 참여하여 실시간 문서 내용을 읽어옴
 * @param documentId - 읽을 문서의 ID (Room ID와 동일)
 * @param userId - 요청하는 사용자의 ID
 * @returns 실시간 문서 내용
 */
export async function readDocument(
  documentId: string,
  userId: string
): Promise<ToolResult<DocumentReadResult>> {
  try {
    // 입력 검증
    if (!documentId || typeof documentId !== "string") {
      return {
        success: false,
        error: "문서 ID가 필요합니다.",
      };
    }

    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "사용자 ID가 필요합니다.",
      };
    }

    // 문서 소유권 검증
    const isOwner = await verifyDocumentOwnership(documentId, userId);

    if (!isOwner) {
      return {
        success: false,
        error: "문서에 접근할 권한이 없습니다.",
      };
    }

    // AI 사용자 ID 생성
    const aiUserId = createAIUserId(documentId);

    try {
      // Liveblocks Y.js 문서에서 실시간 내용 읽기
      const content = await getDocumentContent(documentId);

      const result = {
        success: true,
        data: {
          content,
          metadata: {
            documentId,
            aiUserId,
            readAt: new Date().toISOString(),
          },
        },
      };

      return result;
    } catch (liveblocksError) {
      return {
        success: false,
        error: `실시간 문서를 읽을 수 없습니다: ${
          liveblocksError instanceof Error
            ? liveblocksError.message
            : "알 수 없는 오류"
        }`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `문서 읽기 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

/**
 * 에이전트 도구: Liveblocks를 통한 문서 수정
 * AI가 협업자로 참여하여 실시간으로 문서를 수정함
 * @param documentId - 수정할 문서의 ID (Room ID와 동일)
 * @param userId - 요청하는 사용자의 ID
 * @param updates - 업데이트할 데이터 (content만 지원) - 선택사항
 * @param userRequest - 사용자의 수정 요청 (AI가 자동으로 수정할 때 사용) - 선택사항
 * @returns 업데이트된 문서 정보
 */
export async function updateDocumentTool(
  documentId: string,
  userId: string,
  updates?: { content?: string },
  userRequest?: string
): Promise<ToolResult<DocumentUpdateResult>> {
  try {
    // 입력 검증
    if (!documentId || typeof documentId !== "string") {
      return {
        success: false,
        error: "문서 ID가 필요합니다.",
      };
    }

    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        error: "사용자 ID가 필요합니다.",
      };
    }

    // updates와 userRequest 중 하나는 있어야 함
    if (!updates?.content && !userRequest) {
      return {
        success: false,
        error: "업데이트할 내용 또는 사용자 요청이 필요합니다.",
      };
    }

    // 문서 소유권 검증
    const isOwner = await verifyDocumentOwnership(documentId, userId);

    if (!isOwner) {
      return {
        success: false,
        error: "문서를 수정할 권한이 없습니다.",
      };
    }

    // AI 사용자 ID 생성
    const aiUserId = createAIUserId(documentId);

    let finalContent: string;
    let changes: string[] = [];

    try {
      // userRequest가 있으면 AI로 지능적 수정
      if (userRequest && typeof userRequest === "string") {
        // 현재 Liveblocks 문서 내용 읽기
        const currentContent = await getDocumentContent(documentId);

        // AI로 수정 내용 생성
        if (!process.env.ANTHROPIC_API_KEY) {
          return {
            success: false,
            error: "AI 서비스가 설정되지 않았습니다.",
          };
        }

        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const systemPrompt = `You are an elite document editing AI.

CORE MISSION: Transform user requests into optimal document modifications with surgical precision.

CRITICAL: Respond ONLY with valid JSON. NO extra formatting, NO explanations outside JSON.

ANALYSIS FRAMEWORK:
1. UNDERSTAND USER INTENT: Decode what the user truly wants
2. EVALUATE CURRENT CONTENT: Assess document quality and improvement potential  
3. DETERMINE OPTIMAL CHANGES: Make intelligent decisions about modifications
4. EXECUTE WITH PRECISION: Apply changes that improve overall quality

MODIFICATION STRATEGIES:
- Improve flow and readability
- Enhance tone and style consistency
- Add compelling details where needed
- Fix grammar and structural issues
- Preserve core message and intent
- Make content more engaging
- Optimize for target audience

CRITICAL FORMATTING RULES:
- Use plain text with proper line breaks (\\n) between paragraphs
- Each paragraph should be separated by a single newline character
- Preserve natural paragraph breaks for readability
- Ensure content flows naturally when displayed in the editor

RESPONSE SCHEMA:
{
  "shouldUpdate": boolean,
  "content": "new complete content",
  "changes": ["list of changes made"],
  "reasoning": "Concise explanation of changes"
}

QUALITY STANDARDS:
- Only suggest changes that genuinely improve the document
- Preserve user's voice and intent
- Maintain factual accuracy
- Ensure changes are contextually appropriate
- Consider real-time collaboration context
- Use markdown formatting to enhance readability and structure
- Choose appropriate formatting that matches content hierarchy and importance`;

        const userMessage = `DOCUMENT EDITING REQUEST

Current Document Content:
${currentContent || "[Empty document]"}

User Request: "${userRequest}"

TASK: Analyze the content and user request, then determine optimal modifications for real-time collaborative editing.`;

        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: userMessage,
              },
            ],
            temperature: 0.3,
          });

          const responseText =
            response.content[0].type === "text" ? response.content[0].text : "";

          let aiDecision;
          try {
            // JSON 파싱 시도
            let jsonText = responseText.trim();

            // 마크다운 코드 블록 제거
            if (jsonText.startsWith("```json")) {
              jsonText = jsonText
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "");
            } else if (jsonText.startsWith("```")) {
              jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }

            aiDecision = JSON.parse(jsonText);
          } catch (parseError) {
            return {
              success: false,
              error: "AI 응답을 분석할 수 없습니다.",
            };
          }

          // AI가 수정이 불필요하다고 판단한 경우
          if (!aiDecision.shouldUpdate) {
            const result = {
              success: true,
              data: {
                content: currentContent,
                metadata: {
                  documentId,
                  aiUserId,
                  updatedAt: new Date().toISOString(),
                  changes: ["수정이 필요하지 않음"],
                },
              },
            };

            return result;
          }

          // AI가 제안한 수정사항 적용
          finalContent = aiDecision.content || currentContent;
          changes = aiDecision.changes || ["AI가 내용을 개선했습니다"];
        } catch (aiError) {
          return {
            success: false,
            error: "AI 처리 중 오류가 발생했습니다.",
          };
        }
      } else {
        // 직접 업데이트인 경우
        finalContent = updates?.content || "";
        changes = ["직접 내용 수정"];
      }

      // Liveblocks Y.js 문서에 실시간 업데이트 적용
      const updateSuccess = await updateDocumentContent(
        documentId,
        finalContent,
        true // 마크다운 모드 활성화
      );

      if (!updateSuccess) {
        return {
          success: false,
          error: "실시간 문서 업데이트에 실패했습니다.",
        };
      }

      const result = {
        success: true,
        data: {
          content: finalContent,
          metadata: {
            documentId,
            aiUserId,
            updatedAt: new Date().toISOString(),
            changes,
          },
        },
      };

      return result;
    } catch (liveblocksError) {
      return {
        success: false,
        error: `실시간 문서를 수정할 수 없습니다: ${
          liveblocksError instanceof Error
            ? liveblocksError.message
            : "알 수 없는 오류"
        }`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `문서 수정 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

// 도구 목록 및 메타데이터 (Liveblocks 기반으로 업데이트)
export const AGENT_TOOLS = {
  read_document: {
    name: "read_document",
    description:
      "현재 문서의 내용을 읽어옵니다. AI가 협업자로 참여하여 실시간 내용을 확인합니다.",
    parameters: {
      documentId: {
        type: "string",
        description: "읽을 문서의 ID",
        required: true,
      },
      userId: {
        type: "string",
        description: "요청하는 사용자의 ID",
        required: true,
      },
    },
    function: readDocument,
  },
  update_document: {
    name: "update_document",
    description:
      "현재 문서의 내용을 수정합니다. AI가 협업자로 참여하여 실시간으로 문서를 편집합니다.",
    parameters: {
      documentId: {
        type: "string",
        description: "수정할 문서의 ID",
        required: true,
      },
      userId: { 
        type: "string",
        description: "요청하는 사용자의 ID",
        required: true,
      },
      updates: {
        type: "object",
        description: "업데이트할 데이터 (선택사항)",
        properties: {
          content: {
            type: "string",
            description: "새로운 문서 내용 (텍스트 형태, 선택사항)",
          },
        },
        required: false,
      },
      userRequest: {
        type: "string",
        description:
          "사용자의 수정 요청 (AI가 자동으로 분석하여 실시간 수정, 선택사항)",
        required: false,
      },
    },
    function: updateDocumentTool,
  },
} as const;

// 도구 실행 헬퍼 함수 (Liveblocks 기반으로 업데이트)
export async function executeAgentTool(
  toolName: string,
  parameters: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "read_document":
        if (typeof parameters.documentId !== "string") {
          return {
            success: false,
            error: "documentId는 문자열이어야 합니다.",
          };
        }
        if (typeof parameters.userId !== "string") {
          return {
            success: false,
            error: "userId는 문자열이어야 합니다.",
          };
        }
        return await readDocument(parameters.documentId, parameters.userId);

      case "update_document":
        if (typeof parameters.documentId !== "string") {
          return {
            success: false,
            error: "documentId는 문자열이어야 합니다.",
          };
        }
        if (typeof parameters.userId !== "string") {
          return {
            success: false,
            error: "userId는 문자열이어야 합니다.",
          };
        }

        // updates와 userRequest 파라미터 처리
        const updates = parameters.updates as { content?: string } | undefined;
        const userRequest = parameters.userRequest as string | undefined;

        // updates가 있는 경우 타입 검증
        if (updates && typeof updates !== "object") {
          return {
            success: false,
            error: "updates는 객체여야 합니다.",
          };
        }

        // userRequest가 있는 경우 타입 검증
        if (userRequest && typeof userRequest !== "string") {
          return {
            success: false,
            error: "userRequest는 문자열이어야 합니다.",
          };
        }

        return await updateDocumentTool(
          parameters.documentId,
          parameters.userId,
          updates,
          userRequest
        );

      default:
        return {
          success: false,
          error: `알 수 없는 도구입니다: ${toolName}`,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `도구 실행 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}
