"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/chat-history";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Loader2, Check } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full"
    >
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
              "prose prose-sm max-w-none overflow-y-auto w-full",
              isExpanded ? "max-h-[400px]" : "max-h-[200px]"
            )}
          >
            <div className="text-xs text-gray-700 leading-relaxed w-full">
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
                <>
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
                          <li className="text-xs leading-relaxed">
                            {children}
                          </li>
                        ),
                      }}
                    >
                      {previewText}
                    </ReactMarkdown>
                  </div>
                  {/* 페이드 아웃 효과 */}
                  {shouldShowExpand && !isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}
                </>
              )}
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-2 mt-3">
            {/* 확장/축소 버튼 */}
            {shouldShowExpand && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-1 py-2 text-xs text-gray-600 hover:text-gray-700 font-medium border border-gray-200 rounded-md hover:bg-gray-50/50 transition-all duration-200"
              >
                {isExpanded ? "Hide" : "Show more"}
              </motion.button>
            )}

            {/* 문서 제안 검토 버튼 (DOCUMENT_CONTENT이고 완료된 경우에만) */}
            {isDocumentContent && isCompleted && onDocumentProposal && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onDocumentProposal(content)}
                className="flex-shrink-0 px-4 py-2 text-xs text-black font-medium bg-gray-200 hover:bg-gray-300 rounded-md transition-all duration-200 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                검토하기
              </motion.button>
            )}
          </div>
        </div>

        {/* 타이핑 커서 효과 (완료되지 않은 경우에만) */}
        {!isCompleted && displayedContent.length < content.length && (
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute bottom-4 right-4"
          >
            <div className="w-0.5 h-4 bg-gray-500" />
          </motion.div>
        )}
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
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
    </motion.div>
  );
};

// 사용자 메시지 컴포넌트
const UserMessage = ({ message }: { message: ChatMessage }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex justify-end"
  >
    <div className="max-w-full p-3 bg-gray-100 text-gray-700 text-xs rounded-lg">
      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
    </div>
  </motion.div>
);

export const Messages = ({
  messages,
  onDocumentProposal,
  onFullDocumentReview,
  isLoading,
}: MessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // DOCUMENT_CONTENT 메시지들을 추적하고 집계
  const documentContentMessages = useMemo(() => {
    return messages.filter(
      (msg) =>
        msg.type === "assistant" &&
        msg.label === "DOCUMENT_CONTENT" &&
        !msg.isStreaming
    );
  }, [messages]);

  // 전체 문서 내용 집계
  const aggregatedDocumentContent = useMemo(() => {
    if (documentContentMessages.length === 0) return "";

    return documentContentMessages.map((msg) => msg.content).join("\n\n");
  }, [documentContentMessages]);

  // 전체 문서 검토 가능 여부
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
      /* 메시지가 없을 때의 초기 상태 */
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col items-center justify-center"
      >
        <div className="relative">
          <div className="w-32 h-32 flex items-center justify-center">
            <Image
              src="/ciara.svg"
              alt="CIARA"
              width={64}
              height={64}
              className="opacity-80"
            />
          </div>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -inset-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 -z-10"
          />
        </div>

        <div className="text-center space-y-3 max-w-xs">
          <h3 className="font-semibold text-gray-800 text-sm">
            안녕하세요! CIARA입니다
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            오늘은 어떤 문서를 만들고 싶으신가요?
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600">
              📝 목차 생성
            </span>
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600">
              ✨ 문서 작성
            </span>
            <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600">
              💡 아이디어 정리
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // 메시지들을 순차적으로 렌더링 (각 메시지는 독립적으로 처리)
  return (
    /* 메시지 목록 */
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={`message-${message.id}-${index}`}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
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
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start"
                    >
                      <div className="flex-1 p-2">
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
                                hr: () => (
                                  <hr className="my-4 border-gray-200" />
                                ),
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
                    </motion.div>
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
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 전체 문서 검토 버튼 */}
      {canReviewFullDocument && onFullDocumentReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <RainbowButton
              onClick={() => onFullDocumentReview(aggregatedDocumentContent)}
              className="w-full text-xs font-medium"
              size="sm"
              variant="outline"
            >
              <Check className="w-4 h-4" />
              전체 문서 검토 ({documentContentMessages.length}개 섹션)
            </RainbowButton>
          </motion.div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
