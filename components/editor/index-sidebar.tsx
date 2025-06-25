"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IndexSidebarProps {
  className?: string;
}

export function IndexSidebar({ className }: IndexSidebarProps) {
  const [width, setWidth] = useState(320); // 기본 너비 320px (w-80)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 240; // w-60
  const MAX_WIDTH = 480; // 최대 너비 제한

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      document.body.style.userSelect = "none"; // 리사이즈 중 텍스트 선택 방지
      document.body.style.cursor = "col-resize"; // 전역 커서 변경
      document.body.style.transition = "none"; // 리사이즈 중 부드러운 전환

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => {
          const diff = e.clientX - startX;
          const newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, startWidth + diff)
          );
          setWidth(newWidth);
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.userSelect = ""; // 텍스트 선택 복원
        document.body.style.cursor = ""; // 커서 복원
        document.body.style.transition = ""; // 전환 복원
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width]
  );

  return (
    <div
      ref={sidebarRef}
      className={cn("relative h-full flex", className)}
      style={{ width: `${width}px` }}
    >
      <Card className="flex-1 backdrop-blur-md bg-white/5 border-white/10 shadow-2xl flex flex-col">
        <CardHeader className="border-b border-black/10 flex-shrink-0">
          Index
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <div className="h-full text-slate-600">
            {/* 인덱스 내용이 여기에 들어갑니다 */}
          </div>
        </CardContent>
      </Card>

      {/* 리사이즈 핸들 */}
      <div
        className={cn(
          "w-1 cursor-col-resize hover:bg-yellow-300/60 transition-all duration-300 flex-shrink-0",
          isResizing ? "bg-yellow-400/80" : "bg-transparent"
        )}
        onMouseDown={handleMouseDown}
        style={{ transition: "background-color 0.3s ease" }}
      >
        <div className="w-full h-full relative">
          {/* 리사이즈 인디케이터 */}
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-transparent hover:bg-yellow-300/50 transition-all duration-300" />
        </div>
      </div>
    </div>
  );
}
