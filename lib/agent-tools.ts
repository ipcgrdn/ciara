import { supabase } from "./supabase";
import {
  getDocumentById,
  updateDocument,
  type UpdateDocumentData,
} from "./documents";
import { getDocumentIndex, saveDocumentIndex } from "./index";
import { getKnowledgeByDocumentId } from "./knowledge";

// 파일 파싱 라이브러리들 (동적 import로 사용)
// import * as pdfParse from "pdf-parse";
// import * as mammoth from "mammoth";

// 도구 결과 베이스 인터페이스
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
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

// 도구 결과 데이터 타입들
export interface DocumentData {
  title: string;
  content: string;
  lastModified: string;
}

export interface UpdatedDocumentData {
  title: string;
  contentLength: number;
}

export interface KnowledgeFileData {
  id: string;
  filename: string;
  fileType: string;
  tag?: string;
  size: number;
  createdAt: string;
}

export interface KnowledgeFileContentData {
  filename: string;
  content?: string;
  fileType: string;
  size: number;
  message?: string;
}

export interface OutlineData {
  outlineMarkdown: string;
  updatedAt: string;
}

export interface DocumentContextData {
  document: DocumentData | null;
  outline: OutlineData | null;
  knowledgeFiles: KnowledgeFileData[];
  summary: {
    hasDocument: boolean;
    hasOutline: boolean;
    knowledgeFileCount: number;
  };
}

/**
 * Writing Agent가 사용할 도구 클래스
 */
