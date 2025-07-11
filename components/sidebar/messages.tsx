"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/chat-history";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Loader2, Check, Copy } from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-button";

interface MessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onDocumentProposal?: (proposedContent: string) => void;
  onFullDocumentReview?: (aggregatedContent: string) => void;
}

// CONTENT 라벨 전용 미리보기 컴포넌트
const ContentPreview = ({
  content,
  isCompleted = false,
  isDocumentContent = false,
  onDocumentProposal,
}: {
  content: string;
  metadata?: ChatMessage["metadata"];
  isCompleted?: boolean;
  isDocumentContent?: boolean;
  onDocumentProposal?: (proposedContent: string) => void;
}) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 타이핑 효과로 내용 표시 (완료된 경우에는 타이핑 효과 없이 전체 표시)
  useEffect(() => {
    if (isCompleted) {
      setDisplayedContent(content);
      return;
    }

    setDisplayedContent("");
    let index = 0;
    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 20); // 타이핑 속도 조절

    return () => clearInterval(timer);
  }, [content, isCompleted]);

  // 미리보기용 텍스트 (처음 150자)
  const previewText =
    displayedContent.length > 150
      ? displayedContent.slice(0, 150) + "..."
      : displayedContent;

  const shouldShowExpand = content.length > 150;

  // 복사 기능
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("복사에 실패했습니다:", err);
    }
  };

  return (
    <div className="relative w-full min-h-[120px]">
      {/* 콘텐츠 미리보기 영역 */}
      <div className="relative w-full">
        {/* 미리보기 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/80 to-gray-50/30 rounded-lg border border-gray-200 backdrop-blur-sm" />
        {/* 실제 콘텐츠 */}
        <div className="relative p-4 space-y-3 w-full">
          {/* 미리보기 라벨 */}
          <div className="flex items-center mb-2">
            <span className="text-xs font-mono text-gray-600 tracking-wide">
              PREVIEW
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
            {isCompleted && (
              <CheckCircle className="w-3 h-3 text-green-500 ml-2" />
            )}
          </div>

          {/* 텍스트 콘텐츠 */}
          <div
            className={cn(
              "prose prose-sm max-w-none overflow-y-auto w-full transition-all duration-300 ease-out",
              isExpanded ? "max-h-[400px]" : "max-h-[200px]"
            )}
          >
            <div className="text-xs text-gray-700 leading-relaxed w-full min-h-[60px]">
              {isExpanded ? (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-sm font-bold mb-2 text-gray-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-semibold mb-1 text-gray-800">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-semibold mb-1 text-gray-700">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 leading-relaxed text-gray-700">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900">
                        {children}
                      </strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-1">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-xs leading-relaxed">{children}</li>
                    ),
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap w-full">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-sm font-bold mb-2 text-gray-900">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-sm font-semibold mb-1 text-gray-800">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xs font-semibold mb-1 text-gray-700">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 leading-relaxed text-gray-700">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">
                          {children}
                        </strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-2 space-y-1">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-xs leading-relaxed">{children}</li>
                      ),
                    }}
                  >
                    {previewText}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-2 mt-3">
            {/* 복사 버튼 */}
            <button
              onClick={handleCopy}
              className="flex-shrink-0 px-3 py-2 text-xs text-gray-600 hover:text-gray-700 font-medium border border-gray-200 rounded-md hover:bg-gray-50/50 transition-all duration-200 flex items-center gap-1"
              title="내용 복사"
            >
              {isCopied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {/* 확장/축소 버튼 */}
            {shouldShowExpand && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-1 py-2 text-xs text-gray-600 hover:text-gray-700 font-medium border border-gray-200 rounded-md hover:bg-gray-50/50 transition-all duration-200"
              >
                {isExpanded ? "Hide" : "Show more"}
              </button>
            )}

            {/* 문서 제안 검토 버튼 (DOCUMENT_CONTENT이고 완료된 경우에만) */}
            {isDocumentContent && isCompleted && onDocumentProposal && (
              <button
                onClick={() => onDocumentProposal(content)}
                className="flex-shrink-0 px-4 py-2 text-xs text-black font-medium bg-gray-200 hover:bg-gray-300 rounded-md transition-all duration-200 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                검토하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 스트리밍 상태 표시 컴포넌트
const StreamingIndicator = ({
  label,
  content,
  metadata,
  isCompleted = false,
}: {
  label: ChatMessage["label"];
  content: string;
  metadata?: ChatMessage["metadata"];
  isCompleted?: boolean;
}) => {
  const getIndicatorConfig = () => {
    switch (label) {
      case "PROCESSING":
        return {
          icon: Loader2,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
      case "GENERATING":
        return {
          icon: Loader2,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
      case "SUCCESS":
        return {
          icon: CheckCircle,
          color: "text-black",
          bgColor: "bg-transparent",
          borderColor: "border-gray-500",
        };
      case "ERROR":
        return {
          icon: AlertTriangle,
          color: "text-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      case "STOPPED":
        return {
          icon: AlertTriangle,
          color: "text-orange-500",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
        };
      default:
        return {
          icon: Loader2,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border min-h-[30px] transition-all duration-200 ease-out",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className={cn(config.color)}>
        {(label === "GENERATING" || label === "PROCESSING") && !isCompleted ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-mono tracking-wide", config.color)}>
            {content}
          </span>
          {metadata?.progress && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>
                {metadata.progress.current}/{metadata.progress.total}
              </span>
              {metadata.progress.section && (
                <span className="text-gray-400">
                  • {metadata.progress.section}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 사용자 메시지 컴포넌트
const UserMessage = ({ message }: { message: ChatMessage }) => (
  <div className="flex justify-end">
    <div className="max-w-full p-3 bg-gray-100 text-gray-700 text-xs rounded-lg min-h-[40px]">
      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
    </div>
  </div>
);

export const Messages = ({
  messages,
  onDocumentProposal,
  onFullDocumentReview,
  isLoading,
}: MessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 현재 대화 세션의 DOCUMENT_CONTENT 메시지들만 추적하고 집계
  const documentContentMessages = useMemo(() => {
    // 마지막 사용자 메시지의 인덱스를 찾기
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }

    // 마지막 사용자 메시지 이후의 DOCUMENT_CONTENT 메시지들만 필터링
    if (lastUserMessageIndex === -1) return [];

    return messages
      .slice(lastUserMessageIndex + 1)
      .filter(
        (msg) =>
          msg.type === "assistant" &&
          msg.label === "DOCUMENT_CONTENT" &&
          !msg.isStreaming
      );
  }, [messages]);

  // 현재 세션의 문서 내용 집계
  const aggregatedDocumentContent = useMemo(() => {
    if (documentContentMessages.length === 0) return "";

    return documentContentMessages.map((msg) => msg.content).join("\n\n");
  }, [documentContentMessages]);

  // 현재 세션의 문서 검토 가능 여부
  const canReviewFullDocument =
    documentContentMessages.length > 1 && !isLoading;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full">
        <div className="flex text-sm items-center gap-2">
          안녕하세요, Ciara 입니다.
        </div>
        <div className="flex text-xs items-center opacity-70">
          어떤 문서를 작성할까요?
        </div>
      </div>
    );
  }

  // 메시지들을 순차적으로 렌더링 (각 메시지는 독립적으로 처리)
  return (
    /* 메시지 목록 */
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={`message-${message.id}-${index}`}
          className="opacity-100 transform-none"
        >
          {message.type === "user" ? (
            // 사용자 메시지
            <UserMessage message={message} />
          ) : (
            // 어시스턴트 메시지 - 라벨에 따라 다르게 렌더링
            <div className="flex justify-start w-full">
              <div className="w-full">
                {message.label === "INDEX_CONTENT" ? (
                  // INDEX_CONTENT는 기본 ContentPreview로 렌더링
                  <ContentPreview
                    content={message.content}
                    metadata={message.metadata}
                    isCompleted={!message.isStreaming}
                  />
                ) : message.label === "DOCUMENT_CONTENT" ? (
                  // DOCUMENT_CONTENT는 검토 버튼이 있는 ContentPreview로 렌더링
                  <ContentPreview
                    content={message.content}
                    metadata={message.metadata}
                    isCompleted={!message.isStreaming}
                    isDocumentContent={true}
                    onDocumentProposal={onDocumentProposal}
                  />
                ) : message.label === "FINAL" ? (
                  // FINAL 라벨은 일반 어시스턴트 메시지로 렌더링
                  <div className="flex items-start">
                    <div className="flex-1 p-2 min-h-[40px]">
                      {message.content ? (
                        <div className="prose prose-sm max-w-none text-black text-xs">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-sm font-bold mb-2 mt-4 first:mt-0 text-gray-900">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-gray-800">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-xs font-bold mb-1 mt-2 first:mt-0 text-gray-700">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 leading-relaxed text-gray-700">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-gray-900">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-600">
                                  {children}
                                </em>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-2 space-y-1 text-gray-700">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-700">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-xs leading-relaxed">
                                  {children}
                                </li>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2 text-gray-800 border border-gray-200">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-300 pl-3 ml-2 italic text-gray-600 text-xs">
                                  {children}
                                </blockquote>
                              ),
                              hr: () => <hr className="my-4 border-gray-200" />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // 나머지는 StreamingIndicator로 렌더링
                  <StreamingIndicator
                    label={message.label}
                    content={message.content}
                    metadata={message.metadata}
                    isCompleted={!message.isStreaming}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 전체 문서 검토 버튼 */}
      {canReviewFullDocument && onFullDocumentReview && (
        <div className="pt-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <RainbowButton
              onClick={() => onFullDocumentReview(aggregatedDocumentContent)}
              className="w-full text-xs font-medium text-white rounded-lg"
              size="default"
              variant="default"
            >
              <Check className="w-4 h-4" />
              전체 문서 검토 ({documentContentMessages.length}개 섹션)
            </RainbowButton>
          </motion.div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
