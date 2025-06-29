import { supabase } from "./supabase";

// 대화 히스토리 관련 타입 정의
export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
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
    sessionId?: string
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
      const { data: messageData, error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: currentSession.id,
          type,
          content,
        })
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

      return data.map((msg) => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.created_at,
      }));
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
}
