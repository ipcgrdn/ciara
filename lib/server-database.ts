import ServerSupabase from "./server-supabase";

// 서버용 DocumentIndex 인터페이스
export interface ServerDocumentIndex {
  id: string;
  document_id: string;
  outline_markdown: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 서버에서 문서의 목차를 생성하거나 업데이트합니다 (upsert)
 */
export async function saveDocumentIndexServer(
  documentId: string,
  outlineMarkdown: string
): Promise<ServerDocumentIndex> {
  try {
    const { data, error } = await ServerSupabase.from("index")
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
      console.error("Error saving document index (server):", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in saveDocumentIndexServer:", error);
    throw error;
  }
}

/**
 * 서버에서 특정 문서의 목차를 가져옵니다
 */
export async function getDocumentIndexServer(
  documentId: string
): Promise<ServerDocumentIndex | null> {
  try {
    const { data, error } = await ServerSupabase.from("index")
      .select("*")
      .eq("document_id", documentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Index not found
        return null;
      }
      console.error("Error fetching document index (server):", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getDocumentIndexServer:", error);
    throw error;
  }
}

/**
 * 서버에서 문서의 목차가 존재하는지 확인합니다
 */
export async function hasDocumentIndexServer(
  documentId: string
): Promise<boolean> {
  try {
    const { data, error } = await ServerSupabase.from("index")
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
    console.error("Error checking document index existence (server):", error);
    return false;
  }
}

/**
 * 서버에서 문서의 목차를 삭제합니다
 */
export async function deleteDocumentIndexServer(
  documentId: string
): Promise<void> {
  try {
    const { error } = await ServerSupabase.from("index")
      .delete()
      .eq("document_id", documentId);

    if (error) {
      console.error("Error deleting document index (server):", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteDocumentIndexServer:", error);
    throw error;
  }
}
