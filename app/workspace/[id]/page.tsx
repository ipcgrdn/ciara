"use client";

import { useState, useEffect } from "react";
import { Editor } from "@/components/document/editor";
import { Navbar } from "@/components/document/navbar";
import { Toolbar } from "@/components/document/toolbar";
import { Room } from "@/components/document/room";
import { IndexSidebar } from "@/components/sidebar/index-sidebar";
import { AiSidebar } from "@/components/sidebar/ai-sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  getDocumentById,
  createDocument,
  updateDocument,
  type Document,
} from "@/lib/documents";
import { useEditorStore } from "@/store/use-editor-store";
import { Loader2Icon } from "lucide-react";

export default function DocumentPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  // Unicode 안전한 간단한 해시 함수
  const getContentHash = (content: string): number => {
    let hash = 0;
    if (content.length === 0) return hash;

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }

    return Math.abs(hash);
  };

  // 사이드바 표시 상태 관리
  const [showIndexSidebar, setShowIndexSidebar] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-show-index-sidebar");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [showAiSidebar, setShowAiSidebar] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-show-ai-sidebar");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  // 사이드바 토글 함수들
  const toggleIndexSidebar = () => {
    const newState = !showIndexSidebar;
    setShowIndexSidebar(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ciara-show-index-sidebar",
        JSON.stringify(newState)
      );
    }
  };

  const toggleAiSidebar = () => {
    const newState = !showAiSidebar;
    setShowAiSidebar(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("ciara-show-ai-sidebar", JSON.stringify(newState));
    }
  };

  // 문서 로드
  const loadDocument = async () => {
    if (!user || !documentId) return;

    try {
      setIsLoading(true);
      const existingDoc = await getDocumentById(documentId);

      if (existingDoc) {
        setDocument(existingDoc);
        // 기존 문서 로드 시 초기 해시 설정 (Supabase 내용 기준)
        if (existingDoc.content) {
          const contentHash = getContentHash(existingDoc.content);
          setLastSyncTime(contentHash);
        }
      } else {
        // 문서가 없으면 새로 생성 (빈 내용으로 시작)
        const newDoc = await createDocument({
          id: documentId,
          title: "새 문서",
          content: "", // 빈 내용으로 시작, Liveblocks가 실제 내용 관리
          user_id: user.id,
        });
        setDocument(newDoc);
      }
    } catch (error) {
      console.error("문서 로드 실패:", error);
      // 에러 발생 시 대시보드로 리다이렉트
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // 문서 메타데이터 업데이트 (제목 등)
  const updateDocumentMetadata = async (title: string) => {
    if (!document || !user || isSaving) return;

    try {
      setIsSaving(true);
      const updatedDoc = await updateDocument(document.id, { title });
      setDocument(updatedDoc);
    } catch (error) {
      console.error("문서 메타데이터 업데이트 실패:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 백그라운드 동기화: Liveblocks → Supabase
  const syncToSupabase = async () => {
    if (!document || !user) return;

    try {
      // Editor store에서 현재 편집기 인스턴스 가져오기
      const editor = useEditorStore.getState().editor;
      if (!editor) return;

      // Liveblocks에서 현재 문서 내용 가져오기
      const content = editor.getHTML();

      // 내용이 비어있지 않고, 이전 동기화와 다른 경우에만 동기화
      if (content && content.trim() !== "<p></p>" && content.trim() !== "") {
        // 문서 내용이 변경되었는지 확인
        const contentHash = getContentHash(content);

        if (contentHash !== lastSyncTime) {
          await updateDocument(document.id, { content });
          setLastSyncTime(contentHash);
        }
      }
    } catch (error) {
      console.error("❌ 백그라운드 동기화 실패:", error);
    }
  };

  // 사용자 인증 체크
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // 문서 로드
  useEffect(() => {
    if (user && documentId) {
      loadDocument();
    }
  }, [user, documentId]);

  // 주기적 백그라운드 동기화
  useEffect(() => {
    if (!document || !user) return;

    // 초기 동기화 (10초 후 - 에디터 로드 완료 후)
    const initialSync = setTimeout(() => {
      syncToSupabase();
    }, 10 * 1000);

    // 주기적 동기화 (3분마다)
    const syncInterval = setInterval(() => {
      syncToSupabase();
    }, 3 * 60 * 1000);

    // 페이지 종료 시 마지막 동기화
    const handleBeforeUnload = () => {
      syncToSupabase();
    };

    // 페이지 비활성화 시 동기화 (다른 탭으로 이동 등)
    const handleVisibilityChange = () => {
      if (globalThis.document.hidden) {
        syncToSupabase();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    globalThis.document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      clearTimeout(initialSync);
      clearInterval(syncInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      globalThis.document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [document, user]);

  // 로딩 상태 또는 인증되지 않은 경우
  if (loading || isLoading || !user || !document) {
    return (
      <div className="min-h-screen bg-[#fafbfd] flex items-center justify-center">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Loader2Icon className="w-5 h-5 text-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfd]">
      {/* 상단 고정 네비게이션 */}
      <div className="flex flex-col px-4 pt-2 gap-y-2 fixed top-0 left-0 right-0 z-10 bg-[#fafbfd] print:hidden">
        <Navbar
          document={document}
          updateTitle={updateDocumentMetadata}
          isSaving={isSaving}
          showIndexSidebar={showIndexSidebar}
          showAiSidebar={showAiSidebar}
          onToggleIndexSidebar={toggleIndexSidebar}
          onToggleAiSidebar={toggleAiSidebar}
        />
        <Toolbar />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="pt-[114px] print:pt-0 flex h-screen">
        {/* 왼쪽 Index 사이드바 */}
        {showIndexSidebar && (
          <div className="h-full">
            <IndexSidebar documentId={documentId} className="h-full" />
          </div>
        )}

        {/* 중앙 에디터 영역 */}
        <div className="flex-1 min-w-0">
          <Room roomId={params.id as string}>
            <Editor />
          </Room>
        </div>

        {/* 오른쪽 AI 사이드바 */}
        {showAiSidebar && (
          <div className="h-full">
            <AiSidebar documentId={documentId} className="h-full" />
          </div>
        )}
      </div>
    </div>
  );
}
