import { supabase } from "./supabase";
import { getDocumentById, updateDocument } from "./documents";
import { getDocumentIndex, saveDocumentIndex } from "./index";
import { getKnowledgeByDocumentId } from "./knowledge";

// 도구 결과 인터페이스
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// 도구 매개변수 인터페이스들
export interface ReadDocumentParams {
  documentId: string;
}

export interface UpdateDocumentParams {
  documentId: string;
  content?: string;
  title?: string;
}

export interface SearchKnowledgeParams {
  documentId: string;
  query?: string;
  limit?: number;
}

export interface ReadKnowledgeFileParams {
  knowledgeId: string;
}

export interface GetOutlineParams {
  documentId: string;
}

export interface UpdateOutlineParams {
  documentId: string;
  outlineMarkdown: string;
}

export interface AnalyzeDocumentParams {
  documentId: string;
  analysisType: "structure" | "content" | "style" | "completeness";
}

// Writing Agent 도구 클래스
export class AgentTools {
  /**
   * 문서 내용을 읽는 도구
   */
  static async readDocument(params: ReadDocumentParams): Promise<ToolResult> {
    try {
      const document = await getDocumentById(params.documentId);

      if (!document) {
        return {
          success: false,
          error: "문서를 찾을 수 없습니다.",
        };
      }

      // HTML을 텍스트로 변환 (간단한 처리)
      const textContent = document.content
        .replace(/<[^>]*>/g, "") // HTML 태그 제거
        .replace(/&nbsp;/g, " ") // &nbsp; 변환
        .replace(/&amp;/g, "&") // &amp; 변환
        .replace(/&lt;/g, "<") // &lt; 변환
        .replace(/&gt;/g, ">") // &gt; 변환
        .trim();

      return {
        success: true,
        data: {
          title: document.title,
          content: document.content,
          textContent: textContent,
          wordCount: textContent.split(/\s+/).filter((word) => word.length > 0)
            .length,
          lastModified: document.last_modified,
          updatedAt: document.updated_at,
        },
        message: `문서 "${document.title}"을 성공적으로 읽었습니다. (${
          textContent.split(/\s+/).filter((word) => word.length > 0).length
        }단어)`,
      };
    } catch (error) {
      return {
        success: false,
        error: `문서 읽기 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 문서 내용을 업데이트하는 도구
   */
  static async updateDocument(
    params: UpdateDocumentParams
  ): Promise<ToolResult> {
    try {
      const updateData: any = {};
      if (params.content !== undefined) updateData.content = params.content;
      if (params.title !== undefined) updateData.title = params.title;

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: "업데이트할 내용이 없습니다.",
        };
      }

      const updatedDocument = await updateDocument(
        params.documentId,
        updateData
      );

      // 업데이트된 내용 분석
      const textContent = updatedDocument.content
        .replace(/<[^>]*>/g, "")
        .trim();
      const wordCount = textContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      return {
        success: true,
        data: {
          title: updatedDocument.title,
          contentLength: updatedDocument.content.length,
          wordCount: wordCount,
          updatedAt: updatedDocument.updated_at,
        },
        message: `문서가 성공적으로 업데이트되었습니다. (${wordCount}단어)`,
      };
    } catch (error) {
      return {
        success: false,
        error: `문서 업데이트 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 첨부된 지식 파일들을 검색하는 도구
   */
  static async searchKnowledgeFiles(
    params: SearchKnowledgeParams
  ): Promise<ToolResult> {
    try {
      const knowledgeFiles = await getKnowledgeByDocumentId(params.documentId);

      if (knowledgeFiles.length === 0) {
        return {
          success: true,
          data: [],
          message: "첨부된 지식 파일이 없습니다.",
        };
      }

      // 검색어가 있다면 파일명이나 태그로 필터링
      let filteredFiles = knowledgeFiles;
      if (params.query && params.query.trim()) {
        const query = params.query.toLowerCase();
        filteredFiles = knowledgeFiles.filter(
          (file) =>
            file.original_filename.toLowerCase().includes(query) ||
            file.tag?.toLowerCase().includes(query) ||
            file.file_type.toLowerCase().includes(query) ||
            file.mime_type.toLowerCase().includes(query)
        );
      }

      // 결과 제한
      if (params.limit && params.limit > 0) {
        filteredFiles = filteredFiles.slice(0, params.limit);
      }

      const filesSummary = filteredFiles.map((file) => ({
        id: file.id,
        filename: file.original_filename,
        fileType: file.file_type,
        mimeType: file.mime_type,
        tag: file.tag,
        size: file.file_size,
        sizeReadable: formatFileSize(file.file_size),
        createdAt: file.created_at,
        isTextFile:
          file.file_type === "text" || file.mime_type.startsWith("text/"),
      }));

      return {
        success: true,
        data: filesSummary,
        message: `${filteredFiles.length}개의 지식 파일을 찾았습니다.${
          params.query ? ` (검색어: "${params.query}")` : ""
        }`,
      };
    } catch (error) {
      return {
        success: false,
        error: `지식 파일 검색 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 특정 지식 파일의 내용을 읽는 도구
   */
  static async readKnowledgeFile(
    params: ReadKnowledgeFileParams
  ): Promise<ToolResult> {
    try {
      // 먼저 파일 정보 가져오기
      const { data: knowledgeFile, error } = await supabase
        .from("knowledge")
        .select("*")
        .eq("id", params.knowledgeId)
        .single();

      if (error || !knowledgeFile) {
        return {
          success: false,
          error: "지식 파일을 찾을 수 없습니다.",
        };
      }

      // 텍스트 파일인 경우에만 내용 읽기
      if (
        knowledgeFile.file_type === "text" ||
        knowledgeFile.mime_type.startsWith("text/")
      ) {
        try {
          // Supabase Storage에서 파일 다운로드
          const { data: fileData, error: downloadError } =
            await supabase.storage
              .from("knowledge-files")
              .download(knowledgeFile.storage_path);

          if (downloadError) {
            throw downloadError;
          }

          const text = await fileData.text();
          const wordCount = text
            .split(/\s+/)
            .filter((word) => word.length > 0).length;

          return {
            success: true,
            data: {
              filename: knowledgeFile.original_filename,
              content: text,
              fileType: knowledgeFile.file_type,
              mimeType: knowledgeFile.mime_type,
              size: knowledgeFile.file_size,
              sizeReadable: formatFileSize(knowledgeFile.file_size),
              wordCount: wordCount,
              tag: knowledgeFile.tag,
            },
            message: `파일 "${knowledgeFile.original_filename}"의 내용을 읽었습니다. (${wordCount}단어)`,
          };
        } catch (downloadError) {
          return {
            success: false,
            error: `파일 내용 읽기 오류: ${
              downloadError instanceof Error
                ? downloadError.message
                : "알 수 없는 오류"
            }`,
          };
        }
      } else {
        return {
          success: true,
          data: {
            filename: knowledgeFile.original_filename,
            fileType: knowledgeFile.file_type,
            mimeType: knowledgeFile.mime_type,
            size: knowledgeFile.file_size,
            sizeReadable: formatFileSize(knowledgeFile.file_size),
            tag: knowledgeFile.tag,
            message: "텍스트가 아닌 파일은 내용을 직접 읽을 수 없습니다.",
          },
          message: `파일 정보: ${knowledgeFile.original_filename} (${
            knowledgeFile.file_type
          }, ${formatFileSize(knowledgeFile.file_size)})`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `지식 파일 읽기 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 문서의 목차를 가져오는 도구
   */
  static async getOutline(params: GetOutlineParams): Promise<ToolResult> {
    try {
      const index = await getDocumentIndex(params.documentId);

      if (!index || !index.outline_markdown) {
        return {
          success: true,
          data: null,
          message: "문서에 목차가 없습니다.",
        };
      }

      // 목차 분석
      const lines = index.outline_markdown
        .split("\n")
        .filter((line) => line.trim());
      const headingCount = {
        h1: lines.filter((line) => line.startsWith("# ")).length,
        h2: lines.filter((line) => line.startsWith("## ")).length,
        h3: lines.filter((line) => line.startsWith("### ")).length,
      };

      return {
        success: true,
        data: {
          outlineMarkdown: index.outline_markdown,
          updatedAt: index.updated_at,
          structure: headingCount,
          totalItems: headingCount.h1 + headingCount.h2 + headingCount.h3,
        },
        message: `문서 목차를 가져왔습니다. (총 ${
          headingCount.h1 + headingCount.h2 + headingCount.h3
        }개 항목)`,
      };
    } catch (error) {
      return {
        success: false,
        error: `목차 가져오기 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 문서의 목차를 업데이트하는 도구
   */
  static async updateOutline(params: UpdateOutlineParams): Promise<ToolResult> {
    try {
      if (!params.outlineMarkdown.trim()) {
        return {
          success: false,
          error: "목차 내용이 비어있습니다.",
        };
      }

      const index = await saveDocumentIndex(
        params.documentId,
        params.outlineMarkdown
      );

      // 목차 분석
      const lines = params.outlineMarkdown
        .split("\n")
        .filter((line) => line.trim());
      const headingCount = {
        h1: lines.filter((line) => line.startsWith("# ")).length,
        h2: lines.filter((line) => line.startsWith("## ")).length,
        h3: lines.filter((line) => line.startsWith("### ")).length,
      };

      return {
        success: true,
        data: {
          outlineMarkdown: index.outline_markdown,
          updatedAt: index.updated_at,
          structure: headingCount,
          totalItems: headingCount.h1 + headingCount.h2 + headingCount.h3,
        },
        message: `문서 목차가 성공적으로 업데이트되었습니다. (총 ${
          headingCount.h1 + headingCount.h2 + headingCount.h3
        }개 항목)`,
      };
    } catch (error) {
      return {
        success: false,
        error: `목차 업데이트 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 문서를 분석하는 도구
   */
  static async analyzeDocument(
    params: AnalyzeDocumentParams
  ): Promise<ToolResult> {
    try {
      const [documentResult, outlineResult, knowledgeResult] =
        await Promise.all([
          this.readDocument({ documentId: params.documentId }),
          this.getOutline({ documentId: params.documentId }),
          this.searchKnowledgeFiles({ documentId: params.documentId }),
        ]);

      if (!documentResult.success) {
        return documentResult;
      }

      const document = documentResult.data;
      const outline = outlineResult.data;
      const knowledgeFiles = knowledgeResult.data || [];

      let analysis: any = {};

      switch (params.analysisType) {
        case "structure":
          analysis = {
            hasTitle: !!document.title && document.title.trim().length > 0,
            hasContent: document.wordCount > 0,
            hasOutline: !!outline,
            outlineItems: outline?.totalItems || 0,
            wordCount: document.wordCount,
            estimatedReadingTime: Math.ceil(document.wordCount / 200), // 분
            structureScore: calculateStructureScore(document, outline),
          };
          break;

        case "content":
          analysis = {
            wordCount: document.wordCount,
            characterCount: document.textContent.length,
            paragraphCount: document.textContent
              .split("\n\n")
              .filter((p: string) => p.trim()).length,
            sentenceCount: document.textContent
              .split(/[.!?]+/)
              .filter((s: string) => s.trim()).length,
            avgWordsPerSentence:
              Math.round(
                document.wordCount /
                  document.textContent
                    .split(/[.!?]+/)
                    .filter((s: string) => s.trim()).length
              ) || 0,
            contentDensity: document.wordCount > 0 ? "적절" : "부족",
          };
          break;

        case "completeness":
          analysis = {
            hasTitle: !!document.title && document.title.trim().length > 0,
            hasContent: document.wordCount > 0,
            hasOutline: !!outline,
            hasKnowledge: knowledgeFiles.length > 0,
            completenessScore: calculateCompletenessScore(
              document,
              outline,
              knowledgeFiles
            ),
            suggestions: generateCompletnessSuggestions(
              document,
              outline,
              knowledgeFiles
            ),
          };
          break;

        case "style":
        default:
          analysis = {
            wordCount: document.wordCount,
            avgWordLength: calculateAvgWordLength(document.textContent),
            sentenceVariety: analyzeSentenceVariety(document.textContent),
            readabilityLevel: assessReadability(document.textContent),
            toneAnalysis: "중립적", // 간단한 톤 분석
          };
          break;
      }

      return {
        success: true,
        data: {
          analysisType: params.analysisType,
          analysis: analysis,
          summary: {
            documentTitle: document.title,
            wordCount: document.wordCount,
            hasOutline: !!outline,
            knowledgeFileCount: knowledgeFiles.length,
          },
        },
        message: `문서 ${params.analysisType} 분석이 완료되었습니다.`,
      };
    } catch (error) {
      return {
        success: false,
        error: `문서 분석 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }

  /**
   * 문서의 전체 컨텍스트를 수집하는 도구
   */
  static async gatherDocumentContext(documentId: string): Promise<ToolResult> {
    try {
      const [documentResult, outlineResult, knowledgeResult] =
        await Promise.all([
          this.readDocument({ documentId }),
          this.getOutline({ documentId }),
          this.searchKnowledgeFiles({ documentId }),
        ]);

      return {
        success: true,
        data: {
          document: documentResult.data,
          outline: outlineResult.data,
          knowledgeFiles: knowledgeResult.data || [],
          summary: {
            hasDocument: documentResult.success,
            hasOutline: outlineResult.success && outlineResult.data,
            knowledgeFileCount: knowledgeResult.success
              ? knowledgeResult.data?.length || 0
              : 0,
            totalWordCount: documentResult.success
              ? documentResult.data?.wordCount || 0
              : 0,
          },
        },
        message: "문서의 전체 컨텍스트를 수집했습니다.",
      };
    } catch (error) {
      return {
        success: false,
        error: `컨텍스트 수집 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      };
    }
  }
}

// 유틸리티 함수들
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function calculateStructureScore(document: any, outline: any): number {
  let score = 0;
  if (document.title && document.title.trim()) score += 20;
  if (document.wordCount > 100) score += 30;
  if (outline) score += 25;
  if (document.wordCount > 500) score += 25;
  return Math.min(score, 100);
}

function calculateCompletenessScore(
  document: any,
  outline: any,
  knowledgeFiles: any[]
): number {
  let score = 0;
  if (document.title && document.title.trim()) score += 20;
  if (document.wordCount > 0) score += 30;
  if (outline) score += 25;
  if (knowledgeFiles.length > 0) score += 25;
  return Math.min(score, 100);
}

function generateCompletnessSuggestions(
  document: any,
  outline: any,
  knowledgeFiles: any[]
): string[] {
  const suggestions = [];
  if (!document.title || !document.title.trim())
    suggestions.push("문서 제목을 추가해보세요");
  if (document.wordCount < 100)
    suggestions.push("내용을 더 자세히 작성해보세요");
  if (!outline) suggestions.push("목차를 만들어 문서 구조를 체계화해보세요");
  if (knowledgeFiles.length === 0)
    suggestions.push("참고 자료를 첨부하여 문서의 근거를 강화해보세요");
  return suggestions;
}

function calculateAvgWordLength(text: string): number {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return 0;
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return Math.round((totalLength / words.length) * 10) / 10;
}

function analyzeSentenceVariety(text: string): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  if (sentences.length < 3) return "문장이 부족합니다";

  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) /
    lengths.length;

  if (variance > 20) return "다양함";
  if (variance > 10) return "보통";
  return "단조로움";
}

function assessReadability(text: string): string {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

  if (sentences.length === 0) return "분석 불가";

  const avgWordsPerSentence = words.length / sentences.length;

  if (avgWordsPerSentence < 10) return "쉬움";
  if (avgWordsPerSentence < 20) return "보통";
  if (avgWordsPerSentence < 30) return "어려움";
  return "매우 어려움";
}

// 도구 정의 (Agent가 이해할 수 있는 형태)
export const AGENT_TOOL_DEFINITIONS = {
  read_document: {
    name: "read_document",
    description:
      "문서의 제목과 내용을 읽습니다. 현재 작업 중인 문서의 상태를 파악할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "읽을 문서의 ID",
        },
      },
      required: ["documentId"],
    },
  },

  update_document: {
    name: "update_document",
    description:
      "문서의 내용이나 제목을 업데이트합니다. 글을 작성하거나 수정할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "업데이트할 문서의 ID",
        },
        content: {
          type: "string",
          description: "새로운 문서 내용 (HTML 형식)",
        },
        title: {
          type: "string",
          description: "새로운 문서 제목",
        },
      },
      required: ["documentId"],
    },
  },

  search_knowledge_files: {
    name: "search_knowledge_files",
    description:
      "문서에 첨부된 지식 파일들을 검색합니다. 참고 자료나 첨부 파일을 찾을 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "검색할 문서의 ID",
        },
        query: {
          type: "string",
          description:
            "검색할 키워드 (파일명, 태그, 파일 타입으로 검색). 빈 문자열이면 모든 파일 반환",
        },
        limit: {
          type: "number",
          description: "반환할 최대 파일 수",
        },
      },
      required: ["documentId"],
    },
  },

  read_knowledge_file: {
    name: "read_knowledge_file",
    description:
      "특정 지식 파일의 내용을 읽습니다. 텍스트 파일의 경우 전체 내용을 반환합니다.",
    parameters: {
      type: "object",
      properties: {
        knowledgeId: {
          type: "string",
          description: "읽을 지식 파일의 ID",
        },
      },
      required: ["knowledgeId"],
    },
  },

  get_outline: {
    name: "get_outline",
    description:
      "문서의 목차를 가져옵니다. 문서 구조를 파악하거나 목차 기반으로 글을 작성할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "목차를 가져올 문서의 ID",
        },
      },
      required: ["documentId"],
    },
  },

  update_outline: {
    name: "update_outline",
    description:
      "문서의 목차를 업데이트합니다. 새로운 목차를 생성하거나 기존 목차를 수정할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "목차를 업데이트할 문서의 ID",
        },
        outlineMarkdown: {
          type: "string",
          description:
            "마크다운 형식의 목차 내용 (예: '# 제목\n## 소제목\n### 세부제목')",
        },
      },
      required: ["documentId", "outlineMarkdown"],
    },
  },

  analyze_document: {
    name: "analyze_document",
    description:
      "문서를 다양한 관점에서 분석합니다. 구조, 내용, 스타일, 완성도 등을 평가할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "분석할 문서의 ID",
        },
        analysisType: {
          type: "string",
          enum: ["structure", "content", "style", "completeness"],
          description:
            "분석 유형: structure(구조), content(내용), style(문체), completeness(완성도)",
        },
      },
      required: ["documentId", "analysisType"],
    },
  },

  gather_document_context: {
    name: "gather_document_context",
    description:
      "문서의 전체 컨텍스트(문서 내용, 목차, 첨부 파일)를 한 번에 수집합니다. 작업 시작 전 전체 상황을 파악할 때 사용합니다.",
    parameters: {
      type: "object",
      properties: {
        documentId: {
          type: "string",
          description: "컨텍스트를 수집할 문서의 ID",
        },
      },
      required: ["documentId"],
    },
  },
};
