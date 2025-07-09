import { generateIndex } from "./generate-index";
import { generateDocument } from "./generate-document";
import Anthropic from "@anthropic-ai/sdk";
import { saveDocumentIndexServer } from "../lib/server-database";

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 타입 정의
export interface ConversationContext {
  userId: string;
  documentId?: string;
  conversationHistory: Message[];
  currentDocumentState?: DocumentState;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DocumentState {
  title: string;
  hasContent: boolean;
  hasIndex: boolean;
  lastModified: string;
}

export interface UserRequest {
  message: string;
  context: ConversationContext;
}

interface IntentAnalysis {
  primaryIntent: string;
  secondaryIntents: string[];
  explicitNeeds: string[];
  implicitNeeds: string[];
  documentAction:
    | "create_new"
    | "improve_existing"
    | "general_guidance"
    | "unclear";
  confidence: number;
}

interface ActionPlan {
  strategy: string;
  toolsRequired: ToolAction[];
  reasoning: string;
  expectedOutcome: string;
}

interface ToolAction {
  tool: "generateIndex" | "generateDocument" | "directResponse";
  parameters?: any;
  reasoning: string;
  order: number;
}

export interface CiaraResponse {
  success: boolean;
  response: string;
  actionsTaken: string[];
  nextSuggestions?: string[];
  error?: string;
}

// CIARA 핵심 페르소나 및 시스템 프롬프트 (Cursor AI 기법 적용)
const CIARA_CORE_PERSONA = `<system_context>
You are CIARA, an expert document creation assistant specializing in professional writing and content structuring. You excel at semantic analysis, logical organization, and producing publication-quality content that serves users' specific goals. You are the central intelligence that orchestrates document creation workflows.
</system_context>

<identity>
- Professional document writing specialist with deep expertise in content architecture
- Proactive partner who anticipates user needs and suggests optimal approaches  
- Quality-focused advisor maintaining high standards for document excellence
- Intuitive collaborator who understands context and user intent beyond explicit requests
- Strategic thinker who plans multi-step document creation workflows
</identity>

<core_capabilities>
You have access to specialized tools:
1. generateIndex: Creates comprehensive document outlines and structures
2. generateDocument: Generates high-quality content for specific document sections
3. Direct consultation: Provides immediate guidance, tips, and advice

CRITICAL RULE: For any new document or structure-related request, generateIndex MUST be used first before generateDocument.
</core_capabilities>

<reasoning_methodology>
1. Analyze user intent with both explicit and implicit needs assessment
2. Evaluate current document state and workflow position
3. Plan optimal tool usage strategy considering the generateIndex-first rule
4. Execute planned actions with continuous context awareness
5. Provide thoughtful follow-up suggestions for document improvement
</reasoning_methodology>

<communication_style>
- Clear, actionable guidance with specific next steps
- Friendly yet professional tone that builds user confidence
- Contextual awareness that references previous interactions and document state
- Solution-oriented approach that provides alternatives when challenges arise
- Korean language responses with natural, professional tone
</communication_style>`;

// 사용자 의도 분석 엔진
class IntentAnalysisEngine {
  async analyzeUserIntent(
    userMessage: string,
    context: ConversationContext
  ): Promise<IntentAnalysis> {
    const analysisPrompt = `${CIARA_CORE_PERSONA}

<task>
Analyze the user's message to understand their intent and needs for document creation assistance.
</task>

<user_message>
${userMessage}
</user_message>

<conversation_context>
Document State: ${
      context.currentDocumentState
        ? JSON.stringify(context.currentDocumentState)
        : "No document"
    }
Recent History: ${context.conversationHistory
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")}
</conversation_context>

<analysis_framework>
Analyze the user's request across these dimensions:

1. PRIMARY INTENT: What is the main thing the user wants to accomplish?
2. SECONDARY INTENTS: What additional needs might they have?
3. EXPLICIT NEEDS: What they directly asked for
4. IMPLICIT NEEDS: What they might need but didn't explicitly mention
5. DOCUMENT ACTION: Categorize as:
   - create_new: Starting a new document from scratch
   - improve_existing: Enhancing or modifying existing content
   - general_guidance: Seeking advice or tips
   - unclear: Intent is ambiguous and needs clarification

6. CONFIDENCE: How certain are you about this analysis (0-100)?
</analysis_framework>

<response_format>
Return ONLY a JSON object with this exact structure:
{
  "primaryIntent": "clear description of main intent",
  "secondaryIntents": ["array", "of", "secondary", "intents"],
  "explicitNeeds": ["what", "they", "directly", "asked", "for"],
  "implicitNeeds": ["what", "they", "might", "also", "need"],
  "documentAction": "create_new|improve_existing|general_guidance|unclear",
  "confidence": 85
}
</response_format>`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{ role: "user", content: analysisPrompt }],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude API");
      }

