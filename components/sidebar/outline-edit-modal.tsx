"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  GripVertical,
  Edit3,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  OutlineItem,
  parseMarkdownToOutline,
  outlineToMarkdown,
} from "@/lib/index";

// 정렬 가능한 아이템 컴포넌트
const SortableOutlineItem = React.memo(
  ({
    item,
    index,
    onUpdate,
    onAdd,
    onRemove,
    outlineLength,
  }: {
    item: OutlineItem;
    index: number;
    onUpdate: (id: string, updates: Partial<OutlineItem>) => void;
    onAdd: (afterIndex: number, level: number) => void;
    onRemove: (id: string) => void;
    outlineLength: number;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // 제목 입력 시 Enter 키 처리
    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onAdd(index, item.level);
      }
    };

    // # 개수 입력 처리
    const handleHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // #만 허용하고, 최대 6개까지 제한
      const hashCount = (value.match(/#/g) || []).length;
      if (hashCount <= 6 && value === "#".repeat(hashCount)) {
        onUpdate(item.id, { level: Math.max(1, hashCount) });
      }
    };

    // 레벨 증가/감소 함수
    const adjustLevel = (increment: number) => {
      const newLevel = Math.max(1, Math.min(6, item.level + increment));
      onUpdate(item.id, { level: newLevel });
    };

    return (
      <div ref={setNodeRef} style={style} className="group relative">
        <div
          className={`flex items-center gap-2 p-3 bg-white/60 rounded-md border border-white/30 transition-all duration-200 group-hover:bg-white/80 ${
            item.level === 1
              ? "font-semibold text-gray-900 bg-blue-50/50"
              : item.level === 2
              ? "font-medium text-gray-800 ml-4 bg-blue-50/30"
              : "text-gray-700 ml-8 bg-blue-50/20"
          } ${isDragging ? "shadow-lg" : ""}`}
        >
          <GripVertical
            className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600 transition-colors active:cursor-grabbing flex-shrink-0"
            {...attributes}
            {...listeners}
          />

          {/* # 개수 직접 입력 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="text"
              value={"#".repeat(item.level)}
              onChange={handleHashChange}
              className="w-12 text-xs bg-white/90 border border-gray-300/60 rounded px-1 py-1 font-mono text-blue-600 hover:bg-white focus:outline-none focus:border-blue-300 text-center"
              placeholder="###"
              title="# 개수로 레벨 설정 (최대 3개)"
            />

            {/* 레벨 조정 버튼 */}
            <div className="flex flex-col">
              <button
                onClick={() => adjustLevel(1)}
                disabled={item.level >= 3}
                className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="레벨 증가"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => adjustLevel(-1)}
                disabled={item.level <= 1}
                className="p-0.5 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="레벨 감소"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={item.title}
            onChange={(e) =>
              onUpdate(item.id, {
                title: e.target.value,
              })
            }
            onKeyDown={handleTitleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium placeholder-gray-400 focus:placeholder-gray-300 text-sm"
            placeholder="목차 제목 입력 (Enter로 다음 항목 추가)"
          />

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
            <button
              onClick={() => onAdd(index, item.level)}
              className="p-1.5 text-black hover:bg-white/60 rounded"
              title="아래에 추가"
            >
              <Plus className="h-3 w-3" />
            </button>
            {outlineLength > 1 && (
              <button
                onClick={() => onRemove(item.id)}
                className="p-1.5 text-black hover:bg-white/60 rounded"
                title="삭제"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

SortableOutlineItem.displayName = "SortableOutlineItem";

interface OutlineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (outline: string) => void;
  initialOutline?: string;
}

export function OutlineEditModal({
  isOpen,
  onClose,
  onSave,
  initialOutline = "",
}: OutlineEditModalProps) {
  const [editableOutline, setEditableOutline] = useState<OutlineItem[]>([]);
  const [seed] = useState(() => Math.floor(Math.random() * 1000000));

  // 모달이 열릴 때 초기 목차 파싱
  useEffect(() => {
    if (isOpen) {
      const items = parseMarkdownToOutline(initialOutline, seed);
      setEditableOutline(
        items.length > 0
          ? items
          : [
              {
                id: `outline-${seed}-0`,
                level: 1,
                title: "",
              },
            ]
      );
    }
  }, [isOpen, initialOutline, seed]);

  // ESC 키 이벤트 리스너 추가
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 엔드 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = editableOutline.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = editableOutline.findIndex(
        (item) => item.id === over?.id
      );

      setEditableOutline(arrayMove(editableOutline, oldIndex, newIndex));
    }
  };

  // 저장 핸들러
  const handleSave = () => {
    const markdown = outlineToMarkdown(editableOutline);
    onSave(markdown);
    onClose();
  };

  // 목차 아이템 업데이트 핸들러들을 useCallback으로 메모이제이션
  const handleUpdateOutlineItem = useCallback(
    (id: string, updates: Partial<OutlineItem>) => {
      setEditableOutline((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const handleAddOutlineItem = useCallback(
    (afterIndex: number, level: number = 1) => {
      const newItem: OutlineItem = {
        id: `outline-${seed}-${Date.now()}`,
        level,
        title: "",
      };
      setEditableOutline((prev) => {
        const newOutline = [...prev];
        newOutline.splice(afterIndex + 1, 0, newItem);
        return newOutline;
      });

      // 새로 추가된 항목에 포커스 (약간의 지연 후)
      setTimeout(() => {
        const inputs = document.querySelectorAll(
          'input[placeholder*="목차 제목"]'
        );
        const targetInput = inputs[afterIndex + 1] as HTMLInputElement;
        if (targetInput) {
          targetInput.focus();
        }
      }, 100);
    },
    [seed]
  );

  const handleRemoveOutlineItem = useCallback((id: string) => {
    setEditableOutline((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 빠른 추가 템플릿
  const addTemplate = useCallback(
    (template: "basic" | "detailed") => {
      const templates = {
        basic: [
          { level: 1, title: "서론" },
          { level: 1, title: "본론" },
          { level: 1, title: "결론" },
        ],
        detailed: [
          { level: 1, title: "서론" },
          { level: 2, title: "배경" },
          { level: 2, title: "목적" },
          { level: 1, title: "본론" },
          { level: 2, title: "주요 내용" },
          { level: 3, title: "세부 사항" },
          { level: 1, title: "결론" },
          { level: 2, title: "요약" },
          { level: 2, title: "향후 계획" },
        ],
      };

      const newItems = templates[template].map((item, index) => ({
        id: `outline-${seed}-template-${Date.now()}-${index}`,
        level: item.level,
        title: item.title,
      }));

      setEditableOutline(newItems);
    },
    [seed]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="relative z-10 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden rounded-2xl"
        >
          <div className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl shadow-black/10 rounded-lg overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-medium text-gray-900">
                    목차 편집
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  # 개수로 레벨 설정, Enter 키로 빠른 추가, 드래그로 순서 변경
                </p>
              </div>

              {/* Outline Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <Hash className="h-4 w-4 text-blue-600" />
                    목차
                    <span className="text-xs text-gray-500">
                      ({editableOutline.length}개 항목)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleAddOutlineItem(editableOutline.length - 1, 1)
                      }
                      className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      빠른 추가
                    </button>
                    <button
                      onClick={() => setEditableOutline([])}
                      className="p-1.5 text-black hover:text-red-600 rounded transition-colors flex items-center gap-1"
                      title="전체 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-sm">전체 삭제</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-lg border border-white/30 p-4 h-[400px] overflow-y-auto">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-3">
                      <SortableContext
                        items={editableOutline.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {editableOutline.map((item, index) => (
                          <SortableOutlineItem
                            key={item.id}
                            item={item}
                            index={index}
                            onUpdate={handleUpdateOutlineItem}
                            onAdd={handleAddOutlineItem}
                            onRemove={handleRemoveOutlineItem}
                            outlineLength={editableOutline.length}
                          />
                        ))}
                      </SortableContext>

                      {editableOutline.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="mb-4 text-sm">목차가 비어있습니다.</p>
                          <Button
                            onClick={() => handleAddOutlineItem(-1, 1)}
                            variant="outline"
                            size="sm"
                            className="bg-white/60 hover:bg-white/70 text-gray-700 border border-white/30 backdrop-blur-sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />첫 번째 항목 추가
                          </Button>
                        </div>
                      )}
                    </div>
                  </DndContext>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-2 pt-4 items-center justify-end">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="bg-white/60 hover:bg-white/70 text-gray-700 border border-white/30 backdrop-blur-sm"
                >
                  취소
                </Button>

                <Button
                  onClick={handleSave}
                  className=" bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  저장
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
