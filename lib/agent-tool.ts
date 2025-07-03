import { Document, UpdateDocumentData } from "./documents";
import { DocumentIndex } from "./index";
import ServerSupabase from "./server-supabase";
import Anthropic from "@anthropic-ai/sdk";

// 도구 결과 타입 정의
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 문서 읽기 결과 타입
export interface DocumentReadResult {
  document: Document;
  index: DocumentIndex | null;
}

// 문서 업데이트 결과 타입
export interface DocumentUpdateResult {
  document: Document;
  updatedFields: string[];
}

/**
 * 문서 소유권 검증
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
      console.error("Error verifying document ownership:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in verifyDocumentOwnership:", error);
    return false;
  }
}

/**
 * 에이전트 도구: 현재 작성된 문서 읽기
 * @param documentId - 읽을 문서의 ID
 * @param userId - 요청하는 사용자의 ID
 * @returns 문서 내용과 목차 정보
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

    // Service Role로 문서 조회
    const { data: document, error: docError } = await ServerSupabase.from(
      "documents"
    )
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return {
        success: false,
        error: `문서를 찾을 수 없습니다. (ID: ${documentId})`,
      };
    }

    // Service Role로 목차 조회
    const { data: index } = await ServerSupabase.from("index")
      .select("*")
      .eq("document_id", documentId)
      .single();

    return {
      success: true,
      data: {
        document,
        index: index || null,
      },
    };
  } catch (error) {
    console.error("Error in readDocument tool:", error);
    return {
      success: false,
      error: `문서 읽기 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

/**
 * 에이전트 도구: 현재 작성된 문서 수정 (AI 지능형 수정 지원)
 * @param documentId - 수정할 문서의 ID
 * @param userId - 요청하는 사용자의 ID
 * @param updates - 업데이트할 데이터 (title, content) - 선택사항
 * @param userRequest - 사용자의 수정 요청 (AI가 자동으로 수정할 때 사용) - 선택사항
 * @returns 업데이트된 문서 정보
 */
