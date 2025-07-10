"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  History,
  Plus,
  Paperclip,
  X,
  Pencil,
  Check,
  ArrowUp,
  Square,
} from "lucide-react";
import {
  ChatHistoryService,
  ChatSession,
  ChatMessage,
} from "@/lib/chat-history";
import { useAuth } from "@/contexts/AuthContext";
import { Messages } from "./messages";
import { getDocumentById, type Document } from "@/lib/documents";
import { hasDocumentIndex, dispatchIndexUpdateEvent } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";
import { CiaraResponse } from "@/ai/ciara-agent";

// 애니메이션 컴포넌트 추가
const AnimatedGenerating = () => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4); // 0, 1, 2, 3 순환
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex items-center gap-1 text-xs text-slate-500"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Generating
      </motion.span>
      <span className="w-6 text-left">{".".repeat(dotCount)}</span>
    </motion.div>
  );
};

interface AiSidebarProps {
  className?: string;
  documentId: string;
  onDocumentProposal?: (proposedContent: string) => void;
  onFullDocumentReview?: (aggregatedContent: string) => void;
}

export const AiSidebar = ({
  className,
  documentId,
  onDocumentProposal,
  onFullDocumentReview,
}: AiSidebarProps) => {
  // localStorage에서 너비 설정 불러오기
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-ai-sidebar-width");
      return saved ? parseInt(saved, 10) : 300;
    }
    return 300;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 스트리밍 중지를 위한 AbortController ref 추가
  const abortControllerRef = useRef<AbortController | null>(null);

  // 백그라운드 스트리밍 상태 관리
  const [isStreamingInBackground, setIsStreamingInBackground] = useState(false);
  const backgroundStreamRef = useRef<{
    sessionId: string;
    userMessage: string;
    isActive: boolean;
  } | null>(null);

  const { user } = useAuth();

  // 문서 컨텍스트 상태 추가
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documentHasIndex, setDocumentHasIndex] = useState(false);

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 520;

  // 문서 정보 로드
  const loadDocumentContext = async () => {
    try {
      const [doc, hasIndex] = await Promise.all([
        getDocumentById(documentId),
        hasDocumentIndex(documentId),
      ]);

      setCurrentDocument(doc);
      setDocumentHasIndex(hasIndex);
    } catch (error) {
      console.error("문서 컨텍스트 로드 중 오류:", error);
    }
  };

  // 컴포넌트 마운트 시 문서 컨텍스트 로드
  useEffect(() => {
    if (documentId) {
      loadDocumentContext();
    }
  }, [documentId]);

  // 컴포넌트 마운트 시 현재 활성 세션과 메시지 로드
  useEffect(() => {
    loadCurrentSession();
  }, [documentId]);

  // Page Visibility API를 활용한 백그라운드 스트리밍 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 탭이 비활성화될 때 - 스트리밍을 백그라운드로 이동
        if (isLoading && currentSession) {
          setIsStreamingInBackground(true);
          backgroundStreamRef.current = {
            sessionId: currentSession.id,
            userMessage: "스트리밍 진행 중...",
            isActive: true,
          };
        }
      } else {
        // 탭이 다시 활성화될 때 - 백그라운드 스트리밍 확인
        if (isStreamingInBackground && backgroundStreamRef.current?.isActive) {
          // 세션 메시지 다시 로드하여 백그라운드에서 추가된 메시지 동기화
          loadCurrentSession();
        }
        setIsStreamingInBackground(false);
        backgroundStreamRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading, currentSession, isStreamingInBackground]);

  // 현재 활성 세션 로드
  const loadCurrentSession = async () => {
    try {
      const activeSession = await ChatHistoryService.getCurrentActiveSession(
        documentId,
        user?.id || ""
      );

      if (activeSession) {
        setCurrentSession(activeSession);
        const sessionMessages = await ChatHistoryService.getSessionMessages(
          activeSession.id
        );
        setMessages(sessionMessages);
      } else {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("현재 세션 로드 중 오류:", error);
    }
  };

  // 채팅 히스토리 로드
  const loadChatHistory = async () => {
    try {
      const sessions = await ChatHistoryService.getDocumentSessions(
        documentId,
        user?.id || ""
      );
      setChatSessions(sessions);
    } catch (error) {
      console.error("채팅 히스토리 로드 중 오류:", error);
    }
  };

  // 새 채팅 시작
  const handleNewChat = async () => {
    try {
      setIsLoading(true);

      // 현재 활성 세션을 아카이브
      await ChatHistoryService.startNewChat(documentId, user?.id || "");

      // 상태 초기화
      setCurrentSession(null);
      setMessages([]);
      setShowHistory(false);
    } catch (error) {
      console.error("새 채팅 시작 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅 히스토리 토글
  const handleHistoryToggle = async () => {
    if (!showHistory) {
      await loadChatHistory();
    }
    setShowHistory(!showHistory);
  };

  // 특정 세션 선택
  const handleSelectSession = async (session: ChatSession) => {
    try {
      setIsLoading(true);

      // 현재 활성 세션을 아카이브
      await ChatHistoryService.startNewChat(documentId, user?.id || "");

      // 선택된 세션의 메시지 로드
      const sessionMessages = await ChatHistoryService.getSessionMessages(
        session.id
      );

      setCurrentSession(session);
      setMessages(sessionMessages);
      setShowHistory(false);
    } catch (error) {
      console.error("세션 선택 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 제목 편집 시작
  const handleStartEditTitle = (
    sessionId: string,
    currentTitle: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  // 제목 편집 완료
  const handleSaveTitle = async (
    sessionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (editingTitle.trim()) {
      try {
        const success = await ChatHistoryService.updateSessionTitle(
          sessionId,
          editingTitle.trim()
        );

        if (success) {
          await loadChatHistory();
        }
      } catch (error) {
        console.error("제목 업데이트 중 오류:", error);
      }
    }

    setEditingSessionId(null);
    setEditingTitle("");
  };

  // 키보드 이벤트로 제목 편집 완료
  const handleSaveTitleOnKeyboard = async (sessionId: string) => {
    if (editingTitle.trim()) {
      try {
        const success = await ChatHistoryService.updateSessionTitle(
          sessionId,
          editingTitle.trim()
        );

        if (success) {
          await loadChatHistory();
        }
      } catch (error) {
        console.error("제목 업데이트 중 오류:", error);
      }
    }

    setEditingSessionId(null);
    setEditingTitle("");
  };

  // 제목 편집 취소
  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // 세션 삭제
  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      const success = await ChatHistoryService.deleteSession(sessionId);
      if (success) {
        await loadChatHistory();
      }
    } catch (error) {
      console.error("세션 삭제 중 오류:", error);
    }
  };

  // 너비 변경 시 localStorage에 저장
  const updateWidth = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (typeof window !== "undefined") {
      localStorage.setItem("ciara-ai-sidebar-width", newWidth.toString());
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      document.body.style.transition = "none";

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => {
          // 왼쪽 핸들이므로 반대 방향으로 계산
          const diff = startX - e.clientX;
          const newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, startWidth + diff)
          );
          updateWidth(newWidth);
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.body.style.transition = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, updateWidth]
  );

  // 메시지 생성 중지 함수
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  // CIARA 에이전트와 메시지 교환
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      // 사용자 메시지 저장
      const { session: updatedSession } = await ChatHistoryService.saveMessage(
        documentId,
        user.id,
        "user",
        userMessage,
        currentSession?.id
      );

      if (updatedSession && !currentSession) {
        setCurrentSession(updatedSession);
      }

      // 메시지 목록에 사용자 메시지 즉시 추가
      const userMessageObj: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        type: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessageObj]);

      // CIARA 에이전트 API 호출을 위한 컨텍스트 구성
      const conversationHistory = [...messages, userMessageObj].map((msg) => ({
        role: msg.type as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp,
      }));

      const documentState = currentDocument
        ? {
            title: currentDocument.title,
            hasContent: Boolean(currentDocument.content?.trim()),
            hasIndex: documentHasIndex,
            lastModified: currentDocument.updated_at,
          }
        : undefined;

      // 스트리밍 응답 시작
      const response = await fetch("/api/ai/ciara", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            userId: user.id,
            documentId: documentId,
            conversationHistory: conversationHistory,
            currentDocumentState: documentState,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("CIARA API 호출 실패");
      }

      // 스트리밍 응답 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let finalResult: CiaraResponse | null = null;

      // 스트리밍 메시지들을 추적하기 위한 맵
      const streamingMessages = new Map<string, ChatMessage>();

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            // AbortController로 중지 확인 (명시적 중지만 처리)
            if (
              abortControllerRef.current?.signal.aborted &&
              !document.hidden
            ) {
              reader.cancel();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === "chunk") {
                    const { label, content, metadata } = parsed;

                    // 새로운 메시지를 항상 생성 (같은 라벨이어도 분리)
                    const newMessageId = `stream-${label}-${Date.now()}-${Math.random()}`;
                    const newMessage: ChatMessage = {
                      id: newMessageId,
                      type: "assistant",
                      content: content,
                      timestamp: new Date().toISOString(),
                      label,
                      metadata,
                      isStreaming: true,
                    };

                    streamingMessages.set(
                      `${label}-${newMessageId}`,
                      newMessage
                    );

                    // UI에 새 메시지 추가
                    setMessages((prev) => [...prev, newMessage]);

                    // 데이터베이스에 저장 (실시간 저장)
                    if (updatedSession) {
                      ChatHistoryService.saveStreamingMessage(
                        updatedSession.id,
                        "assistant",
                        content,
                        label,
                        metadata
                      ).then((savedMessage) => {
                        if (savedMessage) {
                          // 임시 ID를 실제 DB ID로 교체
                          const realMessage: ChatMessage = {
                            ...newMessage,
                            id: savedMessage.id,
                          };
                          streamingMessages.set(
                            `${label}-${newMessageId}`,
                            realMessage
                          );

                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === newMessageId ? realMessage : msg
                            )
                          );
                        }
                      });
                    }

                    // INDEX_CONTENT 라벨인 경우 Index Sidebar 업데이트 이벤트 발생
                    if (label === "INDEX_CONTENT") {
                      dispatchIndexUpdateEvent(documentId, content);
                    }
                  } else if (parsed.type === "final") {
                    finalResult = parsed;
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error || "스트리밍 오류");
                  }
                } catch (parseError) {
                  console.warn("JSON 파싱 오류:", parseError);
                }
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            console.log("사용자가 메시지 생성을 중지했습니다.");
          } else {
            throw error;
          }
        }
      }

      // 스트리밍 완료 처리
      if (
        (!abortControllerRef.current?.signal.aborted || document.hidden) &&
        finalResult?.success
      ) {
        // 모든 스트리밍 메시지를 완료 상태로 업데이트 (DB 저장은 하지 않음)
        streamingMessages.forEach((message) => {
          const completedMessage: ChatMessage = {
            ...message,
            isStreaming: false,
          };

          setMessages((prev) =>
            prev.map((msg) => (msg.id === message.id ? completedMessage : msg))
          );

          // 데이터베이스에서 완료 상태로만 업데이트 (내용은 이미 저장됨)
          if (updatedSession && !message.id.startsWith("stream-")) {
            ChatHistoryService.updateStreamingMessage(
              message.id,
              message.content,
              message.label as ChatMessage["label"],
              message.metadata,
              true // 완료 상태로만 업데이트
            );
          }
        });

        // 최종 응답 메시지가 있고 실제 텍스트 내용이 있는 경우에만 추가
        if (finalResult.response && finalResult.response.trim()) {
          const finalMessage: ChatMessage = {
            id: `final-${Date.now()}`,
            type: "assistant",
            content: finalResult.response,
            timestamp: new Date().toISOString(),
            label: "FINAL",
            isStreaming: false,
          };

          setMessages((prev) => [...prev, finalMessage]);

          // 최종 메시지만 별도로 저장 (스트리밍 히스토리는 제외)
          if (updatedSession) {
            ChatHistoryService.saveMessage(
              documentId,
              user.id,
              "assistant",
              finalResult.response,
              updatedSession.id,
              {
                label: "FINAL",
                isStreaming: false,
              }
            );
          }
        }

        // 문서 상태가 변경되었을 수 있으므로 다시 로드
        if (
          finalResult.actionsTaken?.some(
            (action: string) =>
              action.includes("목차") || action.includes("내용")
          )
        ) {
          await loadDocumentContext();
        }

        // 백그라운드 스트리밍 완료 처리
        if (backgroundStreamRef.current?.isActive) {
          backgroundStreamRef.current.isActive = false;
          setIsStreamingInBackground(false);
        }
      } else if (abortControllerRef.current?.signal.aborted) {
        // 중지된 경우 현재까지의 모든 메시지를 STOPPED 상태로 업데이트
        streamingMessages.forEach((message) => {
          const stoppedMessage: ChatMessage = {
            ...message,
            label: "STOPPED",
            isStreaming: false,
          };

          setMessages((prev) =>
            prev.map((msg) => (msg.id === message.id ? stoppedMessage : msg))
          );
        });
      } else if (finalResult && !finalResult.success) {
        // 에러 메시지 추가
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: "assistant",
          content: finalResult?.error || "오류가 발생했습니다.",
          timestamp: new Date().toISOString(),
          label: "ERROR",
          isStreaming: false,
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("API 요청이 중지되었습니다.");
      } else {
        console.error("메시지 전송 중 오류:", error);

        // 에러 메시지 추가
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: "assistant",
          content:
            "죄송합니다. 메시지 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
          timestamp: new Date().toISOString(),
          label: "ERROR",
          isStreaming: false,
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;

      // 백그라운드 스트리밍 상태 정리
      if (backgroundStreamRef.current?.isActive) {
        backgroundStreamRef.current.isActive = false;
        setIsStreamingInBackground(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={cn("relative h-full flex", className)}
      style={{ width: `${width}px` }}
    >
      {/* 리사이즈 핸들 - 왼쪽에 위치 */}
      <div
        className={cn(
          "w-1 cursor-col-resize hover:bg-blue-300/60 transition-all duration-300 flex-shrink-0",
          isResizing ? "bg-blue-400/80" : "bg-transparent"
        )}
        onMouseDown={handleMouseDown}
        style={{ transition: "background-color 0.3s ease" }}
      >
        <div className="w-full h-full relative">
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-transparent hover:bg-blue-300/50 transition-all duration-300" />
        </div>
      </div>

      <Card className="flex-1 bg-white/40 border-slate-200/60 flex flex-col p-0">
        <CardContent className="flex-1 p-0 flex flex-col h-full overflow-hidden">
          {/* 1. 최상단 아이콘 섹션 */}
          <div className="bg-transparent p-1 flex-none border-b border-slate-200/40">
            <div className="flex items-center justify-between gap-2">
              {/* 왼쪽: 세션 제목 */}
              <div className="flex-1 min-w-0 px-2">
                {currentSession?.title && (
                  <h3 className="text-xs font-medium text-slate-700 truncate">
                    {currentSession.title}
                  </h3>
                )}
              </div>

              {/* 오른쪽: 아이콘들 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleNewChat}
                  disabled={isLoading}
                  className="flex items-center gap-2 p-1.5 bg-white/60 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50"
                  title="새 채팅 시작"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
                <button
                  onClick={handleHistoryToggle}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    showHistory
                      ? "bg-gray-100/80 text-gray-600"
                      : "bg-white/60 hover:bg-white/80 text-slate-600"
                  )}
                  title="채팅 히스토리"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. 중간 메시지 섹션 */}
          <div className="flex-1 bg-white/40 overflow-hidden">
            <div className="h-full flex flex-col">
              {showHistory ? (
                /* 채팅 히스토리 표시 */
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-3">
                    {chatSessions.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm h-full flex items-center justify-center">
                        저장된 채팅 기록이 없습니다
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chatSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => handleSelectSession(session)}
                            className="p-3 bg-white/60 rounded-lg border border-slate-200 hover:bg-white/80 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                {editingSessionId === session.id ? (
                                  <div
                                    className="flex items-center gap-2 w-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) =>
                                        setEditingTitle(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSaveTitleOnKeyboard(session.id);
                                        } else if (e.key === "Escape") {
                                          handleCancelEdit();
                                        }
                                      }}
                                      className="text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-gray-200"
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <p className="text-sm font-medium text-slate-700 truncate">
                                    {session.title}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(
                                    session.updated_at
                                  ).toLocaleDateString("ko-KR", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {editingSessionId === session.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) =>
                                        handleSaveTitle(session.id, e)
                                      }
                                      className="p-1 hover:bg-slate-100 rounded transition-all"
                                      title="저장"
                                    >
                                      <Check className="w-3 h-3 text-slate-500" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelEdit();
                                      }}
                                      className="p-1 hover:bg-slate-100 rounded transition-all"
                                      title="취소"
                                    >
                                      <X className="w-3 h-3 text-slate-500" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) =>
                                        handleStartEditTitle(
                                          session.id,
                                          session.title,
                                          e
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
                                      title="제목 편집"
                                    >
                                      <Pencil className="w-3 h-3 text-slate-500" />
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        handleDeleteSession(session.id, e)
                                      }
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all"
                                      title="세션 삭제"
                                    >
                                      <X className="w-3 h-3 text-slate-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* 메시지 표시 */
                <div className="flex-1 overflow-y-auto p-4">
                  <Messages
                    messages={messages}
                    isLoading={isLoading}
                    onDocumentProposal={onDocumentProposal}
                    onFullDocumentReview={onFullDocumentReview}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. 하단 입력 섹션 */}
          <div className="bg-transparent p-4 flex-none">
            {/* 채팅 입력 영역 */}
            <div className="bg-gray-100 rounded-lg border border-slate-200/40 overflow-hidden">
              <div className="flex items-end gap-2 p-3">
                <div className="flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    disabled={isLoading}
                    className="w-full resize-none border-none outline-none bg-transparent text-xs placeholder-slate-500 min-h-[20px] max-h-[120px] text-slate-600 disabled:opacity-50"
                    rows={1}
                    style={{
                      height: "auto",
                      minHeight: "20px",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height =
                        Math.min(target.scrollHeight, 120) + "px";
                    }}
                  />
                </div>
              </div>

              {/* 하단 아이콘 영역 */}
              <div className="px-3 py-1 flex items-center justify-between">
                <div className="flex items-center justify-start gap-2">
                  <AnimatePresence mode="wait">
                    {isLoading && <AnimatedGenerating key="generating" />}
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button className="p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors">
                    <Paperclip className="w-4 h-4 text-slate-600" />
                  </button>
                  {isLoading ? (
                    <button
                      onClick={handleStopGeneration}
                      className="p-1.5 rounded-lg transition-colors flex-none text-slate-600 hover:bg-slate-100/50"
                      title="생성 중지"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors flex-none",
                        inputValue.trim()
                          ? "text-slate-600 hover:bg-slate-100/50"
                          : "text-slate-400 cursor-not-allowed"
                      )}
                      title="메시지 전송"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
