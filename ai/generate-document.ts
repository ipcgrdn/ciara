import Anthropic from "@anthropic-ai/sdk";
import { getDocumentById, getDocumentIndex } from "./generate-index";

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GenerateDocumentRequest {
  documentId: string;
  userRequest: string;
  userId: string;
  additionalContext?: string; // 추가적인 컨텍스트 정보
  onProgress?: (progress: {
    current: number;
    total: number;
    section: string;
    content?: string;
  }) => void; // 진행상황 콜백
}

interface GenerateDocumentResponse {
  success: boolean;
  generatedContent?: string;
  targetSection?: string;
  error?: string;
}

// Claude API 호출 함수 (문서 내용 생성)
async function callClaudeForDocumentGeneration(
  documentTitle: string,
  documentContent: string,
  fullIndex: string,
  targetIndexSection: string,
  userRequest: string,
  additionalContext?: string
): Promise<string> {
  const prompt = buildOptimizedDocumentPrompt(
    documentTitle,
    documentContent,
    fullIndex,
    targetIndexSection,
    userRequest,
    additionalContext
  );

  // Rate Limit 대응을 위한 재시도 설정
  const maxRetries = 3;
  const baseDelay = 1000; // 1초

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude API");
      }

      return content.text;
    } catch (error: any) {
      console.error(
        `Claude API 호출 시도 ${attempt}/${maxRetries} 실패:`,
        error
      );

      // Rate Limit 오류인지 확인
      const isRateLimit =
        error?.status === 429 || 
        error?.message?.includes("rate limit") ||
        error?.message?.includes("Too Many Requests");

      if (isRateLimit && attempt < maxRetries) {
        // 지수 백오프로 대기 시간 계산
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // 최대 재시도 횟수 초과하거나 다른 오류인 경우
      throw new Error(
        `Claude API failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  throw new Error("모든 재시도 시도가 실패했습니다.");
}

// 문서 생성을 위한 최적화된 프롬프트 엔지니어링 (Cursor AI 기법 적용)
function buildOptimizedDocumentPrompt(
  documentTitle: string,
  documentContent: string,
  fullIndex: string,
  targetIndexSection: string,
  userRequest: string,
  additionalContext?: string
): string {
  return `<system_context>
You are an expert content writer and professional document specialist with deep expertise in creating publication-quality content. You excel at semantic analysis, logical structuring, and producing coherent narrative flow that integrates seamlessly with existing document frameworks. Your writing demonstrates mastery of various document genres, from technical documentation to academic papers, business reports, and creative content.
</system_context>

<task>
Generate comprehensive, publication-ready content for a specific document section. The content must be semantically rich, well-researched, and demonstrate sophisticated understanding of the subject matter while maintaining perfect consistency with the document's existing structure and tone.
</task>

<document_context>
<document_title>${documentTitle}</document_title>

<existing_document_content>
${documentContent || "[EMPTY_DOCUMENT - NO EXISTING CONTENT]"}
</existing_document_content>

<complete_document_outline>
${fullIndex || "[NO_OUTLINE_STRUCTURE_AVAILABLE]"}
</complete_document_outline>

<target_writing_section>
${targetIndexSection}
</target_writing_section>

<user_specific_requirements>
${userRequest}
</user_specific_requirements>

${
  additionalContext
    ? `<additional_context_information>\n${additionalContext}\n</additional_context_information>`
    : ""
}
</document_context>

<content_generation_methodology>
**Semantic Analysis Protocol**: Analyze the target section's role within the complete document hierarchy. Identify key themes, conceptual relationships, and required depth of coverage based on section positioning.

**Content Architecture**: Structure information using professional writing techniques that enhance readability and comprehension. Apply appropriate cognitive load management through strategic information organization.

**Contextual Integration**: Ensure seamless integration with existing content by maintaining consistent terminology, referencing patterns, and narrative voice throughout the section.

**Quality Assurance**: Apply publication-standard quality criteria including logical flow verification, factual consistency checks, and stylistic coherence validation.
</content_generation_methodology>

<advanced_formatting_guidelines>
**Rich Document Structure**: Utilize diverse markdown formatting techniques beyond basic headings:
- Employ strategic paragraph spacing for visual breathing room
- Use blockquotes for emphasis, citations, or highlighting key concepts
- Integrate tables when presenting comparative data or structured information
- Apply inline code formatting for technical terms or specific references
- Utilize horizontal rules sparingly for major topic transitions
- Leverage emphasis (bold/italic) strategically for key concepts and important distinctions

**Professional Writing Techniques**:
- Craft compelling opening sentences that establish context and direction
- Develop coherent paragraph structures with clear topic sentences
- Use transitional phrases to create smooth flow between ideas
- Employ varied sentence structures to maintain reader engagement
- Include relevant examples, case studies, or practical applications where appropriate
- Apply appropriate technical depth based on section requirements and target audience

**Content Enrichment Standards**:
- Minimize heading-heavy structures in favor of natural prose flow
- Integrate information organically rather than forcing rigid structural divisions
- Use descriptive language that enhances understanding without unnecessary complexity
- Include contextual explanations that bridge knowledge gaps
- Apply consistent voice and perspective throughout the section
</advanced_formatting_guidelines>

<output_excellence_criteria>
**Professional Standards**: Content must meet publication-quality standards with sophisticated vocabulary, varied sentence structures, and engaging narrative flow.

**Structural Integrity**: Perfect integration with existing document architecture while maintaining independent section coherence.

**Comprehensive Coverage**: Thorough exploration of section topic with appropriate depth, supporting details, and practical relevance.

**User Alignment**: Direct responsiveness to specific user requirements while maintaining professional writing standards.

**Technical Proficiency**: Demonstrate subject matter expertise through accurate information, proper terminology usage, and insightful analysis.
</output_excellence_criteria>

<critical_constraints>
AVOID: Excessive heading subdivisions that fragment content flow
AVOID: Generic placeholder content or superficial treatment of topics
AVOID: Inconsistent terminology or tone shifts within the section
AVOID: Repetitive sentence patterns or monotonous structural approaches

ENSURE: Rich, substantive content that adds genuine value to the document
ENSURE: Seamless integration with existing content and overall document purpose
ENSURE: Professional presentation suitable for target audience and document type
</critical_constraints>

<response_specification>
Generate the complete section content using sophisticated markdown formatting. Begin with the exact target section heading as provided, then develop comprehensive content using advanced document writing techniques. The output should be immediately insertable into the document without requiring additional editing or formatting adjustments.
</response_specification>

Proceed with content generation:`;
}

// Claude 응답 정리 함수
function cleanClaudeDocumentResponse(response: string): string {
  // 응답을 정리하되, 문서 내용이므로 더 유연하게 처리
  const trimmed = response.trim();

  if (!trimmed) {
    throw new Error("No content generated by Claude");
  }

  // 메타데이터나 시스템 메시지 제거
  const lines = trimmed.split("\n");
  const contentLines: string[] = [];
  let foundContent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 시스템 메시지나 메타데이터로 보이는 라인 스킵
    if (trimmedLine.startsWith("<") && trimmedLine.endsWith(">")) {
      continue;
    }

    // 실제 콘텐츠 시작을 감지
    if (trimmedLine.startsWith("#") || trimmedLine.length > 0) {
      foundContent = true;
    }

    if (foundContent) {
      contentLines.push(line);
    }
  }

  const result = contentLines.join("\n").trim();

  if (!result) {
    throw new Error("No valid content found in Claude response");
  }

  return result;
}

// 목차에서 섹션들을 파싱하는 함수
function parseIndexSections(indexMarkdown: string): string[] {
  const sections: string[] = [];
  const lines = indexMarkdown.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    // ## 형태의 메인 섹션만 추출 (### 이상의 하위 섹션 제외)
    if (trimmedLine.match(/^##\s+(?!#)/)) {
      sections.push(trimmedLine);
    }
  }

  return sections;
}
// 메인 함수
export async function generateDocument(
  request: GenerateDocumentRequest
): Promise<GenerateDocumentResponse> {
  try {
    const { documentId, userRequest, userId, additionalContext, onProgress } =
      request;

    // 1. 문서 데이터 가져오기
    const document = await getDocumentById(documentId);
    if (!document) {
      return {
        success: false,
        error: "문서를 찾을 수 없습니다.",
      };
    }

    // 2. 권한 확인
    if (document.user_id !== userId) {
      return {
        success: false,
        error: "문서에 접근할 권한이 없습니다.",
      };
    }

    // 3. 문서 인덱스 가져오기
    const documentIndex = await getDocumentIndex(documentId);

    if (!documentIndex?.outline_markdown) {
      return {
        success: false,
        error:
          "문서의 인덱스를 찾을 수 없습니다. 먼저 문서 인덱스를 생성해주세요.",
      };
    }

    // 4. 목차에서 섹션들 파싱
    const sections = parseIndexSections(documentIndex.outline_markdown);

    if (sections.length === 0) {
      return {
        success: false,
        error: "처리할 수 있는 섹션을 찾을 수 없습니다.",
      };
    }

    // 5. 각 섹션을 순차적으로 생성
    let accumulatedContent = document.content || "";
    const generatedSections: string[] = [];

    for (let i = 0; i < sections.length; i++) {
      const currentSection = sections[i];

      // 진행상황 콜백 호출
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: sections.length,
          section: currentSection,
        });
      }

      try {
        // Rate Limit 방지를 위해 섹션 간 지연 시간 추가
        if (i > 0) {
          console.log(`섹션 ${i + 1} 생성 전 1초 대기...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // AI를 이용한 섹션 내용 생성
        const rawResponse = await callClaudeForDocumentGeneration(
          document.title,
          accumulatedContent,
          documentIndex.outline_markdown,
          currentSection,
          userRequest,
          additionalContext
        );

        // 응답 정리
        const sectionContent = cleanClaudeDocumentResponse(rawResponse);
        generatedSections.push(sectionContent);

        // 누적 문서 내용에 추가
        accumulatedContent +=
          (accumulatedContent ? "\n\n" : "") + sectionContent;

        // 진행상황 콜백에 생성된 내용 포함
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: sections.length,
            section: currentSection,
            content: sectionContent,
          });
        }
      } catch (sectionError) {
        console.error(`Error generating section ${i + 1}:`, sectionError);
        // 섹션 생성 실패 시에도 계속 진행 (부분 완성 허용)
        const errorMessage = `❌ 섹션 "${currentSection}" 생성 중 오류 발생: ${
          sectionError instanceof Error ? sectionError.message : "Unknown error"
        }`;
        generatedSections.push(errorMessage);

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: sections.length,
            section: currentSection,
            content: errorMessage,
          });
        }
      }
    }

    return {
      success: true,
      generatedContent: generatedSections.join("\n\n"),
      targetSection: `전체 문서 (${sections.length}개 섹션)`,
    };
  } catch (error) {
    console.error("Error in generateDocument:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "문서 내용 생성 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}
