import ServerSupabase from "./server-supabase";
import Anthropic from "@anthropic-ai/sdk";
import {
  getDocumentContent,
  updateDocumentContent,
  createAIUserId,
} from "./liveblocks-utils";
import {
  DOCUMENT_EDITING_PROMPT,
  DOCUMENT_INDEX_GENERATION_PROMPT,
  PROMPT_SETTINGS,
  PromptBuilder,
} from "./prompts";

// 도구 결과 타입 정의
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// read_document 결과 타입 (Liveblocks 기반)
export interface DocumentReadResult {
  content: string;
  metadata: {
    documentId: string;
    aiUserId: string;
    readAt: string;
  };
}

// get_document_modifications 결과 타입
export interface DocumentModificationResult {
  originalContent: string;
  suggestedContent: string;
  changes: string[];
  metadata: {
    documentId: string;
    aiUserId: string;
    analyzedAt: string;
  };
}

// generate_index 결과 타입
export interface DocumentIndexResult {
  indexContent: string;
  indexItems: Array<{
    level: number;
    title: string;
    description?: string;
  }>;
  metadata: {
    documentId: string;
    aiUserId: string;
    generatedAt: string;
    totalItems: number;
  };
}

// 사용자 응답 타입 (feedback 필드 제거)
export interface UserModificationResponse {
  action: "approve" | "reject";
  customContent?: string; // 사용자가 직접 수정한 내용
}

