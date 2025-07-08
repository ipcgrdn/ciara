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
} from "lucide-react";
import {
  ChatHistoryService,
  ChatSession,
  ChatMessage,
} from "@/lib/chat-history";
import { useAuth } from "@/contexts/AuthContext";
import { Messages } from "./messages";

interface AiSidebarProps {
  className?: string;
  documentId: string;
}

export const AiSidebar = ({ className, documentId }: AiSidebarProps) => {
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

  const { user } = useAuth();

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 520;

  // 컴포넌트 마운트 시 현재 활성 세션과 메시지 로드
  useEffect(() => {
    loadCurrentSession();
  }, [documentId]);

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

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      try {
        setIsLoading(true);

        // 사용자 메시지 저장
        const result = await ChatHistoryService.saveMessage(
          documentId,
          user?.id || "",
          "user",
          inputValue.trim(),
          currentSession?.id
        );

        if (result.message && result.session) {
          // 새 세션이 생성된 경우 업데이트
          if (!currentSession && result.session) {
            setCurrentSession(result.session);
          }

          // 메시지 목록에 추가
          setMessages((prev) => [...prev, result.message!]);
          setInputValue("");
        }
      } catch (error) {
        console.error("메시지 전송 중 오류:", error);
      } finally {
        setIsLoading(false);
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
            <div className="flex items-center justify-end gap-2">
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
                  <Messages messages={messages} isLoading={isLoading} />
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
              <div className="px-3 py-1">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors">
                    <Paperclip className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors flex-none",
                      inputValue.trim() && !isLoading
                        ? "text-slate-600 hover:bg-slate-100/50"
                        : "text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
