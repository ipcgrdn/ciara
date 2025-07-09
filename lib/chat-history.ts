import { supabase } from "./supabase";

// 대화 히스토리 관련 타입 정의
export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  // 스트리밍 메시지 지원을 위한 필드 추가
  label?:
    | "PROCESSING"
    | "GENERATING"
    | "INDEX_CONTENT"
    | "DOCUMENT_CONTENT"
    | "SUCCESS"
    | "ERROR"
    | "FINAL"
    | "STOPPED";
  metadata?: {
    progress?: { current: number; total: number; section?: string };
    timestamp?: string;
    toolName?: string;
    streamingHistory?: Array<{
      label?: string;
      content: string;
      metadata?: ChatMessage["metadata"];
    }>;
  };
  isStreaming?: boolean; // 스트리밍 중인지 여부
}

export interface ChatSession {
  id: string;
  document_id: string;
  user_id: string;
  title: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

// 대화 히스토리 관리 서비스
export class ChatHistoryService {
  /**
   * 문서의 현재 활성 세션 조회
   */
  static async getCurrentActiveSession(
    documentId: string,
    userId: string
  ): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned - 정상적인 경우 (활성 세션이 없음)
          return null;
        }
        console.error("Error fetching active session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching active session:", error);
      return null;
    }
  }

  /**
   * 첫 메시지를 기반으로 스마트 제목 생성 (API 호출)
   */
  static async generateSessionTitle(firstMessage: string): Promise<string> {
    try {
      const response = await fetch("/api/ai/generate-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: firstMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate title");
      }

      const { title } = await response.json();
      return title || `새로운 대화 ${new Date().toLocaleDateString()}`;
    } catch (error) {
      console.error("Error generating session title:", error);
      return `새로운 대화 ${new Date().toLocaleDateString()}`;
    }
  }

  /**
   * 새로운 대화 세션 생성
   */
  static async createSession(
    documentId: string,
    userId: string,
    title: string
  ): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          document_id: documentId,
          user_id: userId,
          title: title,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating chat session:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating chat session:", error);
      return null;
    }
  }

  /**
   * 메시지 저장 및 세션 자동 생성
   */
  static async saveMessage(
    documentId: string,
    userId: string,
    type: "user" | "assistant",
    content: string,
    sessionId?: string,
    streamingData?: {
      label?: ChatMessage["label"];
      metadata?: ChatMessage["metadata"];
      isStreaming?: boolean;
    }
  ): Promise<{ message: ChatMessage | null; session: ChatSession | null }> {
    try {
      let currentSession: ChatSession | null = null;

      // 세션 ID가 제공되면 해당 세션 사용, 아니면 활성 세션 찾기
      if (sessionId) {
        const { data } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();
        currentSession = data;
      } else {
        currentSession = await this.getCurrentActiveSession(documentId, userId);
      }

      // 세션이 없고 사용자 메시지인 경우 새 세션 생성
      if (!currentSession && type === "user") {
        const title = await this.generateSessionTitle(content);
        currentSession = await this.createSession(documentId, userId, title);

        if (!currentSession) {
          return { message: null, session: null };
        }
      }

      // 세션이 여전히 없으면 에러
      if (!currentSession) {
        console.error("No session available for saving message");
        return { message: null, session: null };
      }

      // 메시지 저장
      const insertData: {
        session_id: string;
        type: "user" | "assistant";
        content: string;
        streaming_metadata?: {
          label?: string;
          metadata?: ChatMessage["metadata"];
          isStreaming?: boolean;
        };
      } = {
        session_id: currentSession.id,
        type,
        content,
      };

      // 스트리밍 메타데이터가 있으면 추가 (JSONB 형태로 저장)
      if (streamingData) {
        insertData.streaming_metadata = {
          label: streamingData.label,
          metadata: streamingData.metadata,
          isStreaming: streamingData.isStreaming || false,
        };
      }

      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .insert(insertData)
        .select()
        .single();

      if (messageError) {
        console.error("Error saving chat message:", messageError);
        return { message: null, session: currentSession };
      }

      // 세션의 updated_at 업데이트
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", currentSession.id);

      const message: ChatMessage = {
        id: messageData.id,
        type: messageData.type,
        content: messageData.content,
        timestamp: messageData.created_at,
      };

      // 스트리밍 메타데이터가 있으면 복원
      if (messageData.streaming_metadata) {
        try {
          const streamingMeta = messageData.streaming_metadata;
          message.label = streamingMeta.label;
          message.metadata = streamingMeta.metadata;
          message.isStreaming = false; // 저장된 메시지는 항상 완료된 상태
        } catch (error) {
          console.warn("Failed to parse streaming metadata:", error);
        }
      }

      return { message, session: currentSession };
    } catch (error) {
      console.error("Error saving message:", error);
      return { message: null, session: null };
    }
  }

  /**
   * 세션의 모든 메시지 조회
   */
  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching session messages:", error);
        return [];
      }

      return data.map((msg) => {
        const message: ChatMessage = {
          id: msg.id,
          type: msg.type,
          content: msg.content,
          timestamp: msg.created_at,
        };

        // 스트리밍 메타데이터가 있으면 복원
        if (msg.streaming_metadata) {
          try {
            const streamingMeta = msg.streaming_metadata;
            message.label = streamingMeta.label;
            message.metadata = streamingMeta.metadata;
            message.isStreaming = false; // 저장된 메시지는 항상 완료된 상태
          } catch (error) {
            console.warn("Failed to parse streaming metadata:", error);
          }
        }

        return message;
      });
    } catch (error) {
      console.error("Error fetching session messages:", error);
      return [];
    }
  }

  /**
   * 문서별 대화 세션 목록 조회
   */
  static async getDocumentSessions(
    documentId: string,
    userId: string
  ): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching document sessions:", error);
        return [];
      }

      return data;
    } catch (error) {
      console.error("Error fetching document sessions:", error);
      return [];
    }
  }

  /**
   * 현재 활성 세션을 archived로 변경하고 새 대화 준비
   */
  static async startNewChat(
    documentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ status: "archived" })
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) {
        console.error("Error archiving current session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error starting new chat:", error);
      return false;
    }
  }

  /**
   * 세션 제목 업데이트
   */
  static async updateSessionTitle(
    sessionId: string,
    newTitle: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({
          title: newTitle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating session title:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error updating session title:", error);
      return false;
    }
  }

  /**
   * 세션 삭제
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        console.error("Error deleting session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  /**
   * 스트리밍 메시지 저장 (실시간 업데이트용)
   */
  static async saveStreamingMessage(
    sessionId: string,
    type: "user" | "assistant",
    content: string,
    label?: ChatMessage["label"],
    metadata?: ChatMessage["metadata"]
  ): Promise<ChatMessage | null> {
    try {
      const insertData: {
        session_id: string;
        type: "user" | "assistant";
        content: string;
        streaming_metadata?: {
          label?: string;
          metadata?: ChatMessage["metadata"];
          isStreaming?: boolean;
        };
      } = {
        session_id: sessionId,
        type,
        content,
      };

      // 스트리밍 메타데이터 추가
      if (label || metadata) {
        insertData.streaming_metadata = {
          label,
          metadata,
          isStreaming: true,
        };
      }

      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .insert(insertData)
        .select()
        .single();

      if (messageError) {
        console.error("Error saving streaming message:", messageError);
        return null;
      }

      // 세션의 updated_at 업데이트
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      const message: ChatMessage = {
        id: messageData.id,
        type: messageData.type,
        content: messageData.content,
        timestamp: messageData.created_at,
        label,
        metadata,
        isStreaming: true,
      };

      return message;
    } catch (error) {
      console.error("Error saving streaming message:", error);
      return null;
    }
  }

  /**
   * 스트리밍 메시지 업데이트
   */
  static async updateStreamingMessage(
    messageId: string,
    content: string,
    label?: ChatMessage["label"],
    metadata?: ChatMessage["metadata"],
    isCompleted: boolean = false
  ): Promise<ChatMessage | null> {
    try {
      const updateData: {
        content: string;
        streaming_metadata?: {
          label?: string;
          metadata?: ChatMessage["metadata"];
          isStreaming?: boolean;
        };
      } = {
        content,
      };

      // 스트리밍 메타데이터 업데이트
      if (label || metadata || isCompleted) {
        updateData.streaming_metadata = {
          label,
          metadata,
          isStreaming: !isCompleted,
        };
      }

      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .update(updateData)
        .eq("id", messageId)
        .select()
        .single();

      if (messageError) {
        console.error("Error updating streaming message:", messageError);
        return null;
      }

      const message: ChatMessage = {
        id: messageData.id,
        type: messageData.type,
        content: messageData.content,
        timestamp: messageData.created_at,
        label,
        metadata,
        isStreaming: !isCompleted,
      };

      return message;
    } catch (error) {
      console.error("Error updating streaming message:", error);
      return null;
    }
  }
}
