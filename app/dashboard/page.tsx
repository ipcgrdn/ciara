"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
  DocumentTextIcon,
  ClockIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import {
  getUserDocuments,
  updateDocument,
  deleteDocument,
  formatLastModified,
  type Document,
} from "@/lib/documents";
import Loading from "@/components/layout/loading";

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

  if (loading) return null;

  if (!user) {
    return null; // 리다이렉트 처리 중
  }

  // 사용자 프로필 이미지 URL 가져오기
  const userProfileImage =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const userName =
    user.user_metadata?.name || user.user_metadata?.full_name || user.email;

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 z-40 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-2xl font-bold font-montserrat text-black tracking-wider">
                ＣＩＡＲＡ
              </span>
            </Link>

            {/* Profile Section */}
            <div className="flex items-center space-x-4">
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

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999]"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-2xl md:text-4xl font-bold font-montserrat text-black mb-4 tracking-wide">
            환영합니다,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-black">
              {userName?.split(" ")[0] || "User"}님
            </span>
          </h1>
          <p className="text-xl text-black opacity-50">
            오늘은 어떤 글을 작성해볼까요?
          </p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {/* New Document Card */}
          <Card
            className="group bg-white border border-gray-200 hover:border-black hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={createNewDocument}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <PlusIcon className="h-6 w-6 text-black" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-xl font-semibold font-montserrat text-black mb-2">
                새 문서 작성
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI와 함께 새로운 아이디어를 문서로 만들어보세요
              </p>
            </CardContent>
          </Card>

          {/* Upload Document from file */}
          <Card className="group bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer md:col-span-2 lg:col-span-1">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpTrayIcon className="h-6 w-6 text-gray-700" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-xl font-semibold font-montserrat text-black mb-2">
                파일 업로드
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                작업하시던 문서가 있나요?
              </p>
            </CardContent>
          </Card>

          {/* Templates Card */}
          <Card className="group bg-white border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FolderIcon className="h-6 w-6 text-gray-700" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <h3 className="text-xl font-semibold font-montserrat text-black mb-2">
                템플릿 살펴보기
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                다양한 문서 템플릿으로 빠르게 시작하세요
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex mb-8">
            <h2 className="text-2xl font-bold font-montserrat text-black">
              내 문서
            </h2>
          </div>

          {isLoadingDocuments ? (
            <Loading />
          ) : documents.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold font-montserrat text-black mb-4">
                첫 번째 문서를 만들어보세요
              </h3>
              <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
                CIARA와 함께 새로운 문서를 작성하고 AI의 도움을 받아보세요.
              </p>
              <button
                onClick={createNewDocument}
                className="bg-gray-200 text-black px-8 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors duration-200 flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>새 문서 만들기</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc: Document, index: number) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className={`group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                    documentMenuOpen === doc.id ? "z-[9999]" : "z-10"
                  }`}
                  onClick={() => handleDocumentClick(doc.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                    </div>

                    {/* More Options Button */}
                    <div className="relative" data-document-menu>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocumentMenuOpen(
                            documentMenuOpen === doc.id ? null : doc.id
                          );
                        }}
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {documentMenuOpen === doc.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999]"
                          >
                            <button
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingTitle(doc);
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                              <span>제목 수정</span>
                            </button>
                            <button
                              className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id);
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>삭제</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex-1">
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
                        className="w-full font-semibold font-montserrat text-black mb-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-black"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h4 className="font-semibold font-montserrat text-black mb-3 text-lg line-clamp-2 leading-tight">
                        {doc.title}
                      </h4>
                    )}

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {stripHtmlAndMarkdown(doc.content) || "내용이 없습니다."}
                    </p>

                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      <span>{formatLastModified(doc.last_modified)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