// 수정 제안 처리 결과 타입 (userFeedback 필드 제거)
export interface ModificationProcessResult {
  action: "approve" | "reject";
  finalContent: string;
  appliedChanges: string[];
  metadata: {
    documentId: string;
    aiUserId: string;
    processedAt: string;
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
  } catch {
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
 * 에이전트 도구: 수정 제안 처리
 * 사용자의 승인/거절 응답을 처리하여 최종 문서를 업데이트
 * @param documentId - 처리할 문서의 ID (Room ID와 동일)
 * @param userId - 요청하는 사용자의 ID
 * @param response - 사용자의 응답 (승인/거절)
 * @returns 처리 결과 정보
 */
export async function processModificationResponse(
  documentId: string,
  userId: string,
  response: UserModificationResponse
): Promise<ToolResult<ModificationProcessResult>> {
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

    if (!response || typeof response !== "object") {
      return {
        success: false,
        error: "사용자 응답이 필요합니다.",
      };
    }

    if (!["approve", "reject"].includes(response.action)) {
      return {
        success: false,
        error: "올바른 응답 액션이 필요합니다 (approve, reject).",
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

    try {
      // 현재 Liveblocks 문서 내용 읽기
      const currentContent = await getDocumentContent(documentId);

      let finalContent: string;
      let appliedChanges: string[] = [];

      switch (response.action) {
        case "approve":
          // 승인: 제안된 내용을 적용 (customContent가 있으면 사용, 없으면 오류)
          if (response.customContent) {
            finalContent = response.customContent;
            appliedChanges = ["사용자가 제안을 승인하고 내용을 적용했습니다"];
          } else {
            return {
              success: false,
              error: "승인 시 적용할 내용이 필요합니다.",
            };
          }
          break;

        case "reject":
          // 거절: 현재 내용 유지
          finalContent = currentContent;
          appliedChanges = ["사용자가 제안을 거절했습니다"];
          break;

        default:
          return {
            success: false,
            error: "지원되지 않는 응답 액션입니다.",
          };
      }

      // 승인인 경우에만 실제 문서 업데이트
      if (response.action === "approve") {
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
      }

      const result = {
        success: true,
        data: {
          action: response.action,
          finalContent,
          appliedChanges,
          metadata: {
            documentId,
            aiUserId,
            processedAt: new Date().toISOString(),
          },
        },
      };
      return result;
    } catch (liveblocksError) {
      console.error("Liveblocks 오류:", liveblocksError);
      return {
        success: false,
        error: `실시간 문서를 처리할 수 없습니다: ${
          liveblocksError instanceof Error
            ? liveblocksError.message
            : "알 수 없는 오류"
        }`,
      };
    }
  } catch (error) {
    console.error("수정 제안 처리 중 오류:", error);
    return {
      success: false,
      error: `수정 제안 처리 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

/**
 * 에이전트 도구: 문서 수정 사항 조회
 * AI가 현재 문서 내용을 분석하여 수정 사항을 제안하지만 실제로는 문서를 수정하지 않음
 * @param documentId - 분석할 문서의 ID (Room ID와 동일)
 * @param userId - 요청하는 사용자의 ID
 * @param userRequest - 사용자의 수정 요청
 * @returns 수정 사항 제안 정보
 */
export async function getDocumentModifications(
  documentId: string,
  userId: string,
  userRequest: string
): Promise<ToolResult<DocumentModificationResult>> {
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

    if (!userRequest || typeof userRequest !== "string") {
      return {
        success: false,
        error: "사용자 요청이 필요합니다.",
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
      // 현재 Liveblocks 문서 내용 읽기
      const originalContent = await getDocumentContent(documentId);

      // AI로 수정 사항 분석
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          success: false,
          error: "AI 서비스가 설정되지 않았습니다.",
        };
      }

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const userMessage = PromptBuilder.buildDocumentEditingContext(
        originalContent,
        userRequest
      );

      try {
        const response = await anthropic.messages.create({
          model: PROMPT_SETTINGS.DOCUMENT_EDITING.model,
          max_tokens: PROMPT_SETTINGS.DOCUMENT_EDITING.maxTokens,
          system: DOCUMENT_EDITING_PROMPT,
          messages: [
            {
              role: "user",
              content: userMessage,
            },
          ],
          temperature: PROMPT_SETTINGS.DOCUMENT_EDITING.temperature,
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
        } catch {
          return {
            success: false,
            error: "AI 응답을 분석할 수 없습니다.",
          };
        }

        const result = {
          success: true,
          data: {
            originalContent,
            suggestedContent: aiDecision.content || originalContent,
            changes: aiDecision.changes || ["수정 사항 없음"],
            metadata: {
              documentId,
              aiUserId,
              analyzedAt: new Date().toISOString(),
            },
          },
        };

        return result;
      } catch (anthropicError) {
        console.error("AI 처리 중 오류:", anthropicError);
        return {
          success: false,
          error: "AI 처리 중 오류가 발생했습니다.",
        };
      }
    } catch (liveblocksError) {
      console.error("Liveblocks 오류:", liveblocksError);
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
    console.error("문서 수정 사항 조회 중 오류:", error);
    return {
      success: false,
      error: `문서 수정 사항 조회 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

/**
 * 에이전트 도구: 문서 목차 생성
 * 현재 문서 내용을 분석하여 적절한 목차를 생성합니다
 * @param documentId - 분석할 문서의 ID (Room ID와 동일)
 * @param userId - 요청하는 사용자의 ID
 * @param userRequest - 사용자의 목차 생성 요청 (문서가 비어있을 때 판단 근거로 사용)
 * @returns 생성된 목차 정보
 */
export async function generateIndex(
  documentId: string,
  userId: string,
  userRequest?: string
): Promise<ToolResult<DocumentIndexResult>> {
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

      // Anthropic API 초기화
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      try {
        // AI를 사용하여 목차 생성
        const response = await anthropic.messages.create({
          model: PROMPT_SETTINGS.DOCUMENT_EDITING.model,
          max_tokens: PROMPT_SETTINGS.MAIN_RESPONSE.maxTokens,
          system: DOCUMENT_INDEX_GENERATION_PROMPT,
          messages: [
            {
              role: "user",
              content: `다음 문서의 내용을 분석하여 적절한 목차를 생성해주세요:

문서 내용:
${content}

사용자 요청: ${userRequest || "문서의 목차를 생성해주세요"}

문서 내용 길이: ${content.length}자
문서가 비어있거나 내용이 부족한 경우, 사용자 요청을 기반으로 목차 생성이 가능한지 판단해주세요.`,
            },
          ],
          temperature: PROMPT_SETTINGS.DOCUMENT_EDITING.temperature,
        });

        const responseText =
          response.content[0].type === "text" ? response.content[0].text : "";

        try {
          // 마크다운 코드 블록에서 JSON 추출
          let jsonText = responseText.trim();

          // ```json과 ``` 제거
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText
              .replace(/^```json\s*/, "")
              .replace(/\s*```$/, "");
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }

          const indexResult = JSON.parse(jsonText);

          // 거절 응답 처리
          if (indexResult.rejected) {
            return {
              success: false,
              error: `목차 생성이 적절하지 않습니다: ${indexResult.reason}`,
            };
          }

          // 성공 응답 검증
          if (!indexResult.indexContent || !indexResult.indexItems) {
            return {
              success: false,
              error: "목차 생성 결과가 올바르지 않습니다.",
            };
          }

          // indexItems 배열 검증
          if (!Array.isArray(indexResult.indexItems)) {
            return {
              success: false,
              error: "목차 항목이 올바른 형식이 아닙니다.",
            };
          }

          const result = {
            success: true,
            data: {
              indexContent: indexResult.indexContent,
              indexItems: indexResult.indexItems,
              metadata: {
                documentId,
                aiUserId,
                generatedAt: new Date().toISOString(),
                totalItems: indexResult.indexItems.length,
              },
            },
          };

          return result;
        } catch (parseError) {
          console.error("목차 생성 JSON 파싱 오류:", parseError);
          console.error("원본 응답:", responseText);
          return {
            success: false,
            error: "목차 생성 결과를 처리하는 중 오류가 발생했습니다.",
          };
        }
      } catch (anthropicError) {
        console.error("AI 처리 중 오류:", anthropicError);
        return {
          success: false,
          error: "AI 처리 중 오류가 발생했습니다.",
        };
      }
    } catch (liveblocksError) {
      console.error("Liveblocks 오류:", liveblocksError);
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
    console.error("목차 생성 중 오류:", error);
    return {
      success: false,
      error: `목차 생성 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

// 도구 목록 및 메타데이터 (process_modification_response 설명 업데이트)
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
  get_document_modifications: {
    name: "get_document_modifications",
    description:
      "현재 문서의 내용을 분석하여 수정 사항을 제안합니다. 실제로는 문서를 수정하지 않습니다.",
    parameters: {
      documentId: {
        type: "string",
        description: "분석할 문서의 ID",
        required: true,
      },
      userId: {
        type: "string",
        description: "요청하는 사용자의 ID",
        required: true,
      },
      userRequest: {
        type: "string",
        description: "사용자의 수정 요청",
        required: true,
      },
    },
    function: getDocumentModifications,
  },
  process_modification_response: {
    name: "process_modification_response",
    description:
      "사용자의 수정 제안 응답(승인/거절)을 처리하여 최종 문서를 업데이트합니다.",
    parameters: {
      documentId: {
        type: "string",
        description: "처리할 문서의 ID",
        required: true,
      },
      userId: {
        type: "string",
        description: "요청하는 사용자의 ID",
        required: true,
      },
      response: {
        type: "object",
        description: "사용자의 수정 제안 응답",
        properties: {
          action: {
            type: "string",
            description: "응답 액션 (approve, reject)",
          },
          customContent: {
            type: "string",
            description: "사용자가 직접 수정한 내용 (승인 시 필요)",
          },
        },
        required: true,
      },
    },
    function: processModificationResponse,
  },
  generate_index: {
    name: "generate_index",
    description: "현재 문서의 내용을 분석하여 적절한 목차를 생성합니다.",
    parameters: {
      documentId: {
        type: "string",
        description: "분석할 문서의 ID",
        required: true,
      },
      userId: {
        type: "string",
        description: "요청하는 사용자의 ID",
        required: true,
      },
      userRequest: {
        type: "string",
        description: "사용자의 목차 생성 요청",
        required: false,
      },
    },
    function: generateIndex,
  },
} as const;

// 도구 실행 헬퍼 함수 (update_document 케이스 제거)
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

      case "get_document_modifications":
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
        if (typeof parameters.userRequest !== "string") {
          return {
            success: false,
            error: "userRequest는 문자열이어야 합니다.",
          };
        }
        return await getDocumentModifications(
          parameters.documentId,
          parameters.userId,
          parameters.userRequest
        );

      case "process_modification_response":
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
        if (typeof parameters.response !== "object" || !parameters.response) {
          return {
            success: false,
            error: "response는 객체여야 합니다.",
          };
        }
        return await processModificationResponse(
          parameters.documentId,
          parameters.userId,
          parameters.response as UserModificationResponse
        );

      case "generate_index":
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
        return await generateIndex(
          parameters.documentId,
          parameters.userId,
          parameters.userRequest as string | undefined
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
