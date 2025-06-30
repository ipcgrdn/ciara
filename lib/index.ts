import { supabase } from "./supabase";

export interface DocumentIndex {
  id: string;
  document_id: string;
  outline_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIndexData {
  document_id: string;
  outline_markdown: string;
}

export interface UpdateIndexData {
  outline_markdown: string;
}

export interface OutlineItem {
  id: string;
  level: number;
  title: string;
}

/**
 * 특정 문서의 목차를 가져옵니다
 */
export async function getDocumentIndex(
  documentId: string
): Promise<DocumentIndex | null> {
  try {
    const { data, error } = await supabase
      .from("index")
      .select("*")
      .eq("document_id", documentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Index not found
        return null;
      }
      console.error("Error fetching document index:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getDocumentIndex:", error);
    throw error;
  }
}

/**
 * 문서의 목차를 생성하거나 업데이트합니다 (upsert)
 */
export async function saveDocumentIndex(
  documentId: string,
  outlineMarkdown: string
): Promise<DocumentIndex> {
  try {
    const { data, error } = await supabase
      .from("index")
      .upsert(
        {
          document_id: documentId,
          outline_markdown: outlineMarkdown,
        },
        {
          onConflict: "document_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving document index:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveDocumentIndex:", error);
    throw error;
  }
}

/**
 * 문서의 목차를 삭제합니다
 */
export async function deleteDocumentIndex(documentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("index")
      .delete()
      .eq("document_id", documentId);

    if (error) {
      console.error("Error deleting document index:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteDocumentIndex:", error);
    throw error;
  }
}

/**
 * 마크다운을 OutlineItem 배열로 파싱합니다
 * baseSeed를 사용하여 동일한 마크다운에 대해 일관된 ID를 생성합니다
 */
export function parseMarkdownToOutline(markdown: string, baseSeed?: number): OutlineItem[] {
  if (!markdown.trim()) return [];

  const lines = markdown.split("\n");
  const items: OutlineItem[] = [];
  const seed = baseSeed || Math.floor(Math.random() * 1000000);

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("# ")) {
      items.push({
        id: `outline-${seed}-${index}`,
        level: 1,
        title: trimmedLine
          .replace(/^# (\d+\.\s*)?/, "")
          .replace(/\s*\([^)]*\)$/, "")
          .trim(),
      });
    } else if (trimmedLine.startsWith("## ")) {
      items.push({
        id: `outline-${seed}-${index}`,
        level: 2,
        title: trimmedLine
          .replace(/^## (\d+\.\d+\s*)?/, "")
          .replace(/\s*\([^)]*\)$/, "")
          .trim(),
      });
    } else if (trimmedLine.startsWith("### ")) {
      items.push({
        id: `outline-${seed}-${index}`,
        level: 3,
        title: trimmedLine
          .replace(/^### (\d+\.\d+\.\d+\s*)?/, "")
          .replace(/\s*\([^)]*\)$/, "")
          .trim(),
      });
    }
  });

  return items;
}

/**
 * OutlineItem 배열을 마크다운으로 변환합니다
 */
export function outlineToMarkdown(outline: OutlineItem[]): string {
  return outline
    .map((item) => {
      const prefix = "#".repeat(item.level);
      return `${prefix} ${item.title}`;
    })
    .join("\n\n");
}

/**
 * 문서의 목차가 존재하는지 확인합니다
 */
export async function hasDocumentIndex(documentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("index")
      .select("id")
      .eq("document_id", documentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking document index existence:", error);
    return false;
  }
}

/**
 * 여러 문서의 목차를 한 번에 가져옵니다
 */
export async function getMultipleDocumentIndexes(
  documentIds: string[]
): Promise<DocumentIndex[]> {
  try {
    const { data, error } = await supabase
      .from("index")
      .select("*")
      .in("document_id", documentIds);

    if (error) {
      console.error("Error fetching multiple document indexes:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getMultipleDocumentIndexes:", error);
    throw error;
  }
}

/**
 * 목차에서 특정 레벨의 항목만 추출합니다
 */
export function filterOutlineByLevel(
  outline: OutlineItem[],
  level: number
): OutlineItem[] {
  return outline.filter((item) => item.level === level);
}

/**
 * 목차의 총 항목 수를 반환합니다
 */
export function getOutlineItemCount(markdown: string): number {
  const outline = parseMarkdownToOutline(markdown);
  return outline.length;
}

/**
 * 빈 목차인지 확인합니다
 */
export function isEmptyOutline(markdown: string | null): boolean {
  if (!markdown) return true;
  const outline = parseMarkdownToOutline(markdown);
  return outline.length === 0;
}
