import { supabase } from "./supabase";

export interface KnowledgeItem {
  id: string;
  document_id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  tag?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeUpload {
  document_id: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  tag?: string;
}

// 지원되는 파일 타입 (Supabase Storage bucket 설정과 일치)
export const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const SUPPORTED_FILE_EXTENSIONS = [
  ".txt",
  ".md",
  ".csv",
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 파일 유효성 검사
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // 파일 크기 검사
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB까지 지원됩니다.`,
    };
  }

  // MIME 타입 검사
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `지원되지 않는 파일 형식입니다. 지원 형식: ${SUPPORTED_FILE_EXTENSIONS.join(
        ", "
      )}`,
    };
  }

  return { isValid: true };
}

// 파일 타입 분류
export function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/")) return "text";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  return "file";
}

// 문서의 knowledge 파일들 조회
export async function getKnowledgeByDocumentId(
  documentId: string
): Promise<KnowledgeItem[]> {
  const { data, error } = await supabase
    .from("knowledge")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching knowledge items:", error);
    throw error;
  }

  return data || [];
}

// knowledge 파일 업로드
export async function uploadKnowledgeFile(
  file: File,
  knowledgeData: KnowledgeUpload
): Promise<KnowledgeItem> {
  try {
    // 1. 파일 유효성 검사
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // 2. 현재 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("사용자 인증이 필요합니다.");
    }

    // 3. 고유 파일명 생성
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
    const storagePath = `${user.id}/${knowledgeData.document_id}/${uniqueFilename}`;

    // 4. Supabase Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("knowledge-files")
      .upload(storagePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("파일 업로드에 실패했습니다.");
    }

    // 5. 메타데이터를 knowledge 테이블에 저장
    const { data: knowledgeItem, error: dbError } = await supabase
      .from("knowledge")
      .insert({
        document_id: knowledgeData.document_id,
        user_id: user.id,
        filename: uniqueFilename,
        original_filename: knowledgeData.original_filename,
        file_type: knowledgeData.file_type,
        mime_type: knowledgeData.mime_type,
        file_size: knowledgeData.file_size,
        storage_path: storagePath,
        tag: knowledgeData.tag,
      })
      .select()
      .single();

    if (dbError) {
      // 데이터베이스 저장 실패 시 업로드된 파일 삭제
      await supabase.storage.from("knowledge-files").remove([storagePath]);

      console.error("Database insert error:", dbError);
      throw new Error("파일 정보 저장에 실패했습니다.");
    }

    return knowledgeItem;
  } catch (error) {
    console.error("Upload knowledge file error:", error);
    throw error;
  }
}

// knowledge 파일 삭제
export async function deleteKnowledgeFile(knowledgeId: string): Promise<void> {
  try {
    // 1. knowledge 정보 조회
    const { data: knowledgeItem, error: fetchError } = await supabase
      .from("knowledge")
      .select("storage_path")
      .eq("id", knowledgeId)
      .single();

    if (fetchError) {
      throw new Error("파일 정보를 찾을 수 없습니다.");
    }

    // 2. Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from("knowledge-files")
      .remove([knowledgeItem.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Storage 삭제 실패해도 메타데이터는 삭제 진행
    }

    // 3. 데이터베이스에서 메타데이터 삭제
    const { error: dbError } = await supabase
      .from("knowledge")
      .delete()
      .eq("id", knowledgeId);

    if (dbError) {
      console.error("Database delete error:", dbError);
      throw new Error("파일 정보 삭제에 실패했습니다.");
    }
  } catch (error) {
    console.error("Delete knowledge file error:", error);
    throw error;
  }
}

// knowledge 파일 다운로드 URL 생성
export async function getKnowledgeFileUrl(
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("knowledge-files")
    .createSignedUrl(storagePath, 3600); // 1시간 유효

  if (error) {
    console.error("Error creating signed URL:", error);
    throw error;
  }

  return data.signedUrl;
}

// knowledge 파일 태그 업데이트
export async function updateKnowledgeTag(
  knowledgeId: string,
  tag: string
): Promise<void> {
  const { error } = await supabase
    .from("knowledge")
    .update({ tag, updated_at: new Date().toISOString() })
    .eq("id", knowledgeId);

  if (error) {
    console.error("Error updating knowledge tag:", error);
    throw error;
  }
}
