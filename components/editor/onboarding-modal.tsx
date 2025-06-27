"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface DocumentConfig {
  purpose: string;
  additionalInfo: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (
    mode: "traditional" | "ai-assisted",
    config?: DocumentConfig
  ) => void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  onSelectMode,
}: OnboardingModalProps) {
  const [step, setStep] = useState<
    "mode-select" | "purpose-select" | "details-input"
  >("mode-select");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

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
    onSelectMode("traditional");
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

  const handleAiSubmit = () => {
    const finalPurpose =
      selectedPurpose === "other" ? customPurpose : selectedPurpose;
    const config: DocumentConfig = {
      purpose: finalPurpose,
      additionalInfo: additionalInfo.trim(),
    };
    onSelectMode("ai-assisted", config);
    onClose();
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
