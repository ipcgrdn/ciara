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

// 문서 타입 정의
interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  created_at?: string;
}

// 온보딩 데이터 타입 정의
interface OnboardingData {
  title: string;
  documentType: "academic" | "business" | "creative" | "other";
  description: string;
  hasAttachments: boolean;
  generateOutline: boolean;
  attachments: File[];
}

// 임시 문서 데이터 (나중에 완전히 Supabase로 교체)
const mockDocuments: Record<string, Document> = {
  "1": {
    id: "1",
    title: "인공지능과 미래사회",
    content:
      "<h1>인공지능과 미래사회</h1><p>인공지능 기술의 발전이 우리 사회에 미치는 영향에 대한 연구...</p><p>현재 우리는 제4차 산업혁명의 한복판에 서 있습니다.</p>",
    lastModified: "2024-01-15",
  },
  "2": {
    id: "2",
    title: "기후변화 대응 방안",
    content:
      "<h1>기후변화 대응 방안</h1><p>전 지구적 기후변화 문제에 대한 종합적 분석과 해결책...</p>",
    lastModified: "2024-01-12",
  },
  "3": {
    id: "3",
    title: "디지털 마케팅 전략",
    content:
      "<h1>디지털 마케팅 전략</h1><p>소셜미디어 시대의 효과적인 마케팅 전략 수립...</p>",
    lastModified: "2024-01-10",
  },
};

export default function WorkspacePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // 문서 저장 함수
  const saveDocument = async (updatedDocument: Document) => {
    if (!user || !updatedDocument.id) return;

    setIsSaving(true);

    try {
      // Supabase에 문서 업데이트 (테이블이 준비되면 주석 해제)
      // const { error } = await supabase
      //   .from('documents')
      //   .update({
      //     title: updatedDocument.title,
      //     content: updatedDocument.content,
      //     word_count: updatedDocument.wordCount,
      //     status: updatedDocument.status,
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', updatedDocument.id)
      //   .eq('user_id', user.id)

      // if (error) {
      //   console.error('Error saving document:', error)
      //   return
      // }

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

      // 기존 문서 로드 시도
      try {
        // Supabase에서 문서 로드 (테이블이 준비되면 주석 해제)
        // const { data, error } = await supabase
        //   .from('documents')
        //   .select('*')
        //   .eq('id', documentId)
        //   .eq('user_id', user.id)
        //   .single()

        // if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        //   console.error('Error loading document:', error)
        //   return
        // }

        // if (data) {
        //   setDocument({
        //     id: data.id,
        //     title: data.title,
        //     content: data.content,
        //     lastModified: data.updated_at?.split('T')[0] || data.created_at?.split('T')[0],
        //     wordCount: data.word_count,
        //     status: data.status,
        //     user_id: data.user_id
        //   })
        //   return
        // }

        // 임시로 목 데이터 확인
        if (mockDocuments[documentId]) {
          setDocument(mockDocuments[documentId]);
          return;
        }

        // 문서가 존재하지 않으면 새 문서로 생성
        const newDocument: Document = {
          id: documentId,
          title: "제목 없는 문서",
          content: "<p>여기서 문서 작성을 시작하세요...</p>",
          lastModified: new Date().toISOString().split("T")[0],
        };

        setDocument(newDocument);
        setShowOnboarding(true);

        // Supabase에 새 문서 저장 (테이블이 준비되면 주석 해제)
        // const { error: insertError } = await supabase
        //   .from('documents')
        //   .insert([{
        //     id: newDocument.id,
        //     title: newDocument.title,
        //     content: newDocument.content,
        //     word_count: newDocument.wordCount,
        //     status: newDocument.status,
        //     user_id: newDocument.user_id
        //   }])

        // if (insertError) {
        //   console.error('Error creating document:', insertError)
        // }
      } catch (error) {
        console.error("Error loading document:", error);
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
      };

      setDocument(updatedDocument);

      // 자동 저장 (디바운싱 적용하면 더 좋음)
      saveDocument(updatedDocument);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (document) {
      const updatedDocument = {
        ...document,
        title: newTitle,
      };

      setDocument(updatedDocument);
      saveDocument(updatedDocument);
    }
  };

  const handleOnboardingComplete = (onboardingData: OnboardingData) => {
    if (document) {
      const updatedDocument = {
        ...document,
        title: onboardingData.title || "제목 없는 문서",
        content: "",
      };

      setDocument(updatedDocument);
      saveDocument(updatedDocument);
    }
    setShowOnboarding(false);
  };


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

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-black mb-2">
            문서를 찾을 수 없습니다
          </h2>
          <p className="text-gray-800 mb-4">
            요청하신 문서가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Link href="/dashboard">
            <Button>대시보드로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Document Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

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
      </main>
    </>
  );
}
