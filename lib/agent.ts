import Anthropic from "@anthropic-ai/sdk";
import { executeAgentTool, ToolResult } from "./agent-tool";
import {
  INTENT_ANALYSIS_PROMPT,
  MAIN_RESPONSE_PROMPT,
  PROMPT_SETTINGS,
  PromptBuilder,
} from "./prompts";

// 에이전트 AI 메시지 타입
export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

// 의도 판단 결과 타입
export interface IntentAnalysisResult {
  needsTools: boolean;
  toolsToUse: string[];
  reasoning: string;
  directResponse?: string;
}

// 도구 호출 결과 타입
export interface ToolCallResult {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

// 에이전트 결과 타입
export interface AgentResult {
  response: string;
  toolsUsed: ToolCallResult[];
  reasoning: string;
}

// 도구 상태 메시지 타입 추가
export interface ToolStatusMessage {
  type: "tool_status";
  toolName: string;
  status: "starting" | "in_progress" | "completed" | "failed";
  message: string;
}

// 중앙화된 프롬프트 시스템을 사용하여 중복 제거

class AgentAI {
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
   * 사용자 메시지의 의도를 분석합니다
   */
  private async analyzeIntent(
    message: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<IntentAnalysisResult> {
    try {
      const messages: Anthropic.Messages.MessageParam[] = [
        ...conversationHistory.slice(-5).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: `사용자 메시지: "${message}"`,
        },
      ];

      const response = await this.anthropic.messages.create({
        model: PROMPT_SETTINGS.INTENT_ANALYSIS.model,
        max_tokens: PROMPT_SETTINGS.INTENT_ANALYSIS.maxTokens,
        system: INTENT_ANALYSIS_PROMPT,
        messages,
        temperature: PROMPT_SETTINGS.INTENT_ANALYSIS.temperature,
      });

      const responseText =
        response.content[0].type === "text" ? response.content[0].text : "";

      try {
        // 마크다운 코드 블록에서 JSON 추출
        let jsonText = responseText.trim();

        // ```json과 ``` 제거
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const analysis = JSON.parse(jsonText) as IntentAnalysisResult;
        return analysis;
      } catch (parseError) {
        console.error("Intent analysis JSON parse error:", parseError);
        console.error("Raw response:", responseText);
        return {
          needsTools: false,
          toolsToUse: [],
          reasoning: "의도 분석 파싱 실패",
          directResponse:
            "죄송합니다. 요청을 이해하는데 문제가 있었습니다. 다시 말씀해 주시겠어요?",
        };
      }
    } catch (error) {
      console.error("Intent analysis error:", error);
      return {
        needsTools: false,
        toolsToUse: [],
        reasoning: "의도 분석 오류",
        directResponse: "요청을 분석하는 중 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 도구별 친근한 상태 메시지 생성
   */
  private getToolStatusMessage(
    toolName: string,
    status: "starting" | "in_progress" | "completed" | "failed"
  ): string {
    const messages = {
      read_document: {
        starting: "문서 내용을 확인하고 있어요...",
        in_progress: "문서를 읽는 중...",
        completed: "문서 읽기 완료!",
        failed: "문서 읽기에 실패했어요.",
      },
      update_document: {
        starting: "문서를 개선하고 있어요...",
        in_progress: "내용을 분석하고 수정 중...",
        completed: "문서 수정 완료!",
        failed: "문서 수정에 실패했어요.",
      },
    };

    return (
      messages[toolName as keyof typeof messages]?.[status] ||
      `${toolName} ${status}`
    );
  }

  /**
   * 단일 도구를 실행합니다
   */
  private async executeSingleTool(
    toolName: string,
    documentId: string,
    userId: string,
    originalMessage: string
  ): Promise<ToolCallResult> {
    try {
      let result: ToolResult;

      switch (toolName) {
        case "read_document":
          result = await executeAgentTool("read_document", {
            documentId,
            userId,
          });
          break;

        case "update_document":
          result = await executeAgentTool("update_document", {
            documentId,
            userId,
            userRequest: originalMessage,
          });
          break;

        default:
          result = {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }

      return {
        toolName,
        success: result.success,
        data: result.data,
        error: result.error,
      };
    } catch (error) {
      return {
        toolName,
        success: false,
        error: error instanceof Error ? error.message : "Tool execution failed",
      };
    }
  }

  /**
   * 필요한 도구들을 실행합니다 (상태 스트리밍 지원)
   */
  private async *executeToolsWithStatus(
    toolsToUse: string[],
    documentId: string,
    userId: string,
    originalMessage: string
  ): AsyncGenerator<ToolStatusMessage | ToolCallResult[], void, unknown> {
    const results: ToolCallResult[] = [];

    // Cursor AI 스타일 병렬 처리 최적화
    const hasReadDocument = toolsToUse.includes("read_document");
    const hasOtherTools = toolsToUse.some((tool) => tool !== "read_document");

    if (hasReadDocument && hasOtherTools) {
      // 순차 처리: read_document 먼저, 나머지는 병렬
      for (const toolName of toolsToUse) {
        // 도구 시작 상태 전송
        yield {
          type: "tool_status",
          toolName,
          status: "starting",
          message: this.getToolStatusMessage(toolName, "starting"),
        };

        const result = await this.executeSingleTool(
          toolName,
          documentId,
          userId,
          originalMessage
        );

        results.push(result);

        // 도구 완료 상태 전송
        yield {
          type: "tool_status",
          toolName,
          status: result.success ? "completed" : "failed",
          message: this.getToolStatusMessage(
            toolName,
            result.success ? "completed" : "failed"
          ),
        };

        // 중요한 도구가 실패하면 후속 도구 실행 중단
        if (!result.success && toolName === "read_document") {
          break;
        }
      }
    } else {
      // 병렬 처리 가능한 경우
      // 병렬 도구들의 시작 상태 전송
      for (const toolName of toolsToUse) {
        yield {
          type: "tool_status",
          toolName,
          status: "starting",
          message: this.getToolStatusMessage(toolName, "starting"),
        };
      }

      const toolPromises = toolsToUse.map((toolName) =>
        this.executeSingleTool(toolName, documentId, userId, originalMessage)
      );

      const parallelResults = await Promise.all(toolPromises);
      results.push(...parallelResults);

      // 병렬 도구들의 완료 상태 전송
      for (const result of parallelResults) {
        yield {
          type: "tool_status",
          toolName: result.toolName,
          status: result.success ? "completed" : "failed",
          message: this.getToolStatusMessage(
            result.toolName,
            result.success ? "completed" : "failed"
          ),
        };
      }
    }

    // 최종 결과 반환
    yield results;
  }

  /**
   * 최종 응답을 생성합니다 (실제 스트리밍 지원)
   */
  private async *generateResponseStream(
    originalMessage: string,
    intentAnalysis: IntentAnalysisResult,
    toolResults: ToolCallResult[],
    conversationHistory: AgentMessage[] = []
  ): AsyncGenerator<string, void, unknown> {
    try {
      // 도구가 사용되지 않은 경우 직접 응답 반환
      if (!intentAnalysis.needsTools && intentAnalysis.directResponse) {
        yield intentAnalysis.directResponse;
        return;
      }

      // 중앙화된 프롬프트 빌더를 사용하여 컨텍스트 구성
      const contextString = PromptBuilder.buildContext(
        originalMessage,
        intentAnalysis,
        toolResults
      );

      const messages: Anthropic.Messages.MessageParam[] = [
        ...conversationHistory.slice(-5).map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: contextString,
        },
      ];

      // 실제 스트리밍 응답 생성
      const stream = await this.anthropic.messages.create({
        model: PROMPT_SETTINGS.MAIN_RESPONSE.model,
        max_tokens: PROMPT_SETTINGS.MAIN_RESPONSE.maxTokens,
        system: MAIN_RESPONSE_PROMPT,
        messages,
        stream: true,
        temperature: PROMPT_SETTINGS.MAIN_RESPONSE.temperature,
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error("Response generation error:", error);

      // 지능적 에러 복구 - 도구 결과가 있으면 그것이라도 활용
      if (toolResults.length > 0) {
        const successfulResults = toolResults.filter((r) => r.success);
        if (successfulResults.length > 0) {
          yield `요청을 부분적으로 처리했습니다. ${successfulResults
            .map((r) => r.toolName)
            .join(
              ", "
            )} 실행이 완료되었지만, 최종 응답 생성 중 문제가 발생했습니다. 결과를 확인해보시거나 다시 시도해 주세요.`;
          return;
        }
      }

      yield "응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  /**
   * 스트리밍 에이전트 처리 (도구 상태 표시 포함)
   */
  async *agentStream(
    message: string,
    documentId: string,
    userId: string,
    conversationHistory: AgentMessage[] = []
  ): AsyncGenerator<string | ToolStatusMessage, AgentResult, unknown> {
    try {
      // 1. 의도 분석 (사용자에게 숨김)
      const intentAnalysis = await this.analyzeIntent(
        message,
        conversationHistory
      );

      let toolResults: ToolCallResult[] = [];

      // 2. 도구 실행 (상태 메시지와 함께)
      if (intentAnalysis.needsTools && intentAnalysis.toolsToUse.length > 0) {
        const toolExecutionStream = this.executeToolsWithStatus(
          intentAnalysis.toolsToUse,
          documentId,
          userId,
          message
        );

        for await (const chunk of toolExecutionStream) {
          if (Array.isArray(chunk)) {
            // 최종 도구 결과
            toolResults = chunk;
          } else {
            // 도구 상태 메시지
            yield chunk;
          }
        }
      }

      // 3. 실시간 스트리밍 응답 생성
      let completeResponse = "";
      const responseStream = this.generateResponseStream(
        message,
        intentAnalysis,
        toolResults,
        conversationHistory
      );

      for await (const chunk of responseStream) {
        completeResponse += chunk;
        yield chunk; // 실시간으로 청크 전송
      }

      return {
        response: completeResponse,
        toolsUsed: toolResults,
        reasoning: intentAnalysis.reasoning,
      };
    } catch (error) {
      console.error("Agent error:", error);
      const errorMessage = "처리 중 오류가 발생했습니다. 다시 시도해 주세요.";
      yield errorMessage;

      return {
        response: errorMessage,
        toolsUsed: [],
        reasoning: "에이전트 오류",
      };
    }
  }

  /**
   * 단순 응답 (스트리밍 없이)
   */
  async execute(
    message: string,
    documentId: string,
    userId: string,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResult> {
    try {
      // 1. 의도 분석
      const intentAnalysis = await this.analyzeIntent(
        message,
        conversationHistory
      );

      let toolResults: ToolCallResult[] = [];

      // 2. 도구 실행 (상태 메시지 없이)
      if (intentAnalysis.needsTools && intentAnalysis.toolsToUse.length > 0) {
        const toolExecutionStream = this.executeToolsWithStatus(
          intentAnalysis.toolsToUse,
          documentId,
          userId,
          message
        );

        for await (const chunk of toolExecutionStream) {
          if (Array.isArray(chunk)) {
            toolResults = chunk;
            break; // 결과만 가져오고 종료
          }
        }
      }

      // 3. 응답 생성 (스트리밍 없이)
      let completeResponse = "";
      const responseStream = this.generateResponseStream(
        message,
        intentAnalysis,
        toolResults,
        conversationHistory
      );

      for await (const chunk of responseStream) {
        completeResponse += chunk;
      }

      return {
        response: completeResponse,
        toolsUsed: toolResults,
        reasoning: intentAnalysis.reasoning,
      };
    } catch (error) {
      console.error("Agent error:", error);
      return {
        response: "처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
        toolsUsed: [],
        reasoning: "에이전트 오류",
      };
    }
  }
}

// 싱글톤 인스턴스
let agentAIInstance: AgentAI | null = null;

export async function getAgentAI(): Promise<AgentAI> {
  if (!agentAIInstance) {
    agentAIInstance = new AgentAI();
  }
  return agentAIInstance;
}

export default AgentAI;
