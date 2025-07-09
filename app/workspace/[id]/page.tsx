"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@/components/document/editor";
import { Navbar } from "@/components/document/navbar";
import { Toolbar } from "@/components/document/toolbar";
import { IndexSidebar } from "@/components/sidebar/index-sidebar";
import { AiSidebar } from "@/components/sidebar/ai-sidebar";
import { DocumentProposalPortal } from "@/components/document/document-proposal-portal";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  getDocumentById,
  createDocument,
  updateDocument,
  type Document,
} from "@/lib/documents";
import { Loader2Icon } from "lucide-react";
import { useEditorStore } from "@/store/use-editor-store";
import { markdownToHtml } from "@/lib/utils";

export default function DocumentPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const { editor } = useEditorStore();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 자동 저장을 위한 상태
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState("");

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

  // 문서 제안 Portal 상태 관리
  const [isDocumentProposalOpen, setIsDocumentProposalOpen] = useState(false);
  const [proposedDocumentContent, setProposedDocumentContent] = useState("");
  const [isApplyingProposal, setIsApplyingProposal] = useState(false);

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

  // 문서 제안 관련 핸들러
  const handleDocumentProposal = (proposedContent: string) => {
    setProposedDocumentContent(proposedContent);
    setIsDocumentProposalOpen(true);
  };

  const handleFullDocumentReview = (aggregatedContent: string) => {
    setProposedDocumentContent(aggregatedContent);
    setIsDocumentProposalOpen(true);
  };

  const handleApproveProposal = async (content: string) => {
    if (!editor || !document) return;

    try {
      setIsApplyingProposal(true);

      // 마크다운을 HTML로 변환
      const htmlContent = await markdownToHtml(content);

      // tiptap 에디터에 새 콘텐츠 적용
      editor.commands.setContent(htmlContent);

      // 데이터베이스에 HTML 저장 (일관성 유지)
      await updateDocument(document.id, { content: htmlContent });
      setLastSavedContent(htmlContent);
      setHasUnsavedChanges(false);

      // Portal 닫기
      setIsDocumentProposalOpen(false);
      setProposedDocumentContent("");
    } catch (error) {
      console.error("문서 적용 실패:", error);
    } finally {
      setIsApplyingProposal(false);
    }
  };

  const handleRejectProposal = () => {
    setIsDocumentProposalOpen(false);
    setProposedDocumentContent("");
  };

  // 문서 내용 자동 저장 함수
  const saveDocumentContent = useCallback(
    async (content: string) => {
      if (!document || !user || content === lastSavedContent) return;

      try {
        setIsSaving(true);
        await updateDocument(document.id, { content });
        setLastSavedContent(content);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("문서 내용 저장 실패:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [document, user, lastSavedContent]
  );

  // 디바운스된 자동 저장
  const debouncedSave = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setHasUnsavedChanges(true);

      // 2초 후 자동 저장
      saveTimeoutRef.current = setTimeout(() => {
        saveDocumentContent(content);
      }, 2000);
    },
    [saveDocumentContent]
  );

  // 에디터 내용 변경 감지
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const content = editor.getHTML();
      debouncedSave(content);
    };

    // 에디터 업데이트 이벤트 리스너 등록
    editor.on("update", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, debouncedSave]);

  // 컴포넌트 언마운트 시 마지막 저장
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 저장되지 않은 변경사항이 있으면 즉시 저장
      if (hasUnsavedChanges && editor && document) {
        const content = editor.getHTML();
        updateDocument(document.id, { content }).catch(console.error);
      }
    };
  }, [hasUnsavedChanges, editor, document]);

  // 수동 저장 함수 (Ctrl/Cmd + S)
  const handleManualSave = useCallback(async () => {
    if (!editor || !document) return;

    // 진행중인 자동 저장 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const content = editor.getHTML();
    await saveDocumentContent(content);
  }, [editor, document, saveDocumentContent]);

  // 키보드 단축키 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S (Windows) 또는 Cmd+S (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleManualSave();
      }
    };

    window.document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleManualSave]);

  // 페이지를 벗어날 때 저장되지 않은 변경사항 경고
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue =
          "저장되지 않은 변경사항이 있습니다. 정말 떠나시겠습니까?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // 문서 로드
  const loadDocument = async () => {
    if (!user || !documentId) return;

    try {
      setIsLoading(true);
      const existingDoc = await getDocumentById(documentId);

      if (existingDoc) {
        setDocument(existingDoc);
        setLastSavedContent(existingDoc.content || "");

        // 에디터에 내용 로드
        if (editor && existingDoc.content) {
          editor.commands.setContent(existingDoc.content);
        }
      } else {
        // 문서가 없으면 새로 생성
        const newDoc = await createDocument({
          id: documentId,
          title: "새 문서",
          content: "", // 빈 내용으로 시작
          user_id: user.id,
        });
        setDocument(newDoc);
        setLastSavedContent("");
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

  // 에디터가 준비되고 문서가 로드되면 내용 설정
  useEffect(() => {
    if (editor && document && !isLoading) {
      if (document.content && document.content !== editor.getHTML()) {
        editor.commands.setContent(document.content);
        setLastSavedContent(document.content);
      }
    }
  }, [editor, document, isLoading]);

  // 로딩 상태 또는 인증되지 않은 경우
  if (loading || isLoading || !user || !document) {
    return (
      <div className="min-h-screen bg-[#fafbfd] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center">
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
          isSaving={isSaving || hasUnsavedChanges}
          showIndexSidebar={showIndexSidebar}
          showAiSidebar={showAiSidebar}
          onToggleIndexSidebar={toggleIndexSidebar}
          onToggleAiSidebar={toggleAiSidebar}
          onManualSave={handleManualSave}
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
          <Editor />
        </div>

        {/* 오른쪽 AI 사이드바 */}
        {showAiSidebar && (
          <div className="h-full">
            <AiSidebar
              documentId={documentId}
              className="h-full"
              onDocumentProposal={handleDocumentProposal}
              onFullDocumentReview={handleFullDocumentReview}
            />
          </div>
        )}
      </div>

      {/* 문서 제안 Portal */}
      <DocumentProposalPortal
        isOpen={isDocumentProposalOpen}
        onClose={() => setIsDocumentProposalOpen(false)}
        proposedContent={proposedDocumentContent}
        currentContent={document?.content || ""}
        documentTitle={document?.title || ""}
        onApprove={handleApproveProposal}
        onReject={handleRejectProposal}
        isApplying={isApplyingProposal}
      />
    </div>
  );
}
