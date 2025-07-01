import Anthropic from "@anthropic-ai/sdk";
import {
  AGENT_TOOL_SCHEMAS,
  executeAgentTool,
  type ToolResult,
  type DocumentContextData,
} from "./agent-tools";

// 대화 메시지 타입
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Agent 요청 타입
export interface AgentRequest {
  message: string;
  documentId: string;
  userId: string;
  conversationHistory?: ConversationMessage[];
}

// Agent 응답 타입
export interface AgentResponse {
  content: string;
  toolCalls?: ToolCallResult[];
  error?: string;
}

// 도구 호출 결과 타입
export interface ToolCallResult {
  toolName: string;
  input: Record<string, unknown>;
  result: ToolResult;
}

// Agent 전용 시스템 프롬프트
const WRITING_AGENT_SYSTEM_PROMPT = `You are Clara, an intelligent writing assistant specialized in Korean content creation and document management.

CORE CAPABILITIES:
- Document reading, writing, and editing
- Document outline creation and management
- Knowledge file analysis and integration
- Context-aware content generation
- Collaborative writing assistance

AVAILABLE TOOLS:
You have access to the following tools to help users with their documents:

1. read_document: Read document title and content
2. update_document: Update document content or title
3. search_knowledge_files: Search attached knowledge files
4. read_knowledge_file: Read specific knowledge file content
5. get_outline: Get document outline
6. update_outline: Update document outline
7. gather_document_context: Collect all document context at once

WORKING PRINCIPLES:
1. ALWAYS start by gathering context using gather_document_context when user asks about a document
2. Use tools proactively to understand the current state before making suggestions
3. When writing or editing, consider the existing content, outline, and knowledge files
4. Provide specific, actionable suggestions based on the actual document content
5. Reference information from knowledge files when relevant
6. Maintain consistency with the document's existing style and structure

RESPONSE GUIDELINES:
1. Always respond in Korean unless specifically asked otherwise
2. Be concise but comprehensive in your explanations
3. When using tools, explain what you're doing and why
4. Provide specific examples and suggestions
5. Ask clarifying questions when context is unclear
6. Build upon the document's existing content and structure

TOOL USAGE:
- Use gather_document_context first to understand the full situation
- Read knowledge files when they might contain relevant information
- Update documents incrementally rather than completely rewriting
- Keep outlines synchronized with document content
- Always explain your tool usage to the user

Remember: Your goal is to be a collaborative writing partner who understands the document's context and helps improve it systematically.`;

/**
 * Writing Agent 클래스
 */
