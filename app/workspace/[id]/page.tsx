"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [documentNotFound, setDocumentNotFound] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [outlineData, setOutlineData] = useState<string>("");

  // Debounced 저장을 위한 ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 문서 저장 함수
  const saveDocument = useCallback(
    async (updatedDocument: Document) => {
      if (!user || !updatedDocument.id) return;

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
        setShowSavedMessage(true);

        // 3초 후에 저장 메시지 숨기기
        setTimeout(() => {
          setShowSavedMessage(false);
        }, 3000);
      } catch (error) {
        console.error("Error saving document:", error);
      }
    },
    [user]
  );

  // Debounced 저장 함수
  const debouncedSave = useCallback(
    (updatedDocument: Document) => {
      // 기존 타이머가 있으면 취소
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 1.5초 후에 저장 실행
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(updatedDocument);
      }, 1500);
    },
    [saveDocument]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

      // 의미 있는 변경사항이 있는 경우에만 debounced 저장
      if (content.trim() !== "" || updatedDocument.title !== "제목 없는 문서") {
        debouncedSave(updatedDocument);
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

      // 제목이 실제로 변경되었거나 내용이 있는 경우에만 debounced 저장
      if (newTitle.trim() !== "" && newTitle !== "제목 없는 문서") {
        debouncedSave(updatedDocument);
      }
    }
  };

  if (loading || isLoadingDocument) return null;

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  if (documentNotFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-12 h-12 text-gray-400"
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
          <h2 className="text-2xl font-bold font-montserrat text-black mb-4">
            문서를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            요청하신 문서가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-black text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200">
                대시보드로 이동
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl font-medium transition-colors duration-200"
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h2 className="text-2xl font-bold font-montserrat text-black mb-4">
            문서를 불러올 수 없습니다
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            문서를 불러오는 중 오류가 발생했습니다.
          </p>
          <Link href="/dashboard">
            <Button className="bg-black text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200">
              white 대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleOutlineConfirm = (outline: string) => {
    setOutlineData(outline);
  };

  // 사용자 프로필 이미지 URL 가져오기
  const userProfileImage =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const userName =
    user.user_metadata?.name || user.user_metadata?.full_name || user.email;

  return (
    <main className="h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-100 flex-shrink-0 sticky top-0 z-50 bg-white backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Left - Back to Dashboard & Logo */}
            <div className="flex flex-shrink-0">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <span className="text-xl font-bold font-montserrat text-black tracking-wider">
                  ＣＬＡＲＡ
                </span>
              </Link>
            </div>

            {/* Center - Document Title */}
            <div className="flex-1 text-center px-6">
              <input
                type="text"
                value={document.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-semibold font-montserrat text-black bg-transparent border-none outline-none text-center placeholder-gray-400 w-full max-w-md mx-auto focus:bg-gray-50 rounded-lg px-4 py-2 transition-all duration-200"
                placeholder="문서 제목을 입력하세요..."
              />
            </div>

            {/* Right - Save Status & Profile */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Save Status */}
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {showSavedMessage && lastSaved ? (
                  <span>
                    저장됨{" "}
                    {lastSaved.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : null}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" data-profile-dropdown>
                <button
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                >
                  {userProfileImage ? (
                    <Image
                      src={userProfileImage}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[60]"
                    >
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          {userProfileImage ? (
                            <Image
                              src={userProfileImage}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover"
                              width={48}
                              height={48}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {userName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <Cog6ToothIcon className="h-4 w-4" />
                          <span>계정 설정</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                          <UserIcon className="h-4 w-4" />
                          <span>프로필 관리</span>
                        </button>

                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={signOut}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            placeholder="여기서 문서 작성을 시작하세요... AI가 도와드립니다!"
            onContentChange={handleContentChange}
            showToolbar={true}
            showOutline={true}
            showAiChat={true}
            documentId={documentId}
            outlineData={outlineData}
          />
        </motion.div>
      </div>

      {/* 온보딩 모달 */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onOutlineConfirm={handleOutlineConfirm}
      />
    </main>
  );
}
