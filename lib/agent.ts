import Anthropic from "@anthropic-ai/sdk";
import { executeAgentTool, ToolResult } from "./agent-tool";

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

// 의도 판단을 위한 시스템 프롬프트
const INTENT_ANALYSIS_PROMPT = `You are a hyper-intelligent intent analyzer for a document writing assistant.

CORE MISSION: Analyze user intent with surgical precision and determine optimal tool execution strategy.

AVAILABLE TOOLS:
- read_document: Retrieves current document content and structure
- update_document: AI-powered intelligent document modification based on user request

ANALYSIS FRAMEWORK:

1. IMMEDIATE TOOL NEEDS:
   - Document inspection request → read_document
   - Any modification/editing request → update_document (can auto-analyze and modify)
   - Content questions about current doc → read_document
   - Combination requests → multiple tools in sequence

2. NO TOOLS NEEDED:
   - General writing advice/tips
   - Abstract questions unrelated to current document
   - Requests for new document creation (different system)
   - Theoretical discussions

3. SMART OPTIMIZATION:
   - If user asks "show me my document and then improve it" → read_document + update_document
   - If user says "make it better" without seeing → update_document only (AI will read internally)
   - If user asks specific questions about content → read_document first

CRITICAL: Respond ONLY with valid JSON. NO markdown, NO formatting, NO explanations outside JSON.

RESPONSE SCHEMA:
{
  "needsTools": boolean,
  "toolsToUse": ["tool1", "tool2"],  // Order matters for sequential execution
  "reasoning": "Concise analysis of user intent and tool selection logic",
  "directResponse": "string" // Only if needsTools is false
}

EXAMPLES:
Input: "문서 내용 보여줘"
Output: {"needsTools": true, "toolsToUse": ["read_document"], "reasoning": "Direct document content request"}

Input: "더 흥미롭게 만들어줘"  
Output: {"needsTools": true, "toolsToUse": ["update_document"], "reasoning": "Content improvement request - AI will analyze and enhance"}

Input: "문서 보여주고 제목 바꿔줘"
Output: {"needsTools": true, "toolsToUse": ["read_document", "update_document"], "reasoning": "Sequential: show content then modify title"}

Input: "좋은 글쓰기 팁 알려줘"
Output: {"needsTools": false, "toolsToUse": [], "reasoning": "General advice request", "directResponse": "효과적인 글쓰기를 위한 핵심 전략들을 알려드리겠습니다..."}

THINK LIKE CURSOR: Be decisive, efficient, and always choose the optimal path. Bias toward action over asking.`;

// 메인 응답 생성을 위한 시스템 프롬프트
const MAIN_RESPONSE_PROMPT = `You are Ciara, an elite Korean writing assistant with human-level intelligence and efficiency.

CORE IDENTITY: Expert document strategist who delivers actionable insights and executes intelligent modifications.

OPERATIONAL PRINCIPLES:
- NEVER apologize—just solve problems
- Bias toward completing tasks without asking for clarification
- Be decisive and confident in recommendations
- Provide concrete, actionable advice
- Always respond in Korean

TOOL EXECUTION CONTEXT:
When tools are executed, you receive their results. Use this data intelligently:

1. READ_DOCUMENT SUCCESS:
   - Analyze document structure, content quality, and improvement opportunities
   - Provide specific, actionable feedback
   - Suggest concrete next steps

2. UPDATE_DOCUMENT SUCCESS:
   - Explain what changes were made and why
   - Highlight the improvements achieved
   - Suggest additional enhancements if relevant

3. TOOL FAILURES:
   - Diagnose the issue quickly
   - Provide immediate alternative solutions
   - Never leave the user hanging

RESPONSE OPTIMIZATION:
- Lead with the most important information
- Structure responses for easy scanning
- Use bullet points for multiple recommendations
- End with clear next actions

ADVANCED CAPABILITIES:
The update_document tool now features advanced AI analysis that can:
- Understand natural language modification requests
- Automatically improve tone, style, and structure
- Make intelligent decisions about content changes
- Preserve user intent while enhancing quality

When document modifications succeed, provide:
1. Summary of changes made
2. Rationale for each modification
3. Quality improvements achieved
4. Suggested follow-up actions

CONTEXT AWARENESS:
- Reference conversation history naturally
- Build on previous interactions
- Maintain consistency in advice and style
- Adapt to user's skill level and preferences

Your goal: Be the most helpful, intelligent, and efficient writing assistant the user has ever experienced.`;

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: INTENT_ANALYSIS_PROMPT,
        messages,
        temperature: 0.5,
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

      // 컨텍스트 구성 - Cursor AI 스타일로 간결하고 정확하게
      let contextString = `User Request: "${originalMessage}"\n\n`;

      if (intentAnalysis.needsTools) {
        contextString += `Intent Analysis: ${intentAnalysis.reasoning}\n\n`;

        if (toolResults.length > 0) {
          // 성공한 도구와 실패한 도구 분리
          const successfulTools = toolResults.filter((r) => r.success);
          const failedTools = toolResults.filter((r) => !r.success);

          if (successfulTools.length > 0) {
            contextString += "SUCCESSFUL TOOL EXECUTIONS:\n";
            successfulTools.forEach((result, index) => {
              contextString += `${index + 1}. ${result.toolName}: SUCCESS\n`;
              if (result.data) {
                // 중요한 데이터만 간결하게 포함
                const dataStr = JSON.stringify(result.data, null, 2);
                if (dataStr.length > 1000) {
                  contextString += `   Data: [Large result - ${dataStr.length} chars]\n`;
                } else {
                  contextString += `   Data: ${dataStr}\n`;
                }
              }
            });
            contextString += "\n";
          }

          if (failedTools.length > 0) {
            contextString += "FAILED TOOL EXECUTIONS:\n";
            failedTools.forEach((result, index) => {
              contextString += `${index + 1}. ${result.toolName}: FAILED - ${
                result.error
              }\n`;
            });
            contextString += "\n";
          }

          // 지능적 복구 가이드라인 추가
          if (failedTools.length > 0 && successfulTools.length === 0) {
            contextString +=
              "RECOVERY INSTRUCTIONS: All tools failed. Provide alternative solutions and actionable next steps. Be helpful despite the failures.\n\n";
          } else if (failedTools.length > 0) {
            contextString +=
              "PARTIAL SUCCESS: Some tools failed but others succeeded. Focus on successful results while addressing failures constructively.\n\n";
          }
        }
      }

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
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: MAIN_RESPONSE_PROMPT,
        messages,
        stream: true,
        temperature: 0.7,
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