export class WritingAgent {
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
    }

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 스트리밍 방식으로 Agent 응답 생성
   */
  async *processRequestStream(
    request: AgentRequest
  ): AsyncGenerator<string, AgentResponse, unknown> {
    try {
      // 대화 히스토리 준비
      const messages: Anthropic.Messages.MessageParam[] = [
        ...(request.conversationHistory || []).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: `문서 ID: ${request.documentId}\n\n${request.message}`,
        },
      ];

      // 도구 스키마를 Anthropic 형식으로 변환
      const tools: Anthropic.Messages.Tool[] = Object.values(
        AGENT_TOOL_SCHEMAS
      ).map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: {
          type: tool.input_schema.type,
          properties: tool.input_schema.properties,
          required: [...tool.input_schema.required], // readonly array를 mutable로 변환
        },
      }));

      const toolCalls: ToolCallResult[] = [];
      let finalContent = "";

      // Anthropic Messages API 호출
      const stream = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: WRITING_AGENT_SYSTEM_PROMPT,
        messages,
        tools,
        stream: true,
        temperature: 0.7,
      });

      let currentToolCall: {
        name: string;
        input: string;
      } | null = null;

      for await (const chunk of stream) {
        if (chunk.type === "content_block_start") {
          if (chunk.content_block.type === "tool_use") {
            currentToolCall = {
              name: chunk.content_block.name,
              input: "",
            };
          }
        } else if (chunk.type === "content_block_delta") {
          if (chunk.delta.type === "text_delta") {
            // 일반 텍스트 응답
            finalContent += chunk.delta.text;
            yield chunk.delta.text;
          } else if (
            chunk.delta.type === "input_json_delta" &&
            currentToolCall
          ) {
            // 도구 호출 입력 누적
            currentToolCall.input += chunk.delta.partial_json;
          }
        } else if (chunk.type === "content_block_stop") {
          if (currentToolCall) {
            // 도구 호출 실행
            try {
              const input = JSON.parse(currentToolCall.input);

              // documentId를 자동으로 추가 (필요한 경우)
              if (
                !input.documentId &&
                [
                  "read_document",
                  "search_knowledge_files",
                  "get_outline",
                  "update_outline",
                  "gather_document_context",
                ].includes(currentToolCall.name)
              ) {
                input.documentId = request.documentId;
              }

              yield `\n\n🔧 **도구 사용**: ${currentToolCall.name}\n`;

              const result = await executeAgentTool(
                currentToolCall.name as keyof typeof AGENT_TOOL_SCHEMAS,
                input
              );

              toolCalls.push({
                toolName: currentToolCall.name,
                input,
                result,
              });

              if (result.success) {
                yield `✅ ${result.message}\n\n`;

                // 도구 결과를 바탕으로 추가 응답 생성
                const followUpResponse = await this.generateFollowUpResponse(
                  request,
                  currentToolCall.name,
                  result,
                  messages
                );

                if (followUpResponse) {
                  for await (const text of followUpResponse) {
                    finalContent += text;
                    yield text;
                  }
                }
              } else {
                yield `❌ 오류: ${result.error}\n\n`;
              }
            } catch (error) {
              yield `❌ 도구 실행 오류: ${
                error instanceof Error ? error.message : "알 수 없는 오류"
              }\n\n`;
            }

            currentToolCall = null;
          }
        }
      }

      return {
        content: finalContent,
        toolCalls,
      };
    } catch (error) {
      console.error("Agent processing error:", error);
      yield `오류가 발생했습니다: ${
        error instanceof Error ? error.message : "AI 서비스 오류"
      }`;
      return {
        content: "",
        error: error instanceof Error ? error.message : "AI 서비스 오류",
      };
    }
  }

  /**
   * 도구 호출 결과를 바탕으로 후속 응답 생성
   */
  private async *generateFollowUpResponse(
    request: AgentRequest,
    toolName: string,
    toolResult: ToolResult,
    originalMessages: Anthropic.Messages.MessageParam[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      // 도구 결과를 포함한 메시지 생성
      const followUpMessages: Anthropic.Messages.MessageParam[] = [
        ...originalMessages,
        {
          role: "assistant" as const,
          content: `도구 "${toolName}"을 사용하여 다음 결과를 얻었습니다:\n\n${JSON.stringify(
            toolResult.data,
            null,
            2
          )}\n\n이 정보를 바탕으로 사용자의 요청에 응답하겠습니다.`,
        },
        {
          role: "user" as const,
          content:
            "위 도구 실행 결과를 바탕으로 원래 요청에 대해 구체적이고 유용한 답변을 제공해주세요.",
        },
      ];

      const followUpStream = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: WRITING_AGENT_SYSTEM_PROMPT,
        messages: followUpMessages,
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of followUpStream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error("Follow-up response error:", error);
      yield "\n\n도구 실행은 완료되었지만 후속 응답 생성 중 오류가 발생했습니다.";
    }
  }

  /**
   * 비스트리밍 방식으로 Agent 응답 생성 (필요시 사용)
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    let content = "";
    const toolCalls: ToolCallResult[] = [];

    try {
      const stream = this.processRequestStream(request);
      for await (const chunk of stream) {
        if (typeof chunk === "string") {
          content += chunk;
        } else {
          // 최종 응답 객체
          return chunk;
        }
      }

      return { content, toolCalls };
    } catch (error) {
      return {
        content: "",
        error: error instanceof Error ? error.message : "AI 서비스 오류",
      };
    }
  }

  /**
   * 문서 컨텍스트 기반 제안 생성
   */
  async generateSuggestions(documentId: string): Promise<string[]> {
    try {
      // 문서 컨텍스트 수집
      const contextResult = await executeAgentTool("gather_document_context", {
        documentId,
      });

      if (!contextResult.success) {
        return ["문서 정보를 가져올 수 없어 제안을 생성할 수 없습니다."];
      }

      const context = contextResult.data as DocumentContextData;
      const suggestions: string[] = [];

      // 문서 상태에 따른 제안 생성
      if (!context.summary.hasDocument) {
        suggestions.push("문서 작성을 시작해보세요.");
      } else {
        if (!context.summary.hasOutline) {
          suggestions.push("문서 구조화를 위해 목차를 만들어보세요.");
        }

        if (context.summary.knowledgeFileCount === 0) {
          suggestions.push(
            "참고 자료를 업로드하여 더 풍부한 내용을 작성해보세요."
          );
        }

        if (
          context.document?.content &&
          context.document.content.length < 500
        ) {
          suggestions.push("문서 내용을 더 상세하게 확장해보세요.");
        }
      }

      return suggestions.length > 0
        ? suggestions
        : ["문서가 잘 구성되어 있습니다. 계속 작성해보세요!"];
    } catch (error) {
      console.error("Suggestion generation error:", error);
      return ["제안 생성 중 오류가 발생했습니다."];
    }
  }
}

// 싱글톤 인스턴스
let writingAgentInstance: WritingAgent | null = null;

export function getWritingAgent(): WritingAgent {
  if (!writingAgentInstance) {
    writingAgentInstance = new WritingAgent();
  }
  return writingAgentInstance;
}

export default WritingAgent;
