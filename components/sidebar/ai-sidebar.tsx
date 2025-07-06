"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ChatHistoryService, type ChatMessage } from "@/lib/chat-history";
import ReactMarkdown from "react-markdown";
import {
  MessageSquare,
  Plus,
  History,
  Copy,
  Square,
  ArrowUp,
  Trash2,
  Clock,
} from "lucide-react";
import { Card } from "../ui/card";
import { ModificationProposal } from "./modification-proposal";
import { IndexProposal } from "./index-proposal";
import {
  type DocumentModificationResult,
  type DocumentIndexResult,
} from "@/lib/agent-tool";
import { saveDocumentIndex } from "@/lib/index";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isStreaming?: boolean;
  toolStatus?: {
    toolName: string;
    status: "starting" | "in_progress" | "completed" | "failed";
    message: string;
  }[];
  agentResult?: {
    toolsUsed: Array<{
      toolName: string;
      success: boolean;
      error?: string;
    }>;
    reasoning: string;
  };
  modificationProposal?: DocumentModificationResult;
  indexResult?: DocumentIndexResult;
  isProposalProcessing?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

interface AiSidebarProps {
  className?: string;
  documentId: string;
}

export function AiSidebar({ className, documentId }: AiSidebarProps) {
  const { user } = useAuth();

  // localStorage에서 너비 설정 불러오기
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-ai-sidebar-width");
      return saved ? parseInt(saved, 10) : 320;
    }
    return 320;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // 대화 히스토리 관련 상태
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 240;
  const MAX_WIDTH = 400;

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

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => {
          const diff = e.clientX - startX;
          const newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, startWidth - diff)
          );
          updateWidth(newWidth);
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, updateWidth]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !user || !documentId) return;

    // 필수 파라미터 검증
    if (!user.id) {
      console.error("사용자 ID가 없습니다.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    const currentInputValue = inputValue;
    setInputValue("");
    setIsLoading(true);

    // 입력창 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }

    try {
      // 사용자 메시지를 데이터베이스에 저장하고 세션 관리
      const result = await ChatHistoryService.saveMessage(
        documentId,
        user.id,
        "user",
        currentInputValue
      );

      // 현재 세션 업데이트
      if (!currentSession && result.session) {
        setCurrentSession({
          id: result.session.id,
          title: result.session.title,
          status: result.session.status as "active" | "archived",
          created_at: result.session.created_at,
          updated_at: result.session.updated_at,
        });
      }

      // 현재 대화 히스토리를 컨텍스트로 준비 (최근 10개 메시지만)
      const conversationHistory = messages
        .filter((msg) => !msg.isLoading) // 로딩 중인 메시지 제외
        .slice(-10) // 최근 10개 메시지만 사용 (토큰 절약)
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content,
        }));

      // 스트리밍 AI API 호출
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInputValue,
          documentId: documentId,
          userId: user.id,
          conversationHistory: conversationHistory,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("AI 서비스 오류가 발생했습니다.");
      }

      if (!response.body) {
        throw new Error("스트림 응답을 받을 수 없습니다.");
      }

      // 로딩 상태를 스트리밍 상태로 변경
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? { ...msg, content: "", isLoading: false, isStreaming: true }
            : msg
        )
      );

      // Server-Sent Events 스트림 처리
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              // 스트림 완료 - 스트리밍 상태 해제
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === loadingMessage.id
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );

              // AI 응답을 데이터베이스에 저장
              if (accumulatedContent.trim()) {
                await ChatHistoryService.saveMessage(
                  documentId,
                  user.id,
                  "assistant",
                  accumulatedContent
                );
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.text) {
                accumulatedContent += parsed.text;

                // 실시간으로 메시지 업데이트
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === loadingMessage.id
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: true,
                        }
                      : msg
                  )
                );
              }

              // 도구 상태 메시지 처리
              if (parsed.toolStatus) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === loadingMessage.id
                      ? {
                          ...msg,
                          toolStatus: (() => {
                            const currentStatus = msg.toolStatus || [];
                            const newStatus = {
                              toolName: parsed.toolStatus.toolName,
                              status: parsed.toolStatus.status,
                              message: parsed.toolStatus.message,
                            };

                            // 같은 도구의 이전 상태를 찾아서 업데이트하거나 새로 추가
                            const existingIndex = currentStatus.findIndex(
                              (s) => s.toolName === newStatus.toolName
                            );

                            if (existingIndex >= 0) {
                              // 기존 상태 업데이트
                              const updated = [...currentStatus];
                              updated[existingIndex] = newStatus;
                              return updated;
                            } else {
                              // 새 상태 추가
                              return [...currentStatus, newStatus];
                            }
                          })(),
                          isStreaming: true,
                        }
                      : msg
                  )
                );
              }

              // 오케스트레이션 결과 처리 (final: true인 경우)
              if (parsed.final && parsed.result) {
                console.log("에이전트 결과:", parsed.result);

                // 메시지에 에이전트 결과 추가
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === loadingMessage.id
                      ? {
                          ...msg,
                          agentResult: {
                            toolsUsed: parsed.result.toolsUsed || [],
                            reasoning: parsed.result.reasoning || "",
                          },
                        }
                      : msg
                  )
                );
              }

              // 수정 제안 처리
              if (parsed.modificationProposal) {
                // 메시지에 수정 제안 추가
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === loadingMessage.id
                      ? {
                          ...msg,
                          modificationProposal: parsed.modificationProposal,
                        }
                      : msg
                  )
                );
              }

              // 목차 생성 결과 처리
              if (parsed.indexResult) {
                // 메시지에 목차 결과 추가
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === loadingMessage.id
                      ? {
                          ...msg,
                          indexResult: parsed.indexResult,
                        }
                      : msg
                  )
                );
              }
            } catch {
              // JSON 파싱 에러는 무시 (불완전한 데이터일 수 있음)
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("AI Stream Error:", error);

      // 에러 메시지로 교체
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
                isLoading: false,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [inputValue, isLoading, user, documentId, currentSession, messages]);

  // 텍스트 영역 자동 높이 조절
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      // 높이를 초기화하여 scrollHeight를 정확히 계산
      textarea.style.height = "auto";

      // 최소 높이 (44px)와 최대 높이 (128px) 사이에서 조절
      const minHeight = 44;
      const maxHeight = 128;
      const scrollHeight = textarea.scrollHeight;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = useCallback(async () => {
    if (!user || !documentId) return;

    try {
      if (currentSession) {
        await ChatHistoryService.startNewChat(documentId, user.id);
      }
      setCurrentSession(null);
      setMessages([]);
      setShowHistory(false);
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  }, [user, documentId, currentSession]);

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  // 수정 제안 처리 함수들
  const handleProposalApprove = useCallback(
    async (messageId: string, proposal: DocumentModificationResult) => {
      if (!user || !documentId) return;

      // 처리 중 상태로 변경
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isProposalProcessing: true } : msg
        )
      );

      try {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `수정 제안을 승인합니다. 제안된 내용을 문서에 적용해주세요.`,
            documentId: documentId,
            userId: user.id,
            proposalResponse: {
              action: "approve",
              customContent: proposal.suggestedContent,
            },
          }),
        });

        if (response.ok) {
          // 제안 승인 완료 - 제안 UI 제거
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    modificationProposal: undefined,
                    isProposalProcessing: false,
                    content:
                      msg.content +
                      "\n\n**수정 제안이 승인되어 문서에 적용되었습니다.**",
                  }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("제안 승인 오류:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isProposalProcessing: false } : msg
          )
        );
      }
    },
    [user, documentId]
  );

  const handleProposalReject = useCallback(
    async (messageId: string) => {
      if (!user || !documentId) return;

      // 처리 중 상태로 변경
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isProposalProcessing: true } : msg
        )
      );

      try {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `수정 제안을 거절합니다.`,
            documentId: documentId,
            userId: user.id,
            proposalResponse: {
              action: "reject",
            },
          }),
        });

        if (response.ok) {
          // 제안 거절 완료 - 제안 UI 제거
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    modificationProposal: undefined,
                    isProposalProcessing: false,
                    content:
                      msg.content + "\n\n**수정 제안이 거절되었습니다.**",
                  }
                : msg
            )
          );
        }
      } catch (error) {
        console.error("제안 거절 오류:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isProposalProcessing: false } : msg
          )
        );
      }
    },
    [user, documentId]
  );

  // 목차 생성 결과 처리 함수들
  const handleIndexApprove = useCallback(
    async (messageId: string, indexResult: DocumentIndexResult) => {
      if (!user || !documentId) return;

      // 처리 중 상태로 변경
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isProposalProcessing: true } : msg
        )
      );

      try {
        // Supabase에 목차 저장
        await saveDocumentIndex(documentId, indexResult.indexContent);

        // 목차 승인 완료 - 목차 UI 제거하고 성공 메시지 추가
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  indexResult: undefined,
                  isProposalProcessing: false,
                  content:
                    msg.content +
                    "\n\n**목차가 저장되었습니다. Index 사이드바에서 확인하실 수 있습니다.**",
                }
              : msg
          )
        );

        // 목차 저장 완료 이벤트 발생 (index-sidebar 업데이트를 위해)
        window.dispatchEvent(
          new CustomEvent("indexUpdated", {
            detail: { documentId, indexContent: indexResult.indexContent },
          })
        );
      } catch (error) {
        console.error("목차 저장 오류:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isProposalProcessing: false } : msg
          )
        );
      }
    },
    [user, documentId]
  );

  const handleIndexReject = useCallback(async (messageId: string) => {
    // 목차 거절 - 목차 UI 제거
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              indexResult: undefined,
              content: msg.content + "\n\n**목차 제안이 거절되었습니다.**",
            }
          : msg
      )
    );
  }, []);

  // 대화 히스토리 관련 함수들
  const loadCurrentSession = useCallback(async () => {
    if (!user || !documentId) return;

    try {
      const session = await ChatHistoryService.getCurrentActiveSession(
        documentId,
        user.id
      );
      if (session) {
        setCurrentSession(session);
        // 세션의 메시지들 로드
        const sessionMessages = await ChatHistoryService.getSessionMessages(
          session.id
        );
        const formattedMessages: Message[] = sessionMessages.map(
          (msg: ChatMessage) => ({
            id: msg.id,
            type: msg.type as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          })
        );
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading current session:", error);
    }
  }, [user, documentId]);

  const loadChatSessions = useCallback(async () => {
    if (!user || !documentId) return;

    setIsLoadingHistory(true);
    try {
      // ChatHistoryService에서 세션 목록 로드
      const sessions = await ChatHistoryService.getDocumentSessions(
        documentId,
        user.id
      );
      setChatSessions(sessions);
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user, documentId]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!user) return;

      try {
        await ChatHistoryService.deleteSession(sessionId);
        await loadChatSessions();

        // 현재 세션이 삭제된 경우 새 대화 시작
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    },
    [user, currentSession, loadChatSessions]
  );

  const toggleHistory = useCallback(() => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      loadChatSessions();
    }
  }, [showHistory, loadChatSessions]);

  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!user) return;

      try {
        // 세션 정보 가져오기
        const sessions = await ChatHistoryService.getDocumentSessions(
          documentId,
          user.id
        );
        const session = sessions.find((s) => s.id === sessionId);

        if (session) {
          setCurrentSession(session);

          // 세션의 메시지들 로드
          const sessionMessages = await ChatHistoryService.getSessionMessages(
            sessionId
          );
          const formattedMessages: Message[] = sessionMessages.map(
            (msg: ChatMessage) => ({
              id: msg.id,
              type: msg.type as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            })
          );
          setMessages(formattedMessages);
          setShowHistory(false);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      }
    },
    [user, documentId]
  );

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // 컴포넌트 초기화 시 현재 세션 로드
  useEffect(() => {
    if (user && documentId) {
      loadCurrentSession();
    }
  }, [user, documentId, loadCurrentSession]);

  // 컴포넌트 마운트 시 텍스트 영역 초기 높이 설정
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  return (
    <div
      ref={sidebarRef}
      className={cn("relative h-full flex", className)}
      style={{ width: `${width}px` }}
    >
      {/* 리사이즈 핸들 */}
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

      {/* AI 사이드바 메인 콘텐츠 */}
      <Card className="flex-1 flex flex-col p-0 bg-white/40 border-slate-200/60 overflow-hidden gap-2">
        {/* 상단 헤더 - 고정 */}
        <div className="flex-shrink-0 px-3 py-2 border-b border-black/5 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-700">
                {currentSession ? currentSession.title : "New Chat"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-white/60"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleHistory}
                className={cn(
                  "h-6 w-6 p-0 text-slate-500 hover:text-slate-700 hover:bg-white/60",
                  showHistory && "bg-white/60 text-slate-700"
                )}
              >
                <History className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* 중단 채팅 영역 - 스크롤 가능 */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-3 min-h-0">
          <div className="space-y-3">
            {showHistory ? (
              // 히스토리 뷰
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  {isLoadingHistory && (
                    <div className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {chatSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      저장된 대화가 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer",
                          currentSession?.id === session.id
                            ? "bg-white/80 border-white/60"
                            : "bg-white/40 border-white/30 hover:bg-white/60"
                        )}
                        onClick={() => {
                          loadSession(session.id);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {session.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(session.updated_at).toLocaleDateString(
                              "ko-KR",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="h-5 w-5 p-0 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : messages.length === 0 ? (
              // 초기 상태
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <div className="w-12 h-12 rounded-full bg-white/60 border border-white/40 flex items-center justify-center mb-3">
                  <MessageSquare className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  어떤 글을 작성할까요?
                </p>
              </div>
            ) : (
              // 대화 메시지들
              messages.map((message) => (
                <div key={message.id} className="space-y-3">
                  {message.type === "user" ? (
                    // 사용자 메시지 - 회색 박스
                    <div className="flex justify-end">
                      <div className="max-w-full bg-slate-100 text-slate-800 rounded-lg px-4 py-2 border border-slate-200">
                        <p className="text-xs leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // AI 메시지 - 마크다운 지원
                    <div className="flex justify-start">
                      <div className="max-w-full w-full">
                        {message.isLoading ? (
                          <div className="flex items-center gap-2 px-4 py-3">
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                              <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* 도구 상태 메시지 표시 */}
                            {message.toolStatus &&
                              message.toolStatus.length > 0 && (
                                <div className="space-y-2">
                                  {message.toolStatus.map((status, index) => (
                                    <div
                                      key={index}
                                      className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-xs border transition-all duration-200",
                                        status.status === "starting" &&
                                          "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800",
                                        status.status === "in_progress" &&
                                          "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800",
                                        status.status === "completed" &&
                                          "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800",
                                        status.status === "failed" &&
                                          "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        {(status.status === "starting" ||
                                          status.status === "in_progress") && (
                                          <div
                                            className={cn(
                                              "w-2 h-2 border-2 border-t-transparent rounded-full animate-spin",
                                              status.status === "starting"
                                                ? "border-blue-500"
                                                : "border-blue-600"
                                            )}
                                          />
                                        )}
                                        {status.status === "completed" && (
                                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        )}
                                        {status.status === "failed" && (
                                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        )}
                                        <span className="font-medium">
                                          {status.message}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* 메인 응답 내용 */}
                            <div className="max-w-none text-slate-700 leading-relaxed">
                              <div className="relative">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-3 last:mb-0 text-xs leading-relaxed text-slate-700">
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="mb-3 last:mb-0 pl-4 list-disc list-outside space-y-1">
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="mb-3 last:mb-0 pl-4 list-decimal list-outside space-y-1">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="text-xs leading-relaxed text-slate-700 mb-1">
                                        {children}
                                      </li>
                                    ),
                                    code: ({ children, className }) => {
                                      const isInline =
                                        !className?.includes("language-");
                                      return isInline ? (
                                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono border">
                                          {children}
                                        </code>
                                      ) : (
                                        <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-lg text-xs font-mono overflow-x-auto my-3">
                                          <code className={className}>
                                            {children}
                                          </code>
                                        </pre>
                                      );
                                    },
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-slate-300 pl-4 my-3 italic text-slate-600 bg-slate-50/50 py-2 rounded-r-lg">
                                        {children}
                                      </blockquote>
                                    ),
                                    h1: ({ children }) => (
                                      <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-slate-800 border-b border-slate-200 pb-2">
                                        {children}
                                      </h1>
                                    ),
                                    h2: ({ children }) => (
                                      <h2 className="text-base font-bold mb-3 mt-4 first:mt-0 text-slate-800">
                                        {children}
                                      </h2>
                                    ),
                                    h3: ({ children }) => (
                                      <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-slate-800">
                                        {children}
                                      </h3>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-slate-800">
                                        {children}
                                      </strong>
                                    ),
                                    em: ({ children }) => (
                                      <em className="italic text-slate-700">
                                        {children}
                                      </em>
                                    ),
                                    a: ({ children, href }) => (
                                      <a
                                        href={href}
                                        className="text-blue-600 hover:text-blue-800 underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {children}
                                      </a>
                                    ),
                                  }}
                                >
                                  {
                                    // 불릿 포인트들 사이에 줄바꿈 추가하는 전처리
                                    message.content
                                      .replace(/• /g, "\n• ")
                                      .replace(/^\n/, "") // 맨 앞의 불필요한 줄바꿈 제거
                                      .replace(/\n{3,}/g, "\n\n") // 과도한 줄바꿈 정리
                                  }
                                </ReactMarkdown>
                              </div>
                              {!message.isStreaming && (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          message.content
                                        )
                                      }
                                      className="h-4 px-2 text-xs text-slate-400 hover:text-slate-600"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 수정 제안 UI */}
                            {message.modificationProposal && (
                              <ModificationProposal
                                proposal={message.modificationProposal}
                                onApprove={() =>
                                  handleProposalApprove(
                                    message.id,
                                    message.modificationProposal!
                                  )
                                }
                                onReject={() =>
                                  handleProposalReject(message.id)
                                }
                                isProcessing={message.isProposalProcessing}
                              />
                            )}

                            {/* 목차 생성 결과 UI */}
                            {message.indexResult && (
                              <IndexProposal
                                indexResult={message.indexResult}
                                onApprove={() =>
                                  handleIndexApprove(
                                    message.id,
                                    message.indexResult!
                                  )
                                }
                                onReject={() => handleIndexReject(message.id)}
                                isProcessing={message.isProposalProcessing}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* 하단 입력창 - 고정 */}
        <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-sm">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="w-full min-h-[44px] max-h-32 pr-12 resize-none text-xs bg-white/60 border border-slate-200 rounded-lg px-3 py-3 text-slate-800 placeholder:text-xs placeholder:text-slate-500 focus:outline-none focus:border-slate-300 focus:bg-white/80 transition-all duration-200 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
              disabled={isLoading}
              style={{
                lineHeight: "1.4",
                scrollbarWidth: "thin",
              }}
            />
            <div className="absolute bottom-[7px] right-2 flex items-end">
              {isLoading ? (
                <Button
                  onClick={handleStopGeneration}
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white/90 text-slate-800 rounded-md transition-colors shadow-sm"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white/90 text-slate-800 rounded-md disabled:bg-white/40 transition-colors shadow-sm"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