export class AgentTools {
  /**
   * 문서 내용을 읽는 도구
   */
  static async readDocument(
    params: ReadDocumentParams
  ): Promise<ToolResult<DocumentData>> {
    try {
      const document = await getDocumentById(params.documentId);

      if (!document) {
        return {
          success: false,
          error: "문서를 찾을 수 없습니다.",
        };
      }

      return {
        success: true,
        data: {
          title: document.title,
          content: document.content,
          lastModified: document.last_modified,
        },
        message: `문서 "${document.title}"을 성공적으로 읽었습니다.`,
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
  ): Promise<ToolResult<UpdatedDocumentData>> {
    try {
      const updateData: UpdateDocumentData = {};
      if (params.content !== undefined) updateData.content = params.content;
      if (params.title !== undefined) updateData.title = params.title;

      const updatedDocument = await updateDocument(
        params.documentId,
        updateData
      );

      return {
        success: true,
        data: {
          title: updatedDocument.title,
          contentLength: updatedDocument.content.length,
        },
        message: `문서가 성공적으로 업데이트되었습니다.`,
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
  ): Promise<ToolResult<KnowledgeFileData[]>> {
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
      if (params.query) {
        const query = params.query.toLowerCase();
        filteredFiles = knowledgeFiles.filter(
          (file) =>
            file.original_filename.toLowerCase().includes(query) ||
            file.tag?.toLowerCase().includes(query) ||
            file.file_type.toLowerCase().includes(query)
        );
      }

      // 결과 제한
      if (params.limit && params.limit > 0) {
        filteredFiles = filteredFiles.slice(0, params.limit);
      }

      const result: KnowledgeFileData[] = filteredFiles.map((file) => ({
        id: file.id,
        filename: file.original_filename,
        fileType: file.file_type,
        tag: file.tag,
        size: file.file_size,
        createdAt: file.created_at,
      }));

      return {
        success: true,
        data: result,
        message: `${filteredFiles.length}개의 지식 파일을 찾았습니다.`,
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
  ): Promise<ToolResult<KnowledgeFileContentData>> {
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

          return {
            success: true,
            data: {
              filename: knowledgeFile.original_filename,
              content: text,
              fileType: knowledgeFile.file_type,
              size: knowledgeFile.file_size,
            },
            message: `파일 "${knowledgeFile.original_filename}"의 내용을 읽었습니다.`,
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
            size: knowledgeFile.file_size,
            message: "텍스트가 아닌 파일은 내용을 직접 읽을 수 없습니다.",
          },
          message: `파일 정보: ${knowledgeFile.original_filename} (${knowledgeFile.file_type})`,
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
  static async getOutline(
    params: GetOutlineParams
  ): Promise<ToolResult<OutlineData | null>> {
    try {
      const index = await getDocumentIndex(params.documentId);

      if (!index || !index.outline_markdown) {
        return {
          success: true,
          data: null,
          message: "문서에 목차가 없습니다.",
        };
      }

      return {
        success: true,
        data: {
          outlineMarkdown: index.outline_markdown,
          updatedAt: index.updated_at,
        },
        message: "문서 목차를 성공적으로 가져왔습니다.",
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
  static async updateOutline(
    params: UpdateOutlineParams
  ): Promise<ToolResult<OutlineData>> {
    try {
      const index = await saveDocumentIndex(
        params.documentId,
        params.outlineMarkdown
      );

      return {
        success: true,
        data: {
          outlineMarkdown: index.outline_markdown || "",
          updatedAt: index.updated_at,
        },
        message: "문서 목차가 성공적으로 업데이트되었습니다.",
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
   * 문서의 전체 컨텍스트를 수집하는 도구
   */
  static async gatherDocumentContext(
    documentId: string
  ): Promise<ToolResult<DocumentContextData>> {
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
          document: documentResult.data || null,
          outline: outlineResult.data || null,
          knowledgeFiles: knowledgeResult.data || [],
          summary: {
            hasDocument: documentResult.success && !!documentResult.data,
            hasOutline: outlineResult.success && !!outlineResult.data,
            knowledgeFileCount: knowledgeResult.success
              ? knowledgeResult.data?.length || 0
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

// Agent가 이해할 수 있는 도구 정의 스키마
export const AGENT_TOOL_SCHEMAS = {
  read_document: {
    name: "read_document",
    description:
      "문서의 제목과 내용을 읽습니다. 현재 작업 중인 문서의 상태를 파악할 때 사용합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string" as const,
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
    input_schema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string" as const,
          description: "업데이트할 문서의 ID",
        },
        content: {
          type: "string" as const,
          description: "새로운 문서 내용 (HTML 형식)",
        },
        title: {
          type: "string" as const,
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
    input_schema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string" as const,
          description: "검색할 문서의 ID",
        },
        query: {
          type: "string" as const,
          description: "검색할 키워드 (파일명, 태그, 파일 타입으로 검색)",
        },
        limit: {
          type: "number" as const,
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
    input_schema: {
      type: "object" as const,
      properties: {
        knowledgeId: {
          type: "string" as const,
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
    input_schema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string" as const,
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
    input_schema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string" as const,
          description: "목차를 업데이트할 문서의 ID",
        },
        outlineMarkdown: {
          type: "string" as const,
          description: "마크다운 형식의 목차 내용",
        },
      },
      required: ["documentId", "outlineMarkdown"],
    },
  },

  gather_document_context: {
    name: "gather_document_context",
    description:
      "문서의 전체 컨텍스트(문서 내용, 목차, 첨부 파일)를 한 번에 수집합니다. 작업 시작 전 전체 상황을 파악할 때 사용합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        documentId: {
          type: "string" as const,
          description: "컨텍스트를 수집할 문서의 ID",
        },
      },
      required: ["documentId"],
    },
  },
} as const;

// 도구 실행을 위한 유틸리티 함수
function validateAndExecuteTool(
  toolName: keyof typeof AGENT_TOOL_SCHEMAS,
  params: Record<string, unknown>
): Promise<ToolResult> {
  switch (toolName) {
    case "read_document":
      if (typeof params.documentId === "string") {
        return AgentTools.readDocument({ documentId: params.documentId });
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: documentId가 필요합니다.",
      });

    case "update_document":
      if (typeof params.documentId === "string") {
        const updateParams: UpdateDocumentParams = {
          documentId: params.documentId,
        };
        if (typeof params.content === "string")
          updateParams.content = params.content;
        if (typeof params.title === "string") updateParams.title = params.title;
        return AgentTools.updateDocument(updateParams);
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: documentId가 필요합니다.",
      });

    case "search_knowledge_files":
      if (typeof params.documentId === "string") {
        const searchParams: SearchKnowledgeParams = {
          documentId: params.documentId,
        };
        if (typeof params.query === "string") searchParams.query = params.query;
        if (typeof params.limit === "number") searchParams.limit = params.limit;
        return AgentTools.searchKnowledgeFiles(searchParams);
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: documentId가 필요합니다.",
      });

    case "read_knowledge_file":
      if (typeof params.knowledgeId === "string") {
        return AgentTools.readKnowledgeFile({
          knowledgeId: params.knowledgeId,
        });
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: knowledgeId가 필요합니다.",
      });

    case "get_outline":
      if (typeof params.documentId === "string") {
        return AgentTools.getOutline({ documentId: params.documentId });
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: documentId가 필요합니다.",
      });

    case "update_outline":
      if (
        typeof params.documentId === "string" &&
        typeof params.outlineMarkdown === "string"
      ) {
        return AgentTools.updateOutline({
          documentId: params.documentId,
          outlineMarkdown: params.outlineMarkdown,
        });
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: documentId와 outlineMarkdown이 필요합니다.",
      });

    case "gather_document_context":
      if (typeof params.documentId === "string") {
        return AgentTools.gatherDocumentContext(params.documentId);
      }
      return Promise.resolve({
        success: false,
        error: "잘못된 매개변수: documentId가 필요합니다.",
      });

    default:
      return Promise.resolve({
        success: false,
        error: `알 수 없는 도구: ${toolName}`,
      });
  }
}
export const executeAgentTool = validateAndExecuteTool;