export async function updateDocumentTool(
  documentId: string,
  userId: string,
  updates?: UpdateDocumentData,
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
    if (!updates && !userRequest) {
      return {
        success: false,
        error: "업데이트할 데이터 또는 사용자 요청이 필요합니다.",
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

    let finalUpdates: UpdateDocumentData = {};

    // userRequest가 있으면 AI로 지능적 수정
    if (userRequest && typeof userRequest === "string") {
      // 현재 문서 내용 읽기
      const { data: document, error: docError } = await ServerSupabase.from(
        "documents"
      )
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError || !document) {
        return {
          success: false,
          error: `문서를 찾을 수 없습니다. (ID: ${documentId})`,
        };
      }

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

      const systemPrompt = `You are an elite document editing AI with human-level intelligence and precision.

CORE MISSION: Transform user requests into optimal document modifications with surgical precision and intelligent reasoning.

CRITICAL: Respond ONLY with valid JSON. NO markdown blocks, NO extra formatting, NO explanations outside JSON, NO emojis.

ANALYSIS FRAMEWORK:
1. UNDERSTAND USER INTENT: Decode what the user truly wants beyond surface-level requests
2. EVALUATE CURRENT CONTENT: Assess document quality, style, structure, and improvement potential  
3. DETERMINE OPTIMAL CHANGES: Make intelligent decisions about what to modify, preserve, or enhance
4. EXECUTE WITH PRECISION: Apply changes that align with user intent while improving overall quality

MODIFICATION STRATEGIES:

TITLE IMPROVEMENTS:
- Make titles more engaging and descriptive
- Ensure clarity and reader appeal
- Maintain topic relevance
- Consider readability

CONTENT ENHANCEMENTS:
- Improve flow and readability
- Enhance tone and style consistency
- Add compelling details where needed
- Fix grammar and structural issues
- Preserve core message and intent
- Make content more engaging/interesting
- Optimize for target audience

SMART DECISION MAKING:
- If user says "make it better" → analyze weakness and improve comprehensively
- If user requests specific changes → focus on that area while maintaining coherence
- If content is already good → make subtle refinements or suggest no changes
- If content needs major work → implement significant improvements

RESPONSE SCHEMA:
{
  "shouldUpdate": boolean,
  "updates": {
    "title": "new title text (optional)",
    "content": "new content text (optional)"
  },
  "reasoning": "Concise explanation of changes and rationale"
}

QUALITY STANDARDS:
- Only suggest changes that genuinely improve the document
- Preserve user's voice and intent
- Maintain factual accuracy
- Ensure changes are contextually appropriate
- Never make unnecessary modifications

EXECUTION PRINCIPLES:
- Be decisive and confident in modifications
- Focus on high-impact improvements
- Consider document purpose and audience
- Maintain professional quality standards
- Enhance user satisfaction through better content

Think like the world's best editor: precise, intelligent, and focused on creating exceptional content.`;

      const userMessage = `DOCUMENT ANALYSIS REQUEST

Current Document:
Title: ${document.title || "[No title]"}
Content: ${document.content || "[No content]"}

User Request: "${userRequest}"

TASK: Analyze this document and user request, then determine optimal modifications. Focus on understanding the user's true intent and delivering improvements that exceed expectations.

Respond with JSON only - no additional text or formatting.`;

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
          console.error("AI response parsing error:", parseError);
          console.error("Raw AI response:", responseText);
          return {
            success: false,
            error: "AI 응답을 분석할 수 없습니다.",
          };
        }

        // AI가 수정이 불필요하다고 판단한 경우
        if (!aiDecision.shouldUpdate) {
          return {
            success: true,
            data: {
              document,
              updatedFields: [],
            },
          };
        }

        // AI가 제안한 수정사항 적용
        if (
          aiDecision.updates.title &&
          aiDecision.updates.title !== document.title
        ) {
          finalUpdates.title = aiDecision.updates.title;
        }

        if (
          aiDecision.updates.content &&
          aiDecision.updates.content !== document.content
        ) {
          finalUpdates.content = aiDecision.updates.content;
        }
      } catch (aiError) {
        console.error("AI processing error:", aiError);
        return {
          success: false,
          error: "AI 처리 중 오류가 발생했습니다.",
        };
      }
    }

    // 기존 updates가 있으면 병합 (AI 결과를 우선으로 함)
    if (updates) {
      finalUpdates = { ...updates, ...finalUpdates };
    }

    // 업데이트할 내용이 없는 경우
    if (Object.keys(finalUpdates).length === 0) {
      // 현재 문서를 다시 조회해서 반환
      const { data: currentDoc } = await ServerSupabase.from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      return {
        success: true,
        data: {
          document: currentDoc,
          updatedFields: [],
        },
      };
    }

    // Service Role로 문서 업데이트
    const { data: updatedDocument, error: updateError } =
      await ServerSupabase.from("documents")
        .update(finalUpdates)
        .eq("id", documentId)
        .select()
        .single();

    if (updateError || !updatedDocument) {
      return {
        success: false,
        error: `문서 업데이트에 실패했습니다: ${
          updateError?.message || "알 수 없는 오류"
        }`,
      };
    }

    // 업데이트된 필드 목록 생성
    const updatedFields: string[] = [];
    if (finalUpdates.title !== undefined) updatedFields.push("title");
    if (finalUpdates.content !== undefined) updatedFields.push("content");

    return {
      success: true,
      data: {
        document: updatedDocument,
        updatedFields,
      },
    };
  } catch (error) {
    console.error("Error in updateDocumentTool:", error);
    return {
      success: false,
      error: `문서 수정 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}

// 도구 목록 및 메타데이터
export const AGENT_TOOLS = {
  read_document: {
    name: "read_document",
    description: "현재 작성된 문서의 내용과 목차를 읽어옵니다.",
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
      "현재 작성된 문서의 제목이나 내용을 수정합니다. AI가 사용자 요청을 분석하여 지능적으로 수정할 수 있습니다.",
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
          title: {
            type: "string",
            description: "새로운 문서 제목 (선택사항)",
          },
          content: {
            type: "string",
            description: "새로운 문서 내용 (선택사항)",
          },
        },
        required: false,
      },
      userRequest: {
        type: "string",
        description:
          "사용자의 수정 요청 (AI가 자동으로 분석하여 수정, 선택사항)",
        required: false,
      },
    },
    function: updateDocumentTool,
  },
} as const;

// 도구 실행 헬퍼 함수
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
        const updates = parameters.updates as UpdateDocumentData | undefined;
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
    console.error("Error executing agent tool:", error);
    return {
      success: false,
      error: `도구 실행 중 오류가 발생했습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
    };
  }
}
