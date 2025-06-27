"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { OnboardingModal } from "@/components/editor/onboarding-modal";
import { Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";
import {
  getDocumentById,
  createDocument,
  updateDocument,
  type Document,
} from "@/lib/documents";

export default function WorkspacePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [documentNotFound, setDocumentNotFound] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // AI 설정 상태 추가
  const [aiConfig, setAiConfig] = useState<{
    mode: "traditional" | "ai-assisted";
    purpose?: string;
    additionalInfo?: string;
  } | null>(null);

  // 문서 저장 함수
  const saveDocument = async (updatedDocument: Document) => {
    if (!user || !updatedDocument.id) return;

    setIsSaving(true);

    try {
      // 먼저 문서가 DB에 존재하는지 확인
      const existingDoc = await getDocumentById(updatedDocument.id);

      if (existingDoc) {
        // 기존 문서 업데이트
        await updateDocument(updatedDocument.id, {
          title: updatedDocument.title,
          content: updatedDocument.content,
        });
      } else {
        // 새 문서 생성 (fallback으로 생성된 문서인 경우)
        await createDocument({
          id: updatedDocument.id,
          title: updatedDocument.title,
          content: updatedDocument.content,
          user_id: user.id,
        });
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-profile-dropdown]")) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  useEffect(() => {
    const loadDocument = async () => {
      if (!user) return;

      setIsLoadingDocument(true);
      setDocumentNotFound(false);

      try {
        // 기존 문서 로드 시도
        const existingDocument = await getDocumentById(documentId);

        if (existingDocument) {
          setDocument(existingDocument);
          setIsLoadingDocument(false);
          return;
        }

        // 문서가 존재하지 않으면 새 문서로 생성하고 온보딩 표시
        const newDocument: Document = {
          id: documentId,
          title: "제목 없는 문서",
          content: "",
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        };

        setDocument(newDocument);
        setShowOnboarding(true);
      } catch (error) {
        console.error("Error loading document:", error);
        setDocumentNotFound(true);
        setDocument(null);
      } finally {
        setIsLoadingDocument(false);
      }
    };

    if (documentId && user) {
      loadDocument();
    }
  }, [documentId, user]);

  const handleContentChange = (content: string) => {
    if (document) {
      const updatedDocument = {
        ...document,
        content,
        updated_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      };

      setDocument(updatedDocument);

      // 빈 내용이 아니거나 제목이 변경된 경우에만 저장
      if (content.trim() !== "" || updatedDocument.title !== "제목 없는 문서") {
        saveDocument(updatedDocument);
      }
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (document) {
      const updatedDocument = {
        ...document,
        title: newTitle,
        updated_at: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      };

      setDocument(updatedDocument);

      // 제목이 실제로 변경되었거나 내용이 있는 경우에만 저장
      if (newTitle.trim() !== "" && newTitle !== "제목 없는 문서") {
        saveDocument(updatedDocument);
      }
    }
  };

  const handleModeSelect = (
    mode: "traditional" | "ai-assisted",
    config?: { purpose: string; additionalInfo: string }
  ) => {
    if (mode === "ai-assisted" && config) {
      setAiConfig({
        mode: "ai-assisted",
        purpose: config.purpose,
        additionalInfo: config.additionalInfo,
      });

      // 문서 제목을 목적에 따라 자동 설정
      if (document) {
        const purposeNames: Record<string, string> = {
          report: "보고서",
          essay: "에세이",
          proposal: "기획서",
          article: "기사",
          academic: "논문",
          creative: "창작물",
          other: "문서",
        };

        const purposeName = purposeNames[config.purpose] || "문서";
        const newTitle = `새로운 ${purposeName}`;

        const updatedDocument = {
          ...document,
          title: newTitle,
          updated_at: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        };
        setDocument(updatedDocument);
        saveDocument(updatedDocument);
      }
    } else {
      setAiConfig({ mode: "traditional" });
    }
  };

  if (loading || isLoadingDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4 animate-spin">
            <span className="text-black text-sm font-bold">C</span>
          </div>
          <p className="text-gray-800">
            {loading ? "로딩 중..." : "문서를 불러오는 중..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  if (documentNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12H9m6 4H9"
              />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-2xl font-medium text-black mb-2">
            문서를 찾을 수 없습니다
          </h2>
          <p className="text-gray-800 mb-6 max-w-md">
            요청하신 문서가 존재하지 않거나 접근 권한이 없습니다.
            <br />
            대시보드로 이동하시겠습니까?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="backdrop-blur-sm bg-black/80 hover:bg-black text-white border-0 px-6 py-2">
                대시보드로 이동
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="backdrop-blur-sm bg-white/20 hover:bg-white/30 text-black border-white/30 px-6 py-2"
            >
              이전 페이지로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-black mb-2">
            문서를 불러올 수 없습니다
          </h2>
          <p className="text-gray-800 mb-4">
            문서를 불러오는 중 오류가 발생했습니다.
          </p>
          <Link href="/dashboard">
            <Button>대시보드로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex flex-col">
      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-sm bg-white/10 border-b border-black/10 flex-shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center">
            {/* Left - Logo (Fixed Width) */}
            <div className="w-48 flex-shrink-0">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                  <span className="text-black text-sm font-bold">C</span>
                </div>
                <span className="text-2xl font-light text-black">CLARA</span>
              </Link>
            </div>

            {/* Center - Document Title (Flex Grow) */}
            <div className="flex-1 text-center">
              <input
                type="text"
                value={document.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-md font-medium text-black bg-transparent border-none outline-none text-center placeholder-gray-400 w-full max-w-md mx-auto"
                placeholder="문서 제목을 입력하세요..."
              />
            </div>

            {/* Right - User Profile & Status (Fixed Width) */}
            <div className="w-48 flex items-center justify-end space-x-4 flex-shrink-0">
              <div className="text-sm text-gray-800 whitespace-nowrap">
                {isSaving ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    <span>저장 중...</span>
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>저장됨 {lastSaved.toLocaleTimeString()}</span>
                  </span>
                ) : null}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" data-profile-dropdown>
                <div
                  className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setIsProfileDropdownOpen(true)}
                  onMouseLeave={() => setIsProfileDropdownOpen(false)}
                >
                  {user.user_metadata?.avatar_url ||
                  user.user_metadata?.picture ? (
                    <Image
                      src={
                        user.user_metadata?.avatar_url ||
                        user.user_metadata?.picture
                      }
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-black" />
                    </div>
                  )}

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 backdrop-blur-md bg-white/95 border border-white/30 rounded-lg shadow-2xl z-[60]"
                        onMouseEnter={() => setIsProfileDropdownOpen(true)}
                        onMouseLeave={() => setIsProfileDropdownOpen(false)}
                      >
                        <div className="p-3 border-b border-white/20">
                          <div className="flex items-center space-x-3">
                            {user.user_metadata?.avatar_url ||
                            user.user_metadata?.picture ? (
                              <Image
                                src={
                                  user.user_metadata?.avatar_url ||
                                  user.user_metadata?.picture
                                }
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="w-10 h-10 backdrop-blur-md bg-white/20 border border-white/30 rounded-full flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-black" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-black truncate">
                                {user.user_metadata?.name ||
                                  user.user_metadata?.full_name ||
                                  user.email}
                              </p>
                              <p className="text-xs text-gray-800 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-black hover:bg-white/20 rounded-md transition-colors">
                            <Cog6ToothIcon className="h-4 w-4" />
                            <span>계정 설정</span>
                          </button>
                          <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-black hover:bg-white/20 rounded-md transition-colors">
                            <UserIcon className="h-4 w-4" />
                            <span>프로필 관리</span>
                          </button>

                          <div className="border-t border-white/20 mt-2 pt-2">
                            <button
                              onClick={signOut}
                              className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50/50 rounded-md transition-colors"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              <span>로그아웃</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Editor Section - Full Height Layout */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-full"
        >
          <TiptapEditor
            content={document.content}
            placeholder="여기서 문서 작성을 시작하세요... AI가 도워드립니다!"
            onContentChange={handleContentChange}
            showToolbar={true}
            showOutline={true}
            showAiChat={true}
          />
        </motion.div>
      </div>

      {/* 온보딩 모달 */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSelectMode={handleModeSelect}
      />
    </main>
  );
}