      // Claude가 markdown 코드 블록으로 감싸서 응답하는 경우 처리
      let jsonText = content.text.trim();

      // ```json ... ``` 형태의 코드 블록 제거
      if (jsonText.startsWith("```json") || jsonText.startsWith("```")) {
        const lines = jsonText.split("\n");
        lines.shift(); // 첫 번째 라인 (```json) 제거
        if (lines[lines.length - 1].trim() === "```") {
          lines.pop(); // 마지막 라인 (```) 제거
        }
        jsonText = lines.join("\n").trim();
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error in intent analysis:", error);
      // 폴백 분석
      return {
        primaryIntent: "사용자 요청 처리",
        secondaryIntents: [],
        explicitNeeds: [userMessage],
        implicitNeeds: [],
        documentAction: "unclear",
        confidence: 50,
      };
    }
  }
}

// 전략적 계획 수립 엔진
class StrategicPlanningEngine {
  async createActionPlan(
    intentAnalysis: IntentAnalysis,
    context: ConversationContext
  ): Promise<ActionPlan> {
    const planningPrompt = `${CIARA_CORE_PERSONA}

<task>
Create a strategic action plan based on the user intent analysis and current context.
</task>

<intent_analysis>
${JSON.stringify(intentAnalysis, null, 2)}
</intent_analysis>

<current_context>
Document State: ${
      context.currentDocumentState
        ? JSON.stringify(context.currentDocumentState)
        : "No document"
    }
Document ID: ${context.documentId || "None"}
</current_context>

 <planning_rules>
 1. CRITICAL: If documentAction is "create_new" OR if user wants structure/outline, generateIndex MUST be first tool
 2. For new documents, you can plan BOTH generateIndex (order: 1) AND generateDocument (order: 2) if user wants complete content
 3. generateDocument now works as a BATCH processor - it automatically generates ALL sections from the document index
 4. For general questions, advice, or guidance, use directResponse
 5. Always plan logically: structure before content, outline before details
 6. Consider user's implicit needs - if they want a "complete document", plan both index and content generation
 7. You can include multiple tools in toolsRequired array for comprehensive workflows
 8. generateDocument no longer requires targetSection parameter - it processes all sections automatically
 </planning_rules>

<available_tools>
- generateIndex: Creates document outlines and structures (ALWAYS use first for new documents)
- generateDocument: Generates complete document content for ALL sections automatically (batch processing)
- directResponse: Provides immediate guidance, tips, and consultation
</available_tools>

<response_format>
Return ONLY a JSON object:
{
  "strategy": "overall strategy description",
  "toolsRequired": [
    {
      "tool": "generateIndex|generateDocument|directResponse",
      "parameters": {"key": "value"},
      "reasoning": "why this tool at this step",
      "order": 1
    }
  ],
  "reasoning": "detailed reasoning for this plan",
  "expectedOutcome": "what the user should expect"
}
</response_format>`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        temperature: 0.4,
        messages: [{ role: "user", content: planningPrompt }],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude API");
      }

      // Claude가 markdown 코드 블록으로 감싸서 응답하는 경우 처리
      let jsonText = content.text.trim();

      // ```json ... ``` 형태의 코드 블록 제거
      if (jsonText.startsWith("```json") || jsonText.startsWith("```")) {
        const lines = jsonText.split("\n");
        lines.shift(); // 첫 번째 라인 (```json) 제거
        if (lines[lines.length - 1].trim() === "```") {
          lines.pop(); // 마지막 라인 (```) 제거
        }
        jsonText = lines.join("\n").trim();
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error("Error in strategic planning:", error);
      // 폴백 계획
      return {
        strategy: "기본 응답 제공",
        toolsRequired: [
          {
            tool: "directResponse",
            reasoning: "계획 수립 중 오류 발생으로 직접 응답",
            order: 1,
          },
        ],
        reasoning: "시스템 오류로 인한 폴백 계획",
        expectedOutcome: "기본적인 도움 제공",
      };
    }
  }
}

// 직접 응답 생성 엔진
class DirectResponseEngine {
  async generateDirectResponse(
    userMessage: string,
    context: ConversationContext,
    reasoning: string
  ): Promise<string> {
    const responsePrompt = `${CIARA_CORE_PERSONA}

<task>
Provide a helpful, professional response to the user's message. This is a direct consultation where you're giving advice, guidance, or answering questions about document creation.
</task>

<user_message>
${userMessage}
</user_message>

<context>
${
  context.currentDocumentState
    ? `Current Document: ${JSON.stringify(context.currentDocumentState)}`
    : "No active document"
}
Conversation History: ${context.conversationHistory
      .slice(-2)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")}
</context>

<reasoning_context>
Why I'm providing a direct response: ${reasoning}
</reasoning_context>

<response_guidelines>
- Respond in Korean with a professional yet friendly tone
- Provide actionable, specific advice
- If relevant, suggest next steps for document creation
- Reference document creation tools when appropriate
- Be helpful and encouraging
- If the user needs document structure, gently guide them toward creating an outline first
</response_guidelines>

Provide your response:`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: "user", content: responsePrompt }],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude API");
      }

      return content.text;
    } catch (error) {
      console.error("Error in direct response generation:", error);
      return "죄송합니다. 현재 응답을 생성하는데 문제가 발생했습니다. 다시 시도해 주세요.";
    }
  }
}

