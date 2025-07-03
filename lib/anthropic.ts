import Anthropic from "@anthropic-ai/sdk";

// 기본 메시지 타입
export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

// 기본 시스템 프롬프트
const SYSTEM_PROMPT = `You are Ciara, an intelligent writing assistant specialized in Korean content creation and editing.

CORE PRINCIPLES:
- Think step-by-step before responding
- Provide helpful, accurate, and contextual assistance
- Maintain a professional yet friendly tone
- Prioritize clarity and usefulness
- Remember and reference previous conversation context when relevant

CAPABILITIES:
- Korean writing assistance (grammar, style, structure)
- Content editing and proofreading
- Creative writing support
- Document analysis and summarization
- Research assistance
- Contextual conversation with memory of previous exchanges

RESPONSE GUIDELINES:
1. Always respond in Korean unless specifically asked otherwise
2. Reference previous conversation when relevant to provide continuity
3. For complex tasks, break down your approach first
4. Provide specific, actionable suggestions
5. Ask clarifying questions when context is unclear
6. Offer alternatives when appropriate
7. Build upon previous discussions to provide deeper insights

CONVERSATION CONTEXT:
- Pay attention to the conversation history provided
- Maintain consistency with previous advice and suggestions
- Acknowledge when you're building on or revising previous responses
- Use context to provide more personalized and relevant assistance

Remember: Your goal is to enhance the user's writing and productivity while maintaining their unique voice and intent through continuous, contextual dialogue.`;

class AiService {
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
   * 스트리밍 채팅 기능
   */
  async *chatStream(
    message: string,
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = []
  ): AsyncGenerator<string, void, unknown> {
    try {
      // 대화 히스토리와 현재 메시지를 결합
      const messages: Anthropic.Messages.MessageParam[] = [
        ...conversationHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user" as const,
          content: message,
        },
      ];

      const stream = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
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
      console.error("AI Stream Error:", error);
      yield `오류가 발생했습니다: ${
        error instanceof Error ? error.message : "AI 서비스 오류"
      }`;
    }
  }
}

// 싱글톤 인스턴스
let aiServiceInstance: AiService | null = null;

export function getAiService(): AiService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AiService();
  }
  return aiServiceInstance;
}

export default AiService;
