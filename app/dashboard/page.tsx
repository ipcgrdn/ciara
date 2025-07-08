"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { createPortal } from "react-dom";
import {
  PlusIcon,
  Cog6ToothIcon,
  UserIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import {
  getUserDocuments,
  updateDocument,
  deleteDocument,
  formatLastModified,
  type Document,
} from "@/lib/documents";

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
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>(
    {}
  );

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

  // 드롭다운 메뉴 열기 및 위치 계산
  const handleMenuOpen = (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (documentMenuOpen === documentId) {
      setDocumentMenuOpen(null);
      return;
    }

    const button = menuButtonRefs.current[documentId];
    if (button) {
      const rect = button.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 96; // 대략적인 메뉴 높이

      // 화면 경계를 고려한 위치 계산
      let x = rect.right - menuWidth;
      let y = rect.bottom + 8;

      // 오른쪽 경계 체크
      if (x < 8) {
        x = 8;
      }

      // 왼쪽 경계 체크
      if (x + menuWidth > window.innerWidth - 8) {
        x = window.innerWidth - menuWidth - 8;
      }

      // 아래쪽 경계 체크
      if (y + menuHeight > window.innerHeight - 8) {
        y = rect.top - menuHeight - 8;
      }

      setMenuPosition({ x, y });
    }

    setDocumentMenuOpen(documentId);
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
      // 드롭다운 메뉴나 메뉴 버튼을 클릭하지 않았을 때만 닫기
      if (
        !target.closest("[data-document-menu]") &&
        !target.closest(".fixed")
      ) {
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

    const handleScroll = () => {
      if (documentMenuOpen) {
        setDocumentMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [editingDocumentId]);

  // 드롭다운 메뉴 컴포넌트
  const DropdownMenu = ({
    documentId,
    doc,
  }: {
    documentId: string;
    doc: Document;
  }) => {
    if (documentMenuOpen !== documentId || typeof window === "undefined")
      return null;

    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="fixed w-40 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-[99999]"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
          }}
        >
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors rounded-t-xl"
            onClick={(e) => {
              e.stopPropagation();
              startEditingTitle(doc);
            }}
          >
            <PencilIcon className="h-4 w-4" />
            <span>제목 수정</span>
          </button>
          <button
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-colors rounded-b-xl"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDocument(doc.id);
            }}
          >
            <TrashIcon className="h-4 w-4" />
            <span>삭제</span>
          </button>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#fafbfd] flex items-center justify-center">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Loader2Icon className="w-5 h-5 text-gray-700" />
        </div>
      </div>
    );

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
      <nav className="border-b border-gray-100/50 sticky top-0 z-40 backdrop-blur-xl bg-transparent">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={100}
                height={100}
                className="w-32 h-32 invert"
              />
            </Link>

            {/* Profile Section */}
            <div className="flex items-center space-x-4">
              <div className="relative" data-profile-dropdown>
                <button
                  className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-50/80 transition-all duration-200"
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
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-3 w-64 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl z-[9999]"
                    >
                      <div className="p-4 border-b border-gray-100/50">
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
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 rounded-xl transition-colors">
                          <Cog6ToothIcon className="h-4 w-4" />
                          <span>계정 설정</span>
                        </button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 rounded-xl transition-colors">
                          <UserIcon className="h-4 w-4" />
                          <span>프로필 관리</span>
                        </button>

                        <div className="border-t border-gray-100/50 mt-2 pt-2">
                          <button
                            onClick={signOut}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50/80 rounded-xl transition-colors"
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

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-lg md:text-2xl font-bold font-montserrat text-black mb-4 tracking-wide">
            환영합니다,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-black">
              {userName?.split(" ")[0] || "User"}님
            </span>
          </h1>
          <p className="text-lg text-black opacity-50">
            오늘은 어떤 글을 작성해볼까요?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Document Button */}
            <button
              onClick={createNewDocument}
              className="group flex items-center justify-between bg-white/50 backdrop-blur-sm border border-gray-300 rounded-2xl p-6 hover:bg-white/80 hover:border-gray-400 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <PlusIcon className="h-5 w-5 text-gray-700" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold font-montserrat text-black">
                    새 문서 작성
                  </h3>
                  <p className="text-sm text-gray-600">
                    AI와 함께 문서를 작성해보세요
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-300" />
            </button>

            {/* Secondary Actions */}
            <button className="group flex items-center justify-between bg-white/50 backdrop-blur-sm border border-gray-300 rounded-2xl p-6 hover:bg-white/80 hover:border-gray-400 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpTrayIcon className="h-5 w-5 text-gray-700" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold font-montserrat text-black">
                    파일 업로드
                  </h3>
                  <p className="text-sm text-gray-600">
                    작업하시던 문서가 있나요?
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </div>
        </motion.div>

        {/* Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="mb-8">
            <h2 className="text-lg font-bold font-montserrat text-black">
              최근 문서
            </h2>
          </div>

          {!isLoadingDocuments && documents.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 bg-white/30 backdrop-blur-sm border border-gray-200/50 rounded-2xl">
              <div className="w-16 h-16 flex items-center justify-center mb-4">
                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold font-montserrat text-black mb-2">
                첫 번째 문서를 만들어보세요
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md text-sm">
                Ciara와 함께 새로운 문서 작성 경험을 시작해보세요.
              </p>
              <button
                onClick={createNewDocument}
                className="bg-gray-100/50 text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>새 문서 만들기</span>
              </button>
            </div>
          ) : (
            /* Document List */
            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: Document, index: number) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className={`group flex items-center justify-between bg-white/50 backdrop-blur-sm border border-gray-300 rounded-xl p-4 hover:bg-white/80 hover:border-gray-400 transition-all duration-300 cursor-pointer ${
                    documentMenuOpen === doc.id ? "z-[9999]" : "z-10"
                  }`}
                  onClick={() => handleDocumentClick(doc.id)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                    </div>

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
                          className="w-full font-semibold text-black bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-black"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 className="font-semibold text-black text-sm truncate">
                          {doc.title}
                        </h4>
                      )}

                      <div className="flex mt-1">
                        <div className="flex items-center text-xs text-gray-400">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          <span>{formatLastModified(doc.last_modified)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* More Options Button */}
                  <div className="relative" data-document-menu>
                    <button
                      ref={(el) => {
                        menuButtonRefs.current[doc.id] = el;
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
                      onClick={(e) => handleMenuOpen(doc.id, e)}
                    >
                      <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
                    </button>

                    <DropdownMenu documentId={doc.id} doc={doc} />
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
