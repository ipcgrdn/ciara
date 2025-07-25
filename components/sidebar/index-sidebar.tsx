"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  parseMarkdownToOutline,
  getDocumentIndex,
  saveDocumentIndex,
} from "@/lib/index";
import {
  BookOpen,
  List,
  Upload,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  File,
  X,
  AlertCircle,
  Edit,
} from "lucide-react";
import { OutlineEditModal } from "./outline-edit-modal";
import {
  KnowledgeItem,
  getKnowledgeByDocumentId,
  uploadKnowledgeFile,
  deleteKnowledgeFile,
  validateFile,
  getFileType,
  SUPPORTED_FILE_EXTENSIONS,
} from "@/lib/knowledge";

interface IndexSidebarProps {
  className?: string;
  documentId: string; // 현재 문서 ID
  outlineData?: string;
  onOutlineChange?: (outline: string) => void; // 목차 변경 콜백
}

export function IndexSidebar({
  className,
  documentId,
  outlineData = "",
  onOutlineChange,
}: IndexSidebarProps) {
  const [currentOutlineData, setCurrentOutlineData] = useState(outlineData);
  const outline = parseMarkdownToOutline(currentOutlineData);

  // localStorage에서 너비 설정 불러오기
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-index-sidebar-width");
      return saved ? parseInt(saved, 10) : 320;
    }
    return 320;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isKnowledgeExpanded, setIsKnowledgeExpanded] = useState(false);
  const [isIndexExpanded, setIsIndexExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MIN_WIDTH = 240; // w-60
  const MAX_WIDTH = 400; // 최대 너비 제한

  // 너비 변경 시 localStorage에 저장
  const updateWidth = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (typeof window !== "undefined") {
      localStorage.setItem("ciara-index-sidebar-width", newWidth.toString());
    }
  }, []);

  // 문서 ID가 변경될 때마다 knowledge 파일들과 목차 로드
  useEffect(() => {
    if (documentId) {
      loadKnowledgeItems();
      loadDocumentOutline();
    }
  }, [documentId]);

  // 목차 업데이트 이벤트 리스너 추가
  useEffect(() => {
    const handleIndexUpdate = (event: CustomEvent) => {
      const { documentId: updatedDocumentId, indexContent } = event.detail;

      // 현재 문서의 목차 업데이트인지 확인
      if (updatedDocumentId === documentId) {
        setCurrentOutlineData(indexContent);
        onOutlineChange?.(indexContent);
      }
    };

    window.addEventListener("indexUpdated", handleIndexUpdate as EventListener);

    return () => {
      window.removeEventListener(
        "indexUpdated",
        handleIndexUpdate as EventListener
      );
    };
  }, [documentId, onOutlineChange]);

  // 목차 데이터가 외부에서 변경될 때 반영
  useEffect(() => {
    setCurrentOutlineData(outlineData);
  }, [outlineData]);

  // Knowledge 파일들 로드
  const loadKnowledgeItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await getKnowledgeByDocumentId(documentId);
      setKnowledgeItems(items);
    } catch (error) {
      console.error("Error loading knowledge items:", error);
      setError("파일 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  // 문서 목차 로드
  const loadDocumentOutline = useCallback(async () => {
    try {
      const indexData = await getDocumentIndex(documentId);
      if (indexData && indexData.outline_markdown) {
        setCurrentOutlineData(indexData.outline_markdown);
      }
    } catch (error) {
      console.error("Error loading document outline:", error);
    }
  }, [documentId]);

  // 목차 저장
  const handleSaveOutline = useCallback(
    async (newOutline: string) => {
      try {
        await saveDocumentIndex(documentId, newOutline);
        setCurrentOutlineData(newOutline);
        onOutlineChange?.(newOutline);
      } catch (error) {
        console.error("Error saving document outline:", error);
        setError("목차 저장에 실패했습니다.");
      }
    },
    [documentId, onOutlineChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      document.body.style.userSelect = "none"; // 리사이즈 중 텍스트 선택 방지
      document.body.style.cursor = "col-resize"; // 전역 커서 변경
      document.body.style.transition = "none"; // 리사이즈 중 부드러운 전환

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => {
          const diff = e.clientX - startX;
          const newWidth = Math.max(
            MIN_WIDTH,
            Math.min(MAX_WIDTH, startWidth + diff)
          );
          updateWidth(newWidth);
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.body.style.userSelect = ""; // 텍스트 선택 복원
        document.body.style.cursor = ""; // 커서 복원
        document.body.style.transition = ""; // 전환 복원
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, updateWidth]
  );

  // 파일 처리 함수 (백그라운드 처리)
  const processFiles = useCallback(
    async (files: FileList) => {
      setError(null);

      for (const file of Array.from(files)) {
        // 파일 유효성 검사
        const validation = validateFile(file);
        if (!validation.isValid) {
          setError(validation.error || "파일이 유효하지 않습니다.");
          continue;
        }

        try {
          // 백그라운드에서 Supabase에 파일 업로드
          const knowledgeItem = await uploadKnowledgeFile(file, {
            document_id: documentId,
            original_filename: file.name,
            file_type: getFileType(file.type),
            mime_type: file.type,
            file_size: file.size,
            tag: "참고자료", // 기본 태그
          });

          // 성공 시 목록에 추가
          setKnowledgeItems((prev) => [knowledgeItem, ...prev]);
        } catch (error) {
          console.error("File upload error:", error);
          setError(
            error instanceof Error
              ? error.message
              : "파일 업로드에 실패했습니다."
          );
        }
      }
    },
    [documentId]
  );

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
        // 드롭 시 Knowledge 섹션 자동 확장
        if (!isKnowledgeExpanded) {
          setIsKnowledgeExpanded(true);
        }
      }
    },
    [processFiles, isKnowledgeExpanded]
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        processFiles(files);
      }
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFiles]
  );

  // 아이템 삭제
  const removeKnowledgeItem = useCallback(async (id: string) => {
    try {
      await deleteKnowledgeFile(id);
      setKnowledgeItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      setError("파일 삭제에 실패했습니다.");
    }
  }, []);

  // 에러 메시지 자동 숨김
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 아이콘 선택
  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "text":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={sidebarRef}
      className={cn("relative h-full flex", className)}
      style={{ width: `${width}px` }}
    >
      <Card className="flex-1 flex flex-col p-0">
        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700">{error}</span>
          </div>
        )}

        <CardContent className="flex-1 p-0 flex flex-col h-full overflow-hidden">
          {/* Knowledge 폴더 섹션 */}
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              // 동적 높이 분배 로직
              isKnowledgeExpanded && isIndexExpanded
                ? "flex-1" // 둘 다 열려있으면 각각 flex-1
                : isKnowledgeExpanded && !isIndexExpanded
                ? "flex-1" // Knowledge만 열려있으면 전체 높이
                : "flex-none", // 닫혀있으면 헤더만
              isDragOver &&
                "bg-blue-50/80 border-2 border-dashed border-blue-300"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button
              onClick={() => setIsKnowledgeExpanded(!isKnowledgeExpanded)}
              className={cn(
                "w-full p-4 flex items-center gap-2 hover:bg-slate-100/50 transition-colors flex-none",
                isDragOver && "bg-blue-50/50"
              )}
            >
              {isKnowledgeExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">
                Knowledge
              </span>
              {knowledgeItems.length > 0 && (
                <span className="ml-auto p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors text-xs">
                  {knowledgeItems.length}
                </span>
              )}
            </button>

            {isKnowledgeExpanded && (
              <div className="px-4 pb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {knowledgeItems.length === 0 && !isLoading ? (
                  <div
                    className={cn(
                      "h-full bg-slate-100/50 rounded-lg border-2 border-dashed border-slate-200/40 p-3 transition-all duration-300",
                      "flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/70",
                      isDragOver && "border-blue-300 bg-blue-50/50"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5 text-slate-400 mb-2" />
                    <div className="text-xs text-slate-500 text-center">
                      {isDragOver
                        ? "파일을 놓아주세요"
                        : "자료를 드래그하거나 클릭해서 추가하세요"}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="space-y-1 h-full overflow-y-auto pr-1">
                      {knowledgeItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 hover:bg-slate-100/50 transition-colors group rounded flex-none"
                        >
                          <div className="text-slate-600 flex-shrink-0">
                            {getFileIcon(item.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700">
                              {item.original_filename}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatFileSize(item.file_size)}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all duration-200">
                            <button
                              onClick={() => removeKnowledgeItem(item.id)}
                              className="p-1 rounded-full hover:bg-gray-100 text-gray-800"
                              title="파일 삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Index 폴더 섹션 */}
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              // 동적 높이 분배 로직
              isKnowledgeExpanded && isIndexExpanded
                ? "flex-1" // 둘 다 열려있으면 각각 flex-1
                : !isKnowledgeExpanded && isIndexExpanded
                ? "flex-1" // Index만 열려있으면 전체 높이
                : "flex-none" // 닫혀있으면 헤더만
            )}
          >
            <button
              onClick={() => setIsIndexExpanded(!isIndexExpanded)}
              className="w-full p-4 flex items-center gap-2 hover:bg-slate-100/50 transition-colors flex-none"
            >
              {isIndexExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
              <List className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">
                Index
              </span>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOutlineModalOpen(true);
                }}
                className="ml-auto p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                title="목차 편집"
              >
                <Edit className="w-4 h-4 text-slate-600" />
              </div>
            </button>

            {isIndexExpanded && (
              <div className="px-4 pb-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {outline.length > 0 ? (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="space-y-1 h-full overflow-y-auto pr-1">
                      {outline.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "p-2 hover:bg-slate-100/50 transition-colors cursor-pointer text-xs flex-none rounded",
                            item.level === 1 && "font-semibold text-slate-800",
                            item.level === 2 &&
                              "font-medium text-slate-700 ml-3",
                            item.level === 3 &&
                              "font-normal text-slate-600 ml-6"
                          )}
                        >
                          {item.title}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-xs text-slate-500 text-center">
                      목차가 아직 생성되지 않았습니다
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 리사이즈 핸들 */}
      <div
        className={cn(
          "w-1 cursor-col-resize hover:bg-blue-300/60 transition-all duration-300 flex-shrink-0",
          isResizing ? "bg-blue-400/80" : "bg-transparent"
        )}
        onMouseDown={handleMouseDown}
        style={{ transition: "background-color 0.3s ease" }}
      >
        <div className="w-full h-full relative">
          {/* 리사이즈 인디케이터 */}
          <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-transparent hover:bg-blue-300/50 transition-all duration-300" />
        </div>
      </div>

      {/* 목차 편집 모달 */}
      <OutlineEditModal
        isOpen={isOutlineModalOpen}
        onClose={() => setIsOutlineModalOpen(false)}
        onSave={handleSaveOutline}
        initialOutline={currentOutlineData}
      />
    </div>
  );
}
