import ServerSupabase from "@/lib/server-supabase";
import Anthropic from "@anthropic-ai/sdk";

// Anthropic 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 타입 정의
interface Document {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_modified: string;
}

interface DocumentIndex {
  id: string;
  document_id: string;
  outline_markdown: string | null;
  created_at: string;
  updated_at: string;
}

interface GenerateIndexRequest {
  documentId: string;
  userRequest: string;
  userId: string;
}

interface GenerateIndexResponse {
  success: boolean;
  generatedIndex?: string;
  error?: string;
}

// 문서 데이터 가져오기
export async function getDocumentById(
  documentId: string
): Promise<Document | null> {
  const { data, error } = await ServerSupabase.from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch document: ${error.message}`);
  }

  return data;
}

// 문서 인덱스 가져오기
export async function getDocumentIndex(
  documentId: string
): Promise<DocumentIndex | null> {
  const { data, error } = await ServerSupabase.from("index")
    .select("*")
    .eq("document_id", documentId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch document index: ${error.message}`);
  }

  return data;
}

// Claude API 호출 함수 (Cursor 기법 적용)
async function callClaudeForIndexGeneration(
  documentTitle: string,
  documentContent: string,
  existingIndex: string | null,
  userRequest: string
): Promise<string> {
  const prompt = buildOptimizedPrompt(
    documentTitle,
    documentContent,
    existingIndex,
    userRequest
  );

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.5,
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
  } catch (error) {
    console.error("Error calling Claude API:", error);
    throw new Error(
      `Claude API failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Cursor 스타일 최적화된 프롬프트 엔지니어링
function buildOptimizedPrompt(
  documentTitle: string,
  documentContent: string,
  existingIndex: string | null,
  userRequest: string
): string {
  return `<system_context>
You are an expert document structure analyst specializing in creating logical, hierarchical outlines. You excel at analyzing content semantically and organizing information for maximum clarity and comprehension.
</system_context>

<task>
Generate a comprehensive markdown outline for the provided document. The outline should be logically structured, semantically meaningful, and directly responsive to the user's specific requirements.
</task>

<document_context>
<title>${documentTitle}</title>

<content>
${documentContent || "[EMPTY_DOCUMENT]"}
</content>

<existing_outline>
${existingIndex || "[NO_EXISTING_OUTLINE]"}
</existing_outline>

<user_requirements>
${userRequest}
</user_requirements>
</document_context>

<instructions>
1. **Semantic Analysis**: Analyze the document content to identify main themes, key concepts, and logical flow
2. **Hierarchical Structure**: Create a clear hierarchy using markdown headings (# ## ###) that supports the document's purpose
3. **User Requirements**: Prioritize and incorporate the user's specific requests while maintaining logical structure
4. **Existing Context**: If an existing outline is provided, evaluate its effectiveness and improve upon it
5. **Output Format**: Return ONLY the markdown outline with NO explanations or commentary

<formatting_rules>
- Use # for the main document title
- Use ## for major sections
- Use ### for subsections when needed for clarity
- Maintain consistent heading hierarchy
- Keep section titles concise but descriptive
- Ensure each section serves a clear structural purpose
</formatting_rules>
</instructions>

<quality_criteria>
- Logical flow from introduction to conclusion
- Balanced section distribution (not too granular, not too broad)
- Clear semantic relationships between sections
- Scannable and intuitive structure
- Directly addresses user requirements
</quality_criteria>

<response_format>
Return the markdown outline exactly as it should appear, starting with the main title and following the hierarchical structure. Do not include any explanations, comments, or metadata. 
</response_format>

Generate the outline now:`;
}

// Claude 응답 정리 함수 (Cursor 스타일)
function cleanClaudeResponse(response: string): string {
  // 마크다운 헤딩으로 시작하는 라인들만 추출
  const lines = response.split("\n");
  const markdownLines: string[] = [];
  let foundFirstHeading = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // 첫 번째 헤딩을 찾은 후 모든 라인 포함
    if (trimmed.startsWith("#")) {
      foundFirstHeading = true;
      markdownLines.push(line);
    } else if (foundFirstHeading) {
      markdownLines.push(line);
    }
  }

  const result = markdownLines.join("\n").trim();

  if (!result || !result.includes("#")) {
    throw new Error("No valid markdown outline found in Claude response");
  }

  return result;
}

// 메인 함수
export async function generateIndex(
  request: GenerateIndexRequest
): Promise<GenerateIndexResponse> {
  try {
    const { documentId, userRequest, userId } = request;

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

    // 3. 기존 index 가져오기
    const existingIndex = await getDocumentIndex(documentId);

    // 4. AI를 이용한 목차 생성
    const rawResponse = await callClaudeForIndexGeneration(
      document.title,
      document.content,
      existingIndex?.outline_markdown || null,
      userRequest
    );

    // 5. 응답 정리
    const generatedIndex = cleanClaudeResponse(rawResponse);

    return {
      success: true,
      generatedIndex: generatedIndex,
    };
  } catch (error) {
    console.error("Error in generateIndex:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "목차 생성 중 알 수 없는 오류가 발생했습니다.",
    };
  }
}
