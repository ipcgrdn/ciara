"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, FileText, X, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface DocumentProposalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  proposedContent: string;
  currentContent: string;
  documentTitle: string;
  onApprove: (content: string) => void;
  onReject: () => void;
  isApplying?: boolean;
}

export const DocumentProposalPortal = ({
  isOpen,
  onClose,
  proposedContent,
  currentContent,
  documentTitle,
  onApprove,
  onReject,
  isApplying = false,
}: DocumentProposalPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ESC 키 감지하여 onClose 호출
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleApprove = () => {
    onApprove(proposedContent);
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-6 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 flex overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
              boxShadow:
                "0 32px 64px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          >
            {/* 왼쪽 패널 - 현재 문서 */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex items-center">
                <EditorViewer
                  content={currentContent}
                  isEmpty={!currentContent.trim()}
                  className="w-full h-fit max-h-full"
                />
              </div>
            </div>

            {/* 중간 패널 - 정보 및 액션 */}
            <div className="flex flex-col items-center justify-center">
              {/* 문서 정보 */}
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-lg text-gray-900 font-bold">
                  {documentTitle}
                </p>
                <span className="text-sm text-gray-500 text-center">
                  제안된 내용을 검토한 후 <br />
                  승인하시면 현재 문서에 적용됩니다.
                </span>
              </div>

              {/* 화살표 애니메이션 */}
              <div className="flex items-center justify-center my-8">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-transparent flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>

                  {/* 애니메이션 화살표들 */}
                  <div className="flex items-center gap-1 mx-4">
                    {[0, 1, 2].map((index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0.3, x: -10 }}
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          x: [-10, 0, 10],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: index * 0.2,
                          ease: "easeInOut",
                        }}
                      >
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50 flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2 p-6">
                <Button
                  onClick={handleApprove}
                  disabled={isApplying}
                  className="w-full rounded-full"
                  variant="default"
                >
                  <Check className="w-4 h-4" />
                  {isApplying ? "적용 중..." : "승인 및 적용"}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isApplying}
                  className="w-full rounded-full"
                  variant="outline"
                >
                  <X className="w-4 h-4" />
                  거절 및 닫기
                </Button>
              </div>
            </div>

            {/* 오른쪽 패널 - 편집 가능한 제안 문서 */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex items-center">
                <EditorViewer
                  content={proposedContent}
                  isRight={true}
                  className="w-full h-fit max-h-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// HTML을 텍스트로 변환하는 헬퍼 함수
const htmlToText = (html: string): string => {
  // 임시 DOM 요소를 만들어서 HTML을 파싱
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // 기본적인 HTML 태그들을 마크다운 형식으로 변환
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const children = Array.from(element.childNodes).map(processNode).join("");

      switch (element.tagName?.toLowerCase()) {
        case "h1":
          return `# ${children}\n\n`;
        case "h2":
          return `## ${children}\n\n`;
        case "h3":
          return `### ${children}\n\n`;
        case "p":
          return `${children}\n\n`;
        case "strong":
        case "b":
          return `**${children}**`;
        case "em":
        case "i":
          return `*${children}*`;
        case "br":
          return "\n";
        case "ul":
          return `${children}\n`;
        case "ol":
          return `${children}\n`;
        case "li":
          return `- ${children}\n`;
        case "blockquote":
          return `> ${children}\n\n`;
        case "code":
          return `\`${children}\``;
        case "pre":
          return `\`\`\`\n${children}\n\`\`\`\n\n`;
        default:
          return children;
      }
    }

    return "";
  };

  return processNode(temp).trim();
};

// 에디터 스타일 뷰어 컴포넌트 (읽기 전용)
const EditorViewer = ({
  content,
  isEmpty = false,
  className = "",
  isRight = false,
}: {
  content: string;
  isEmpty?: boolean;
  className?: string;
  isRight?: boolean;
}) => {
  // HTML인지 Markdown인지 확인
  const isHTML = content.includes("<") && content.includes(">");

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-gray-50/50 to-white/50 overflow-y-auto",
        isRight && "bg-gradient-to-br from-blue-50/50 to-indigo-50/50",
        className
      )}
    >
      <div className="h-full overflow-auto p-4">
        <div className="max-w-none mx-auto">
          {/* 에디터와 동일한 스타일 적용 */}
          <div
            className={cn(
              "bg-white border border-gray-200 rounded-lg min-h-[600px] w-full p-6 shadow-sm",
              isRight && "bg-white border-blue-200 border-2"
            )}
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: "14px",
              lineHeight: "1.6",
              color: "rgba(55, 53, 47, 1)",
            }}
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">문서가 비어있습니다</p>
                <p className="text-sm">아직 작성된 내용이 없습니다.</p>
              </div>
            ) : isHTML ? (
              // HTML 콘텐츠를 마크다운으로 변환하여 렌더링
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mb-4 mt-8 first:mt-0 text-gray-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium mb-2 mt-4 text-gray-900">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 text-gray-700 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700 leading-relaxed">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                        <code className="font-mono text-sm text-gray-800">
                          {children}
                        </code>
                      </pre>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-700">{children}</em>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="border-t border-gray-200 my-6" />,
                  }}
                >
                  {htmlToText(content)}
                </ReactMarkdown>
              </div>
            ) : (
              // Markdown 콘텐츠 렌더링
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mb-4 mt-8 first:mt-0 text-gray-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-900">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium mb-2 mt-4 text-gray-900">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-3 text-gray-700 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-none pl-6 mb-4 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="relative text-gray-700 leading-relaxed">
                        <span className="absolute -left-4 top-0 text-gray-400">
                          •
                        </span>
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                        <code className="font-mono text-sm text-gray-800">
                          {children}
                        </code>
                      </pre>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-700">{children}</em>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    hr: () => <hr className="border-t border-gray-200 my-6" />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
