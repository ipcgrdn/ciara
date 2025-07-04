"use client";

import { useState, useRef, useEffect } from "react";
import { BsCloudCheck } from "react-icons/bs";
import { type Document } from "@/lib/documents";
import { cn } from "@/lib/utils";

interface DocumentInputProps {
  document: Document;
  updateTitle: (title: string) => Promise<void>;
  isSaving: boolean;
}

export const DocumentInput = ({
  document,
  updateTitle,
  isSaving,
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
          className="text-lg px-1.5 cursor-text bg-transparent border-b border-gray-300 focus:outline-none focus:border-gray-300 min-w-[200px]"
        />
      ) : (
        <span
          className="text-lg px-1.5 cursor-pointer truncate hover:bg-gray-100 rounded"
          onClick={handleTitleClick}
        >
          {document.title}
        </span>
      )}
      <BsCloudCheck
        className={cn("text-green-600", isSaving && "text-gray-300")}
      />
    </div>
  );
};
