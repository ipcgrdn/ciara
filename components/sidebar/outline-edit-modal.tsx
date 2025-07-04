"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Edit3 } from "lucide-react";
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

    return (
      <div ref={setNodeRef} style={style} className="group relative">
        <div
          className={`flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-gray-200/40 transition-all duration-200 group-hover:bg-white/90 group-hover:shadow-sm ${
            item.level === 1
              ? "border-l-4 border-l-blue-500"
              : item.level === 2
              ? "border-l-4 border-l-purple-400 ml-4"
              : "border-l-4 border-l-gray-400 ml-8"
          } ${isDragging ? "shadow-lg" : ""}`}
        >
          <GripVertical
            className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600 transition-colors active:cursor-grabbing"
            {...attributes}
            {...listeners}
          />

          <select
            value={item.level}
            onChange={(e) =>
              onUpdate(item.id, {
                level: parseInt(e.target.value),
              })
            }
            className="text-xs bg-white/90 border border-gray-300/60 rounded-lg px-2 py-1 font-medium text-gray-700 hover:bg-white focus:outline-none focus:border-purple-300"
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>

          <input
            type="text"
            value={item.title}
            onChange={(e) =>
              onUpdate(item.id, {
                title: e.target.value,
              })
            }
            className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium placeholder-gray-400 focus:placeholder-gray-300"
            placeholder="목차 제목 입력"
          />

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => onAdd(index, item.level)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="아래에 추가"
            >
              <Plus className="h-4 w-4" />
            </button>
            {outlineLength > 1 && (
              <button
                onClick={() => onRemove(item.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
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
                title: "새 목차",
              },
            ]
      );
    }
  }, [isOpen, initialOutline, seed]);

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
        title: "새 항목",
      };
      setEditableOutline((prev) => {
        const newOutline = [...prev];
        newOutline.splice(afterIndex + 1, 0, newItem);
        return newOutline;
      });
    },
    [seed]
  );

  const handleRemoveOutlineItem = useCallback((id: string) => {
    setEditableOutline((prev) => prev.filter((item) => item.id !== id));
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/5 backdrop-blur-md z-[100] flex items-center justify-center p-6"
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
          className="w-full max-w-4xl mx-auto"
        >
          <div className="relative backdrop-blur-2xl bg-white/70 border border-white/40 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden">
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
              <div className="w-full h-full bg-gradient-to-br from-transparent via-gray-100/30 to-transparent"></div>
            </div>

            <div className="relative p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100/80 to-pink-100/80 border border-purple-200/60 shadow-lg flex items-center justify-center"
                >
                  <Edit3 className="w-8 h-8 text-purple-600" />
                </motion.div>

                <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                  목차 편집
                </h2>
                <p className="text-gray-600 text-sm font-normal leading-relaxed">
                  드래그하여 순서 변경, 레벨 조정, 추가/삭제가 가능합니다
                </p>
              </div>

              {/* Outline Editor */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="mb-8"
              >
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                            className="bg-white/80 border-gray-300/60 hover:bg-white/90"
                          >
                            <Plus className="h-4 w-4 mr-2" />첫 번째 항목 추가
                          </Button>
                        </div>
                      )}

                      {editableOutline.length > 0 && (
                        <div className="flex justify-center pt-2">
                          <Button
                            onClick={() =>
                              handleAddOutlineItem(
                                editableOutline.length - 1,
                                1
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="bg-white/80 border-gray-300/60 hover:bg-white/90 text-sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />새 항목 추가
                          </Button>
                        </div>
                      )}
                    </div>
                  </DndContext>

                  <div className="mt-4 text-xs text-gray-500 bg-gray-50/80 rounded-xl p-3">
                    <p className="mb-1">
                      <strong>사용법:</strong> 각 항목을 드래그하여 순서를
                      변경하고, 레벨을 선택하여 계층을 조정하세요.
                    </p>
                    <p>H1 (대제목), H2 (중제목), H3 (소제목)</p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="flex items-center justify-between"
              >
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 hover:bg-white/50 font-normal text-sm px-4 py-2 rounded-xl flex items-center space-x-2"
                >
                  <span>취소</span>
                </Button>

                <Button
                  onClick={handleSave}
                  className="bg-black/90 hover:bg-black text-white font-medium text-sm px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
                >
                  저장
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
