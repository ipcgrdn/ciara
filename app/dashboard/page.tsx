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
} from "@heroicons/react/24/outline";
import Image from "next/image";

// 임시 문서 데이터 (나중에 Supabase에서 가져올 예정)
const mockDocuments = [
  {
    id: 1,
    title: "인공지능과 미래사회",
    content: "인공지능 기술의 발전이 우리 사회에 미치는 영향에 대한 연구...",
    lastModified: "2024-01-15",
  },
  {
    id: 2,
    title: "기후변화 대응 방안",
    content: "전 지구적 기후변화 문제에 대한 종합적 분석과 해결책...",
    lastModified: "2024-01-12",
  },
  {
    id: 3,
    title: "디지털 마케팅 전략",
    content: "소셜미디어 시대의 효과적인 마케팅 전략 수립...",
    lastModified: "2024-01-10",
  },
];

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState(mockDocuments);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // 새 문서 생성 함수
  const createNewDocument = () => {
    const newDocumentId = uuidv4();
    router.push(`/workspace/${newDocumentId}`);
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              {documents.length === 0 ? (
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
                  {documents.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      className="p-4 backdrop-blur-sm bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/workspace/${doc.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-black mb-1">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-gray-800 mb-2 line-clamp-1">
                            {doc.content}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span>{doc.lastModified}</span>
                          </div>
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
