"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
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

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOutlineConfirm: (outline: string) => void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  onOutlineConfirm,
}: OnboardingModalProps) {
  const [step, setStep] = useState<
    | "mode-select"
    | "purpose-select"
    | "details-input"
    | "generating-outline"
    | "outline-preview"
    | "outline-edit"
  >("mode-select");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedOutline, setGeneratedOutline] = useState("");
  const [editableOutline, setEditableOutline] = useState<OutlineItem[]>([]);

  // 목차 아이템 인터페이스
  interface OutlineItem {
    id: string;
    level: number;
    title: string;
  }

  const documentPurposes = [
    { id: "report", name: "보고서", description: "업무 보고서, 분석 리포트" },
    { id: "essay", name: "에세이", description: "개인적 글쓰기, 수필" },
    { id: "proposal", name: "기획서", description: "사업 계획서, 제안서" },
    {
      id: "article",
      name: "기사/블로그",
      description: "뉴스 기사, 블로그 포스트",
    },
    { id: "academic", name: "학술 논문", description: "연구 논문, 학술 자료" },
    { id: "creative", name: "창작물", description: "소설, 시나리오, 스토리" },
    { id: "other", name: "기타", description: "직접 입력해주세요" },
  ];

  const handleTraditionalMode = () => {
    onClose();
  };

  const handleAiMode = () => {
    setStep("purpose-select");
  };

  const handlePurposeSelect = (purpose: string) => {
    setSelectedPurpose(purpose);
    if (purpose !== "other") {
      setStep("details-input");
    }
  };

  const handleCustomPurposeNext = () => {
    if (customPurpose.trim()) {
      setStep("details-input");
    }
  };

  const handleAiSubmit = async () => {
    const finalPurpose =
      selectedPurpose === "other" ? customPurpose : selectedPurpose;

    setStep("generating-outline");

    try {
      // AI에게 목차 생성 요청
      const response = await fetch("/api/ai/generate-outline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose: finalPurpose,
          additionalInfo: additionalInfo.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("목차 생성에 실패했습니다.");
      }

      const { outline } = await response.json();

      // 생성된 목차를 상태에 저장하고 미리보기 단계로 이동
      setGeneratedOutline(outline);
      setStep("outline-preview");
    } catch (error) {
      console.error("Error generating outline:", error);
      onClose();
    }
  };

  const handleOutlineConfirm = () => {
    // 목차를 부모 컴포넌트로 전달하고 모달 닫기
    onOutlineConfirm(generatedOutline);
    onClose();
  };

  const handleOutlineEdit = () => {
    // 마크다운을 편집 가능한 구조로 변환
    const items = parseMarkdownToOutline(generatedOutline);
    setEditableOutline(items);
    setStep("outline-edit");
  };

  // 마크다운을 파싱하는 함수
  const parseMarkdownToOutline = (markdown: string): OutlineItem[] => {
    const lines = markdown.split("\n");
    const items: OutlineItem[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("# ")) {
        items.push({
          id: `outline-${Date.now()}-${index}`,
          level: 1,
          title: trimmedLine
            .replace(/^# (\d+\.\s*)?/, "")
            .replace(/\s*\([^)]*\)$/, "")
            .trim(),
        });
      } else if (trimmedLine.startsWith("## ")) {
        items.push({
          id: `outline-${Date.now()}-${index}`,
          level: 2,
          title: trimmedLine
            .replace(/^## (\d+\.\d+\s*)?/, "")
            .replace(/\s*\([^)]*\)$/, "")
            .trim(),
        });
      } else if (trimmedLine.startsWith("### ")) {
        items.push({
          id: `outline-${Date.now()}-${index}`,
          level: 3,
          title: trimmedLine
            .replace(/^### (\d+\.\d+\.\d+\s*)?/, "")
            .replace(/\s*\([^)]*\)$/, "")
            .trim(),
        });
      }
    });

    return items;
  };

  // 편집 가능한 구조를 마크다운으로 변환
  const outlineToMarkdown = (outline: OutlineItem[]): string => {
    return outline
      .map((item) => {
        const prefix = "#".repeat(item.level);
        return `${prefix} ${item.title}`;
      })
      .join("\n\n");
  };

  const handleBackFromEdit = () => {
    // 편집된 내용을 마크다운으로 변환하여 저장
    const markdown = outlineToMarkdown(editableOutline);
    setGeneratedOutline(markdown);
    setStep("outline-preview");
  };

  // 목차 아이템 추가
  const addOutlineItem = (afterIndex: number, level: number = 1) => {
    const newItem: OutlineItem = {
      id: `outline-${Date.now()}`,
      level,
      title: "새 항목",
    };
    const newOutline = [...editableOutline];
    newOutline.splice(afterIndex + 1, 0, newItem);
    setEditableOutline(newOutline);
  };

  // 목차 아이템 삭제
  const removeOutlineItem = (id: string) => {
    setEditableOutline(editableOutline.filter((item) => item.id !== id));
  };

  // 목차 아이템 수정
  const updateOutlineItem = (id: string, updates: Partial<OutlineItem>) => {
    setEditableOutline(
      editableOutline.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

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

  // 정렬 가능한 아이템 컴포넌트
  const SortableOutlineItem = ({
    item,
    index,
  }: {
    item: OutlineItem;
    index: number;
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
              updateOutlineItem(item.id, {
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
              updateOutlineItem(item.id, {
                title: e.target.value,
              })
            }
            className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium placeholder-gray-400 focus:placeholder-gray-300"
            placeholder="목차 제목 입력"
          />

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => addOutlineItem(index, item.level)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="아래에 추가"
            >
              <Plus className="h-4 w-4" />
            </button>
            {editableOutline.length > 1 && (
              <button
                onClick={() => removeOutlineItem(item.id)}
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
  };

  const handleBack = () => {
    if (step === "purpose-select") {
      setStep("mode-select");
    } else if (step === "details-input") {
      setStep("purpose-select");
      setSelectedPurpose("");
      setCustomPurpose("");
    }
  };

  const resetState = () => {
    setStep("mode-select");
    setSelectedPurpose("");
    setCustomPurpose("");
    setAdditionalInfo("");
    setGeneratedOutline("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const getPurposeDisplayName = () => {
    if (selectedPurpose === "other") {
      return customPurpose || "기타";
    }
    return documentPurposes.find((p) => p.id === selectedPurpose)?.name;
  };

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
            handleClose();
          }
        }}
      >
        {step === "mode-select" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="flex items-center justify-center gap-12"
          >
            {/* Traditional Mode Card */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={handleTraditionalMode}
              className="group cursor-pointer"
            >
              <div className="relative w-64 h-96 backdrop-blur-2xl bg-white/70 hover:bg-white/85 border border-white/60 hover:border-white/80 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group-hover:scale-105 group-hover:-rotate-1">
                {/* Subtle texture overlay */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
                  <div className="w-full h-full bg-gradient-to-br from-transparent via-gray-100/40 to-transparent"></div>
                </div>

                <div className="relative p-8 h-full flex flex-col items-center justify-center">
                  {/* Icon */}
                  <div className="w-20 h-20 mb-8 rounded-3xl bg-gray-100/60 border border-gray-200/40 flex items-center justify-center group-hover:bg-gray-50/80 group-hover:scale-110 transition-all duration-500">
                    <svg
                      className="w-10 h-10 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-light text-gray-900 tracking-tight">
                    자유 작성
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* AI-Assisted Mode Card */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              onClick={handleAiMode}
              className="group cursor-pointer"
            >
              <div className="relative w-64 h-96 backdrop-blur-2xl bg-gradient-to-br from-blue-50/70 to-purple-50/70 hover:from-blue-50/85 hover:to-purple-50/85 border border-blue-200/50 hover:border-blue-300/70 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden group-hover:scale-105 group-hover:rotate-1">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 opacity-60"></div>

                <div className="relative p-8 h-full flex flex-col items-center justify-center">
                  {/* Icon */}
                  <div className="w-20 h-20 mb-8 rounded-3xl bg-gradient-to-br from-blue-100/80 to-purple-100/80 border border-blue-200/50 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                    <svg
                      className="w-10 h-10 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-light text-gray-900 tracking-tight">
                    AI 어시스턴트
                  </h3>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : step === "purpose-select" ? (
          // Purpose Selection Step
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="w-full max-w-2xl mx-auto"
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
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100/80 to-purple-100/80 border border-blue-200/60 shadow-lg flex items-center justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </motion.div>

                  <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                    문서 목적 선택
                  </h2>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    작성하려는 문서의 목적을 선택해주세요
                  </p>
                </div>

                {/* Purpose Options */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="grid grid-cols-2 gap-3 mb-8"
                >
                  {documentPurposes.map((purpose, index) => (
                    <motion.div
                      key={purpose.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                      className={purpose.id === "other" ? "col-span-2" : ""}
                    >
                      {purpose.id === "other" ? (
                        // Special handling for "기타" option
                        <div
                          className={`p-4 rounded-2xl border transition-all duration-300 ${
                            selectedPurpose === "other"
                              ? "bg-blue-50/70 border-blue-300/60"
                              : "bg-white/50 hover:bg-white/70 border-white/60 hover:border-white/80"
                          }`}
                        >
                          <button
                            onClick={() => handlePurposeSelect("other")}
                            className="w-full text-left mb-3"
                          >
                            <h3 className="text-base font-medium text-gray-900 mb-1">
                              {purpose.name}
                            </h3>
                            <p className="text-gray-600 text-sm font-normal">
                              {purpose.description}
                            </p>
                          </button>

                          {selectedPurpose === "other" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="space-y-3"
                            >
                              <input
                                type="text"
                                value={customPurpose}
                                onChange={(e) =>
                                  setCustomPurpose(e.target.value)
                                }
                                placeholder="문서 목적을 입력해주세요"
                                className="w-full p-3 rounded-xl border border-gray-200/60 bg-white/80 text-sm font-normal text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-300/60 transition-all duration-200"
                                autoFocus
                              />
                              <button
                                onClick={handleCustomPurposeNext}
                                disabled={!customPurpose.trim()}
                                className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200"
                              >
                                다음 단계
                              </button>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        // Regular purpose options
                        <button
                          onClick={() => handlePurposeSelect(purpose.id)}
                          className="group p-4 rounded-2xl bg-white/50 hover:bg-white/70 border border-white/60 hover:border-white/80 transition-all duration-300 text-left w-full"
                        >
                          <h3 className="text-base font-medium text-gray-900 mb-1">
                            {purpose.name}
                          </h3>
                          <p className="text-gray-600 text-sm font-normal">
                            {purpose.description}
                          </p>
                        </button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Navigation */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="flex justify-start"
                >
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="text-gray-500 hover:text-gray-700 hover:bg-white/50 font-normal text-sm px-4 py-2 rounded-xl flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>이전</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : step === "generating-outline" ? (
          // Outline Generation Step
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="w-full max-w-lg mx-auto"
          >
            <div className="relative backdrop-blur-2xl bg-white/70 border border-white/40 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden">
              {/* Noise texture overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
                <div className="w-full h-full bg-gradient-to-br from-transparent via-gray-100/30 to-transparent"></div>
              </div>

              <div className="relative p-8 text-center">
                {/* Header */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100/80 to-purple-100/80 border border-blue-200/60 shadow-lg flex items-center justify-center"
                >
                  <motion.svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </motion.svg>
                </motion.div>

                <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                  목차 생성 중
                </h2>
                <p className="text-gray-600 text-sm font-normal leading-relaxed mb-8">
                  AI가 입력하신 정보를 바탕으로
                  <br />
                  맞춤형 목차를 생성하고 있습니다...
                </p>

                {/* Loading Animation */}
                <div className="flex justify-center space-x-1 mb-8">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      animate={{
                        y: [-4, 4, -4],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : step === "outline-preview" ? (
          // Outline Preview Step
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
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
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-100/80 to-blue-100/80 border border-green-200/60 shadow-lg flex items-center justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </motion.div>

                  <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                    생성된 목차 미리보기
                  </h2>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    AI가 생성한 목차를 확인해보세요
                  </p>
                </div>

                {/* Outline Preview */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="max-h-96 overflow-y-auto bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6">
                    <div className="space-y-4">
                      {generatedOutline
                        .split("\n")
                        .map((line, index) => {
                          const trimmedLine = line.trim();

                          if (trimmedLine.startsWith("# ")) {
                            const title = trimmedLine
                              .replace(/^# (\d+\.\s*)?/, "")
                              .replace(/\s*\([^)]*\)$/, "");
                            return (
                              <div
                                key={index}
                                className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg"
                              >
                                <h1 className="text-lg font-semibold text-gray-900">
                                  {title}
                                </h1>
                              </div>
                            );
                          } else if (trimmedLine.startsWith("## ")) {
                            const title = trimmedLine
                              .replace(/^## (\d+\.\d+\s*)?/, "")
                              .replace(/\s*\([^)]*\)$/, "");
                            return (
                              <div
                                key={index}
                                className="ml-6 border-l-2 border-gray-300 pl-3 py-1"
                              >
                                <h2 className="text-base font-medium text-gray-800">
                                  {title}
                                </h2>
                              </div>
                            );
                          } else if (trimmedLine.startsWith("### ")) {
                            const title = trimmedLine
                              .replace(/^### (\d+\.\d+\.\d+\s*)?/, "")
                              .replace(/\s*\([^)]*\)$/, "");
                            return (
                              <div key={index} className="ml-12 py-1">
                                <h3 className="text-sm font-normal text-gray-700">
                                  • {title}
                                </h3>
                              </div>
                            );
                          } else if (
                            trimmedLine &&
                            !trimmedLine.startsWith("#")
                          ) {
                            // 제목이 아닌 일반 텍스트는 건너뛰기
                            return null;
                          }
                          return null;
                        })
                        .filter(Boolean)}
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
                    onClick={handleOutlineEdit}
                    className="text-gray-500 hover:text-gray-700 hover:bg-white/50 font-normal text-sm px-4 py-2 rounded-xl flex items-center space-x-2"
                  >
                    <span>수정</span>
                  </Button>

                  <Button
                    onClick={handleOutlineConfirm}
                    className="bg-black/90 hover:bg-black text-white font-medium text-sm px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    확인
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : step === "outline-edit" ? (
          // Outline Edit Step
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
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
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </motion.div>

                  <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                    수정
                  </h2>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed">
                    마크다운 형식으로 목차를 직접 수정하세요
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
                            />
                          ))}
                        </SortableContext>

                        {editableOutline.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="mb-4 text-sm">목차가 비어있습니다.</p>
                            <Button
                              onClick={() => addOutlineItem(-1, 1)}
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
                                addOutlineItem(editableOutline.length - 1, 1)
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
                    onClick={handleBackFromEdit}
                    className="text-gray-500 hover:text-gray-700 hover:bg-white/50 font-normal text-sm px-4 py-2 rounded-xl flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>이전</span>
                  </Button>

                  <Button
                    onClick={() => setStep("outline-preview")}
                    className="bg-black/90 hover:bg-black text-white font-medium text-sm px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    미리보기
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Details Input Step
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="w-full max-w-lg mx-auto"
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
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100/80 to-purple-100/80 border border-blue-200/60 shadow-lg flex items-center justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </motion.div>

                  <h2 className="text-2xl font-medium text-gray-900 mb-3 tracking-tight">
                    추가 정보 입력
                  </h2>
                  <p className="text-gray-600 text-sm font-normal leading-relaxed px-4">
                    선택한 목적:{" "}
                    <span className="font-medium text-gray-900">
                      {getPurposeDisplayName()}
                    </span>
                    <br />더 구체적인 정보를 입력해주세요
                  </p>
                </div>

                {/* Input Area */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="relative">
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="예: 신제품 출시를 위한 마케팅 전략 보고서, 타겟은 20-30대 여성..."
                      className="w-full h-32 p-4 rounded-2xl border border-gray-200/60 bg-white/60 backdrop-blur-sm resize-none focus:outline-none focus:border-blue-300/60 focus:bg-white/80 text-sm font-normal text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm"
                      autoFocus
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-normal">
                      {additionalInfo.length}/300
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
                    onClick={handleBack}
                    className="text-gray-500 hover:text-gray-700 hover:bg-white/50 font-normal text-sm px-4 py-2 rounded-xl flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>이전</span>
                  </Button>

                  <Button
                    onClick={handleAiSubmit}
                    className="bg-black/90 hover:bg-black text-white font-medium text-sm px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    시작하기
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
