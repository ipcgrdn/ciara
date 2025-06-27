"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import {
  PlusIcon,
  Cog6ToothIcon,
  FolderIcon,
  UserIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import {
  getUserDocuments,
  updateDocument,
  deleteDocument,
  formatLastModified,
  type Document,
} from "@/lib/documents";

// HTML/마크다운 태그를 제거하고 순수 텍스트만 추출하는 함수
function stripHtmlAndMarkdown(text: string): string {
  if (!text) return "";

  return (
    text
      // HTML 태그 제거
      .replace(/<[^>]*>/g, "")
      // 마크다운 링크 제거 [텍스트](링크) -> 텍스트
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // 마크다운 이미지 제거 ![alt](src)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      // 마크다운 헤더 제거 # ## ###
      .replace(/^#{1,6}\s+/gm, "")
      // 마크다운 굵은 글씨 제거 **텍스트** -> 텍스트
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      // 마크다운 기울임 제거 *텍스트* -> 텍스트
      .replace(/\*([^*]+)\*/g, "$1")
      // 마크다운 코드 블록 제거 ```코드```
      .replace(/```[\s\S]*?```/g, "")
      // 인라인 코드 제거 `코드`
      .replace(/`([^`]+)`/g, "$1")
      // 마크다운 인용구 제거 > 텍스트
      .replace(/^>\s+/gm, "")
      // 마크다운 리스트 제거 - 텍스트, * 텍스트
      .replace(/^[-*+]\s+/gm, "")
      // 숫자 리스트 제거 1. 텍스트
      .replace(/^\d+\.\s+/gm, "")
      // 과도한 공백 제거
      .replace(/\s+/g, " ")
      .trim()
  );
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(
    null
  );
  const [editingTitle, setEditingTitle] = useState("");
  const [documentMenuOpen, setDocumentMenuOpen] = useState<string | null>(null);

  // 새 문서 생성 함수
  const createNewDocument = async () => {
    if (!user) return;

    try {
      // UUID를 미리 생성하여 워크스페이스로 이동
      const newDocumentId = uuidv4();
      router.push(`/workspace/${newDocumentId}`);
    } catch (error) {
      console.error("문서 생성 실패:", error);
    }
  };

  // 문서 목록 불러오기
  const loadDocuments = async () => {
    if (!user) return;

    setIsLoadingDocuments(true);
    try {
      const userDocs = await getUserDocuments(user.id);
      setDocuments(userDocs);
    } catch (error) {
      console.error("문서 불러오기 실패:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // 문서 제목 수정 시작
  const startEditingTitle = (doc: Document) => {
    setEditingDocumentId(doc.id);
    setEditingTitle(doc.title);
    setDocumentMenuOpen(null);
  };

  // 문서 제목 수정 완료
  const finishEditingTitle = async () => {
    if (!editingDocumentId || !editingTitle.trim()) {
      setEditingDocumentId(null);
      setEditingTitle("");
      return;
    }

    try {
      await updateDocument(editingDocumentId, { title: editingTitle.trim() });
      await loadDocuments(); // 문서 목록 새로고침
    } catch (error) {
      console.error("문서 제목 수정 실패:", error);
    } finally {
      setEditingDocumentId(null);
      setEditingTitle("");
    }
  };

  // 문서 제목 수정 취소
  const cancelEditingTitle = () => {
    setEditingDocumentId(null);
    setEditingTitle("");
  };

  // 문서 삭제
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("정말로 이 문서를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteDocument(documentId);
      await loadDocuments(); // 문서 목록 새로고침
    } catch (error) {
      console.error("문서 삭제 실패:", error);
    } finally {
      setDocumentMenuOpen(null);
    }
  };

  // 문서 카드 클릭 (편집 모드가 아닐 때만)
  const handleDocumentClick = (documentId: string) => {
    if (!editingDocumentId) {
      router.push(`/workspace/${documentId}`);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-profile-dropdown]")) {
        setIsProfileDropdownOpen(false);
      }
      if (!target.closest("[data-document-menu]")) {
        setDocumentMenuOpen(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (editingDocumentId) {
          cancelEditingTitle();
        }
        setDocumentMenuOpen(null);
      }
      if (event.key === "Enter" && editingDocumentId) {
        finishEditingTitle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editingDocumentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-sm font-bold">C</span>
          </div>
          <p className="text-gray-800">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  // 사용자 프로필 이미지 URL 가져오기
  const userProfileImage =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const userName =
    user.user_metadata?.name || user.user_metadata?.full_name || user.email;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60">
      {/* Navigation */}
      <nav className="backdrop-blur-sm bg-white/10 border-b border-white/20 relative z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                <span className="text-black text-sm font-bold">C</span>
              </div>
              <span className="text-2xl font-light text-black">CLARA</span>
            </Link>

            <div className="flex items-center space-x-6">
              {/* Profile Dropdown */}
              <div className="relative" data-profile-dropdown>
                <div
                  className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setIsProfileDropdownOpen(true)}
                  onMouseLeave={() => setIsProfileDropdownOpen(false)}
                >
                  {userProfileImage ? (
                    <Image
                      src={userProfileImage}
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
                        className="absolute right-0 top-full mt-2 w-56 backdrop-blur-md bg-white/95 border border-white/30 rounded-lg shadow-2xl z-[9999]"
                        onMouseEnter={() => setIsProfileDropdownOpen(true)}
                        onMouseLeave={() => setIsProfileDropdownOpen(false)}
                      >
                        <div className="p-3 border-b border-white/20">
                          <div className="flex items-center space-x-3">
                            {userProfileImage ? (
                              <Image
                                src={userProfileImage}
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
                                {userName}
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

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-light text-black mb-2">
            환영합니다 {userName} 님
          </h1>
          <p className="text-xl text-gray-800">
            오늘은 어떤 문서를 작성할까요?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Card
              className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer h-full flex-1"
              onClick={createNewDocument}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-black/30 rounded-xl flex items-center justify-center">
                    <PlusIcon className="h-6 w-6 text-black rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black">
                      새 문서 작성
                    </h3>
                    <p className="text-sm text-gray-800">
                      AI와 함께 새로운 문서를 시작하세요
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer flex-1">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-black/30 rounded-xl flex items-center justify-center">
                    <FolderIcon className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black">
                      템플릿 둘러보기
                    </h3>
                    <p className="text-sm text-gray-800">
                      다양한 문서 템플릿을 확인해보세요
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Recent Documents - 2 Column Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full"
        >
          <Card className="backdrop-blur-sm bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-black">최근 문서</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4 animate-spin">
                    <span className="text-black text-sm font-bold">C</span>
                  </div>
                  <p className="text-gray-800">문서를 불러오는 중...</p>
                </div>
              ) : documents.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-black"
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
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-black mb-2">
                    아직 작성된 문서가 없습니다
                  </h3>
                  <p className="text-gray-800 text-center mb-6 max-w-md">
                    AI와 함께 새로운 문서를 작성해보세요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc: Document, index: number) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className={`group relative p-4 backdrop-blur-sm bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200 cursor-pointer ${
                        documentMenuOpen === doc.id ? "z-[9999]" : "z-10"
                      }`}
                      onClick={() => handleDocumentClick(doc.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {editingDocumentId === doc.id ? (
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => {
                                setTimeout(finishEditingTitle, 100);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  finishEditingTitle();
                                } else if (e.key === "Escape") {
                                  cancelEditingTitle();
                                }
                              }}
                              className="w-full font-medium text-black mb-1 bg-white/50 border border-white/50 rounded px-2 py-1 text-sm"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <h4 className="font-medium text-black mb-1 truncate">
                              {doc.title}
                            </h4>
                          )}
                          <p className="text-sm text-gray-800 mb-2 line-clamp-1">
                            {stripHtmlAndMarkdown(doc.content)}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>{formatLastModified(doc.last_modified)}</span>
                          </div>
                        </div>

                        {/* More Options Button */}
                        <div className="relative ml-2" data-document-menu>
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/20 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocumentMenuOpen(
                                documentMenuOpen === doc.id ? null : doc.id
                              );
                            }}
                          >
                            <EllipsisVerticalIcon className="h-4 w-4 text-gray-600" />
                          </button>

                          {/* Dropdown Menu */}
                          <AnimatePresence>
                            {documentMenuOpen === doc.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-1 w-32 backdrop-blur-md bg-white/95 border border-white/30 rounded-lg shadow-lg z-[9999]"
                              >
                                <button
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-black hover:bg-white/20 transition-colors rounded-t-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingTitle(doc);
                                  }}
                                >
                                  <PencilIcon className="h-3 w-3" />
                                  <span>제목 수정</span>
                                </button>
                                <button
                                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors rounded-b-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDocument(doc.id);
                                  }}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                  <span>삭제</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
