"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  BookOpen,
  Upload,
  Sparkles,
  Check,
  X,
  PenTool,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingData {
  title: string;
  documentType: "academic" | "business" | "creative" | "other";
  description: string;
  hasAttachments: boolean;
  generateOutline: boolean;
  attachments: File[];
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

const DOCUMENT_TYPES = [
  {
    id: "academic" as const,
    title: "학술 논문",
    description: "연구 논문, 학위 논문, 리포트",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    id: "business" as const,
    title: "비즈니스 문서",
    description: "보고서, 제안서, 기획서",
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    id: "creative" as const,
    title: "창작 글쓰기",
    description: "소설, 에세이, 블로그",
    icon: <Heart className="h-6 w-6" />,
  },
  {
    id: "other" as const,
    title: "기타",
    description: "일반 문서, 메모, 기타",
    icon: <PenTool className="h-6 w-6" />,
  },
];

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    title: "",
    documentType: "other",
    description: "",
    hasAttachments: false,
    generateOutline: true,
    attachments: [],
  });
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const totalSteps = 6;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete(data);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    updateData({ attachments: files });
  };

  const handleAttachmentClick = (hasAttachments: boolean) => {
    updateData({ hasAttachments });
    if (hasAttachments) {
      setTimeout(() => setShowAttachmentInput(true), 300);
    } else {
      setShowAttachmentInput(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.title.trim().length > 0;
      case 2:
        return data.documentType !== undefined;
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  const stepVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Sparkles className="h-10 w-10 text-black" />
            </div>
            <div>
              <h2 className="text-3xl font-light text-black mb-4">
                새로운 문서 작성을 시작해보세요
              </h2>
              <p className="text-gray-800 leading-relaxed text-md">
                AI와 함께 체계적이고 효율적인 문서 작성 여정을 시작하겠습니다.
                <br />몇 가지 간단한 질문으로 최적화된 작성 환경을
                준비해드릴게요.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black mb-3">
                문서의 제목을 정해주세요
              </h2>
              <p className="text-gray-800">나중에 언제든 변경할 수 있습니다</p>
            </div>
            <div className="space-y-6">
              <Input
                placeholder="예: 인공지능의 미래와 사회적 영향"
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
                className="text-center text-lg h-14 backdrop-blur-md bg-white/20 border-white/30 rounded-xl placeholder:text-gray-500 focus:bg-white/30 transition-all"
                autoFocus
              />
              <Textarea
                placeholder="문서에 대한 간단한 설명을 추가해주세요 (선택사항)"
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                rows={3}
                maxLength={200}
                className="resize-none backdrop-blur-md bg-white/20 border-white/30 rounded-xl placeholder:text-gray-500 focus:bg-white/30 transition-all max-h-24"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black mb-3">
                어떤 종류의 문서인가요?
              </h2>
              <p className="text-gray-800">
                문서 유형에 맞는 최적화된 템플릿을 제공해드릴게요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {DOCUMENT_TYPES.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateData({ documentType: type.id })}
                  className={cn(
                    "p-6 rounded-2xl border transition-all duration-300 text-left",
                    data.documentType === type.id
                      ? "backdrop-blur-md bg-white/30 border-white/40 shadow-xl"
                      : "backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20"
                  )}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-white/30 rounded-xl flex items-center justify-center shadow-md">
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-black mb-1">
                        {type.title}
                      </h3>
                      <p className="text-sm text-gray-800">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Upload className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black mb-3">
                참고 자료가 있나요?
              </h2>
              <p className="text-gray-800">
                기존 자료를 업로드하면 더 정확한 문서를 작성할 수 있어요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAttachmentClick(true)}
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300",
                  data.hasAttachments
                    ? "backdrop-blur-md bg-white/30 border-white/40 shadow-xl"
                    : "backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20"
                )}
              >
                <div className="text-center">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-white/30 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Upload className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-medium text-black mb-1">자료 첨부하기</h3>
                  <p className="text-sm text-gray-800">PDF, DOC, TXT 파일</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAttachmentClick(false)}
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300",
                  !data.hasAttachments
                    ? "backdrop-blur-md bg-white/30 border-white/40 shadow-xl"
                    : "backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20"
                )}
              >
                <div className="text-center">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-white/30 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <PenTool className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-medium text-black mb-1">처음부터 작성</h3>
                  <p className="text-sm text-gray-800">빈 문서로 시작</p>
                </div>
              </motion.button>
            </div>

            <AnimatePresence>
              {data.hasAttachments && showAttachmentInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="w-full p-4 backdrop-blur-md bg-white/20 border border-white/30 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/20 file:text-black hover:file:bg-white/30 transition-all"
                    />
                    {data.attachments.length > 0 && (
                      <div className="mt-3 text-sm text-gray-800">
                        {data.attachments.length}개 파일 선택됨
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-light text-black mb-3">
                목차를 자동으로 생성할까요?
              </h2>
              <p className="text-gray-800">
                AI가 문서 구조를 분석하여 체계적인 목차를 만들어드려요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateData({ generateOutline: true })}
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300 relative",
                  data.generateOutline
                    ? "backdrop-blur-md bg-white/30 border-white/40 shadow-xl"
                    : "backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20"
                )}
              >
                {/* 강력추천 배지 */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  추천
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-white/30 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Check className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-medium text-black mb-1">자동 생성</h3>
                  <p className="text-sm text-gray-800">
                    AI가 목차를 만들어드려요
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateData({ generateOutline: false })}
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300",
                  !data.generateOutline
                    ? "backdrop-blur-md bg-white/30 border-white/40 shadow-xl"
                    : "backdrop-blur-md bg-white/10 border-white/20 hover:bg-white/20"
                )}
              >
                <div className="text-center">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-white/30 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                    <X className="h-6 w-6 text-black" />
                  </div>
                  <h3 className="font-medium text-black mb-1">직접 작성</h3>
                  <p className="text-sm text-gray-800">목차 없이 바로 시작</p>
                </div>
              </motion.button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <Check className="h-10 w-10 text-black" />
            </div>
            <div>
              <h2 className="text-3xl font-light text-black mb-4">
                모든 준비가 완료되었습니다!
              </h2>
              <p className="text-gray-800 leading-relaxed text-lg">
                설정하신 내용을 바탕으로 최적화된 문서 작성 환경을
                준비하겠습니다.
              </p>
            </div>
            <div className="space-y-4 p-6 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl text-left">
              <div className="flex items-center justify-between">
                <span className="text-gray-800">문서 제목</span>
                <span className="font-medium text-black">{data.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-800">문서 유형</span>
                <span className="font-medium text-black">
                  {
                    DOCUMENT_TYPES.find((t) => t.id === data.documentType)
                      ?.title
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-800">첨부 파일</span>
                <span className="font-medium text-black">
                  {data.hasAttachments
                    ? `${data.attachments.length}개`
                    : "없음"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-800">자동 목차</span>
                <span className="font-medium text-black">
                  {data.generateOutline ? "사용" : "사용 안함"}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/10 backdrop-blur-lg flex items-center justify-center p-4 z-[60]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <Card className="backdrop-blur-xl bg-white/50 border-white/20 shadow-2xl">
              <CardHeader className="relative pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-lg font-medium text-black">문서 설정</h1>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all"
                  >
                    <X className="h-4 w-4 text-black" />
                  </button>
                </div>
                <div className="relative">
                  <Progress
                    value={progress}
                    className="h-2 backdrop-blur-md bg-white/20 border border-white/30 rounded-full overflow-hidden"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-800">
                    <span>
                      단계 {currentStep + 1} / {totalSteps}
                    </span>
                    <span>{Math.round(progress)}% 완료</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px] flex flex-col justify-center"
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-between mt-12">
                  <Button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    variant="ghost"
                    className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-6"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    이전
                  </Button>

                  {currentStep === totalSteps - 1 ? (
                    <Button
                      onClick={handleComplete}
                      className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30 rounded-xl px-8 shadow-lg"
                    >
                      시작하기
                      <Sparkles className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30 rounded-xl px-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
