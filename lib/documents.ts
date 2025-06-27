import { supabase } from "./supabase";

export interface Document {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_modified: string;
}

export interface CreateDocumentData {
  id?: string;
  title: string;
  content?: string;
  user_id: string;
}

export interface UpdateDocumentData {
  title?: string;
  content?: string;
}

/**
 * 사용자의 모든 문서를 가져옵니다
 */
export async function getUserDocuments(userId: string): Promise<Document[]> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("last_modified", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getUserDocuments:", error);
    throw error;
  }
}

/**
 * 특정 문서를 ID로 가져옵니다
 */
export async function getDocumentById(
  documentId: string
): Promise<Document | null> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Document not found
        return null;
      }
      console.error("Error fetching document:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getDocumentById:", error);
    throw error;
  }
}

/**
 * 새 문서를 생성합니다
 */
export async function createDocument(
  documentData: CreateDocumentData
): Promise<Document> {
  try {
    const insertData = documentData.id 
      ? documentData 
      : { ...documentData, id: undefined }; // Let DB generate UUID if no ID provided

    const { data, error } = await supabase
      .from("documents")
      .upsert([insertData], { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createDocument:", error);
    throw error;
  }
}

/**
 * 기존 문서를 업데이트합니다
 */
export async function updateDocument(
  documentId: string,
  updateData: UpdateDocumentData
): Promise<Document> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", documentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating document:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateDocument:", error);
    throw error;
  }
}

/**
 * 문서를 삭제합니다
 */
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    throw error;
  }
}

/**
 * 문서 제목을 검색합니다
 */
export async function searchDocuments(
  userId: string,
  searchTerm: string
): Promise<Document[]> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
      .order("last_modified", { ascending: false });

    if (error) {
      console.error("Error searching documents:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchDocuments:", error);
    throw error;
  }
}

/**
 * 날짜 포맷팅 유틸리티 함수
 */
export function formatLastModified(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD 형식
}
