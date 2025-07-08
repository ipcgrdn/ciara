"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { History, Plus, Send, Paperclip } from "lucide-react";
import Image from "next/image";

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
  const sidebarRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 300;
  const MAX_WIDTH = 520;

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

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // TODO: 메시지 전송 로직 구현
      console.log("Sending message:", inputValue);
      setInputValue("");
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
              <button className="flex items-center gap-2 p-1.5 bg-white/60 rounded-lg  hover:bg-white/80 transition-colors">
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
              <button className="p-1.5 bg-white/60 rounded-lg  hover:bg-white/80 transition-colors">
                <History className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* 2. 중간 메시지 섹션 */}
          <div className="flex-1 bg-white/40 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {/* 메시지가 없을 때의 초기 상태 */}
                <div className="h-full flex items-center justify-center">
                  <Image
                    src="/ciara.svg"
                    alt="AI Sidebar"
                    width={100}
                    height={100}
                    className="opacity-70"
                  />
                </div>

                {/* TODO: 메시지 목록이 여기에 표시될 예정 */}
                {/* 
                <div className="space-y-4">
                  메시지 컴포넌트들이 여기에 렌더링될 예정
                </div>
                */}
              </div>
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
                    className="w-full resize-none border-none outline-none bg-transparent text-xs placeholder-slate-500 min-h-[20px] max-h-[120px] text-slate-600"
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
                    disabled={!inputValue.trim()}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors flex-none",
                      inputValue.trim()
                        ? "text-slate-600"
                        : " text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
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
