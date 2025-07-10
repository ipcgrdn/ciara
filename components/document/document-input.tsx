"use client";

import { useState, useRef, useEffect } from "react";
import { BsCloudCheck } from "react-icons/bs";
import { Loader2Icon } from "lucide-react";
import { type Document } from "@/lib/documents";
import { cn } from "@/lib/utils";

interface DocumentInputProps {
  document: Document;
  updateTitle: (title: string) => Promise<void>;
  isSaving: boolean;
  onManualSave?: () => Promise<void>;
}

export const DocumentInput = ({
  document,
  updateTitle,
  isSaving,
  onManualSave,
}: DocumentInputProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // 문서 제목이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setTitle(document.title);
  }, [document.title]);

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  const handleTitleSave = async () => {
    if (title.trim() && title !== document.title) {
      await updateTitle(title.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitle(document.title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleTitleSave();
  };

  // 편집 모드가 활성화되면 input에 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 저장 상태에 따른 아이콘과 메시지
  const getSaveStatus = () => {
    if (isSaving) {
      return {
        icon: <Loader2Icon className="w-4 h-4 animate-spin" />,
        text: "저장 중...",
        color: "text-slate-600",
      };
    }

    return {
      icon: <BsCloudCheck className="w-4 h-4" />,
      text: "저장됨",
      color: "text-green-600",
    };
  };

  const saveStatus = getSaveStatus();

  return (
    <div className="flex items-center gap-2">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="text-lg px-1.5 cursor-text bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-500 min-w-[200px]"
        />
      ) : (
        <span
          className="text-lg px-1.5 cursor-pointer truncate hover:bg-gray-100 rounded transition-colors font-semibold"
          onClick={handleTitleClick}
        >
          {document.title}
        </span>
      )}

      {/* 저장 상태 표시 */}
      <div
        className="flex items-center gap-1 px-2 rounded-lg bg-gray-50/80 transition-all duration-200 cursor-pointer hover:bg-gray-100/80"
        title={saveStatus.text}
        onClick={onManualSave}
      >
        <span className={cn("transition-colors", saveStatus.color)}>
          {saveStatus.icon}
        </span>
      </div>
    </div>
  );
};