// 메인 CIARA Agent 클래스
export class CiaraAgent {
  private intentEngine: IntentAnalysisEngine;
  private planningEngine: StrategicPlanningEngine;
  private responseEngine: DirectResponseEngine;

  constructor() {
    this.intentEngine = new IntentAnalysisEngine();
    this.planningEngine = new StrategicPlanningEngine();
    this.responseEngine = new DirectResponseEngine();
  }

  async processUserRequest(
    request: UserRequest,
    options?: StreamingOptions
  ): Promise<CiaraResponse> {
    try {
      // 스트리밍 시작 신호
      if (options?.onStreamChunk) {
        options.onStreamChunk({
          label: "PROCESSING",
          content: "Analyzing user request...\n\n",
        });
      }

      // 1. 사용자 의도 분석
      const intentAnalysis = await this.intentEngine.analyzeUserIntent(
        request.message,
        request.context
      );

      if (options?.onStreamChunk) {
        options.onStreamChunk({
          label: "PROCESSING",
          content: "Creating action plan...\n\n",
        });
      }

      // 2. 전략적 계획 수립
      const actionPlan = await this.planningEngine.createActionPlan(
        intentAnalysis,
        request.context
      );

      if (options?.onStreamChunk) {
        options.onStreamChunk({
          label: "PROCESSING",
          content: "Starting execution...\n\n",
        });
      }

      // 3. 계획 실행
      const executionResult = await this.executeActionPlan(
        actionPlan,
        request,
        options
      );

      return executionResult;
    } catch (error) {
      console.error("Error in CIARA agent processing:", error);

      if (options?.onStreamChunk) {
        options.onStreamChunk({
          label: "ERROR",
          content: "Error occurred...\n\n",
        });
      }

      return {
        success: false,
        response:
          "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.",
        actionsTaken: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async executeActionPlan(
    plan: ActionPlan,
    request: UserRequest,
    options?: StreamingOptions
  ): Promise<CiaraResponse> {
    const actionResults: string[] = [];
    let allResponses: string[] = [];
    let nextSuggestions: string[] = [];

    // 도구들을 순서대로 실행
    const sortedTools = plan.toolsRequired.sort((a, b) => a.order - b.order);

    for (const toolAction of sortedTools) {
      try {
        switch (toolAction.tool) {
          case "generateIndex":
            if (options?.onStreamChunk) {
              options.onStreamChunk({
                label: "GENERATING",
                content: "Generating document index...\n\n",
              });
            }

            // documentId가 없으면 에러 처리
            if (!request.context.documentId) {
              const noDocIdError = `Document ID is missing, so the index cannot be created.`;
              allResponses.push(noDocIdError);

              if (options?.onStreamChunk) {
                options.onStreamChunk({
                  label: "ERROR",
                  content: noDocIdError + "\n\n",
                });
              }

              break;
            }

            const documentId = request.context.documentId!; // 위에서 이미 체크했으므로 안전

            const indexResult = await generateIndex({
              documentId: documentId,
              userRequest: request.message,
              userId: request.context.userId,
            });

            if (indexResult.success) {
              actionResults.push("목차 생성 완료");

              // 데이터베이스에 목차 저장 (UI에는 표시하지 않고 백그라운드에서 처리)
              try {
                await saveDocumentIndexServer(
                  documentId,
                  indexResult.generatedIndex!
                );
                actionResults.push("목차 저장 완료");
              } catch (dbError) {
                console.error("Error saving index to database:", dbError);
                // DB 저장 실패는 UI에 표시하지 않음 (백그라운드 프로세스)
              }

              // 스트리밍으로만 실제 목차 내용 전달
              if (options?.onStreamChunk) {
                options.onStreamChunk({
                  label: "INDEX_CONTENT",
                  content: `${indexResult.generatedIndex}\n\n`,
                });
              }

              nextSuggestions = [
                "특정 섹션의 내용을 작성해 달라고 요청해보세요",
                "목차 구조를 수정하거나 보완하고 싶으시면 말씀해주세요",
              ];
            } else {
              const errorMessage = `❌ 목차 생성 중 오류가 발생했습니다: ${indexResult.error}`;
              allResponses.push(errorMessage);

              if (options?.onStreamChunk) {
                options.onStreamChunk({
                  label: "ERROR",
                  content: errorMessage + "\n\n",
                });
              }

              break; // 오류 발생 시 다음 도구 실행 중단
            }
            break;

          case "generateDocument":
            if (options?.onStreamChunk) {
              options.onStreamChunk({
                label: "GENERATING",
                content: "Starting document generation...\n\n",
              });
            }

            // documentId가 없으면 에러 처리
            if (!request.context.documentId) {
              const noDocIdError = `❌ 문서 ID가 없어 문서 내용을 생성할 수 없습니다.`;
              allResponses.push(noDocIdError);

              if (options?.onStreamChunk) {
                options.onStreamChunk({
                  label: "ERROR",
                  content: noDocIdError + "\n\n",
                });
              }

              break;
            }

            const docDocumentId = request.context.documentId; // 타입 가드 후 변수에 할당

            const docResult = await generateDocument({
              documentId: docDocumentId,
              userRequest: request.message,
              userId: request.context.userId,
              additionalContext: toolAction.parameters?.additionalContext,
              onProgress: (progress) => {
                if (options?.onStreamChunk && progress.content) {
                  // 실제 생성된 내용을 스트리밍으로 전달
                  options.onStreamChunk({
                    label: "DOCUMENT_CONTENT",
                    content: `${progress.content}\n\n`,
                  });
                }
              },
            });

            if (docResult.success) {
              if (options?.onStreamChunk) {
                options.onStreamChunk({
                  label: "SUCCESS",
                  content: "문서 작성이 완료되었습니다!\n\n",
                });
              }

              actionResults.push("전체 문서 생성 완료");
              nextSuggestions = [
                "생성된 문서를 검토하고 수정하고 싶으시면 말씀해주세요",
                "특정 섹션을 더 자세히 보완하고 싶으시면 요청해주세요",
                "문서 스타일이나 톤을 조정하고 싶으시면 알려주세요",
              ];
            } else {
              const errorMessage = `❌ 문서 내용 생성 중 오류가 발생했습니다: ${docResult.error}`;
              allResponses.push(errorMessage);

              if (options?.onStreamChunk) {
                options.onStreamChunk({
                  label: "ERROR",
                  content: errorMessage + "\n\n",
                });
              }
            }
            break;

          case "directResponse":
            if (options?.onStreamChunk) {
              options.onStreamChunk({
                label: "GENERATING",
                content: "Thinking...\n\n",
              });
            }

            const directResponse =
              await this.responseEngine.generateDirectResponse(
                request.message,
                request.context,
                toolAction.reasoning
              );
            allResponses.push(directResponse);

            if (options?.onStreamChunk) {
              options.onStreamChunk({
                label: "FINAL",
                content: directResponse + "\n\n",
              });
            }

            actionResults.push("직접 상담 응답 제공");
            break;
        }
      } catch (error) {
        console.error(`Error executing ${toolAction.tool}:`, error);
        const errorMessage = `❌ ${toolAction.tool} 실행 중 오류가 발생했습니다.`;
        allResponses.push(errorMessage);

        if (options?.onStreamChunk) {
          options.onStreamChunk({
            label: "ERROR",
            content: errorMessage + "\n\n",
          });
        }
      }
    }

    // 모든 응답을 하나로 결합
    const finalResponse = allResponses.join("\n\n---\n\n");

    return {
      success: true,
      response: finalResponse,
      actionsTaken: actionResults,
      nextSuggestions,
    };
  }
}

// 스트리밍 옵션을 위한 인터페이스 추가
export interface StreamingOptions {
  onStreamChunk?: (chunk: StreamingMessage) => void;
}

// 간소화된 메시지 라벨 타입
export type MessageLabel =
  // 진행 상태
  | "PROCESSING" // 분석, 계획, 실행 시작 등 모든 사고 과정
  | "GENERATING" // 목차/문서 생성 중

  // 결과 타입
  | "INDEX_CONTENT" // 생성된 목차 내용
  | "DOCUMENT_CONTENT" // 생성된 문서 내용
  | "SUCCESS" // 완료 메시지
  | "ERROR" // 모든 에러 (일반/도구/섹션/ID누락 등)

  // 최종 응답
  | "FINAL"; // 최종 응답 (directResponse only)

// 스트리밍 메시지 구조
export interface StreamingMessage {
  label: MessageLabel;
  content: string;
  metadata?: {
    progress?: { current: number; total: number; section?: string };
    timestamp?: string;
    toolName?: string;
  };
}

// 메인 함수 - 외부에서 사용할 인터페이스 (스트리밍 지원)
export async function processWithCiara(
  request: UserRequest,
  options?: StreamingOptions
): Promise<CiaraResponse> {
  const agent = new CiaraAgent();
  return await agent.processUserRequest(request, options);
}
