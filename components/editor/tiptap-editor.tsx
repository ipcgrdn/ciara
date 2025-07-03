"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Extension } from "@tiptap/core";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "./editor-toolbar";
import { AiSidebar } from "./ai-sidebar";
import { IndexSidebar } from "./index-sidebar";

// FontSize 확장 정의
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const fontSize = element.style.fontSize;
              return fontSize ? fontSize.replace(/['"]+/g, "") : null;
            },
            renderHTML: (attributes: Record<string, string | null>) => {
              const fontSize = attributes.fontSize;
              if (!fontSize || typeof fontSize !== "string") {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

interface TiptapEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
  showOutline?: boolean;
  showAiChat?: boolean;
  documentId?: string;
  outlineData?: string;
}

export function TiptapEditor({
  content = "",
  onContentChange,
  placeholder = "문서 작성을 시작하세요...",
  className,
  showToolbar = true,
  showOutline: initialShowOutline = true,
  showAiChat: initialShowAiChat = true,
  documentId,
  outlineData = "",
}: TiptapEditorProps) {
  // localStorage에서 사이드바 설정 불러오기
  const [showOutline, setShowOutline] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-editor-show-outline");
      return saved !== null ? JSON.parse(saved) : initialShowOutline;
    }
    return initialShowOutline;
  });

  const [showAiChat, setShowAiChat] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ciara-editor-show-ai-chat");
      return saved !== null ? JSON.parse(saved) : initialShowAiChat;
    }
    return initialShowAiChat;
  });

  // 색상 팔레트 상태 관리
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");

  // 사이드바 상태 변경 시 localStorage에 저장
  const handleToggleOutline = useCallback(() => {
    const newValue = !showOutline;
    setShowOutline(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ciara-editor-show-outline",
        JSON.stringify(newValue)
      );
    }
  }, [showOutline]);

  const handleToggleAiChat = useCallback(() => {
    const newValue = !showAiChat;
    setShowAiChat(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "ciara-editor-show-ai-chat",
        JSON.stringify(newValue)
      );
    }
  }, [showAiChat]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      TextStyle,
      Color.configure({
        types: [TextStyle.name],
      }),
      FontSize,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-neutral dark:prose-invert max-w-none",
          "min-h-[500px] px-6 py-4",
          "focus:outline-none",
          "prose-headings:scroll-mt-16",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange?.(html);
    },
    immediatelyRender: false,
  });

  // 현재 선택된 텍스트의 폰트 색상 가져오기
  useEffect(() => {
    if (!editor) return;

    const updateColor = () => {
      const attrs = editor.getAttributes("textStyle");
      if (attrs.color) {
        setCurrentColor(attrs.color);
      } else {
        setCurrentColor("#000000"); // 기본값
      }
    };

    updateColor();
    editor.on("selectionUpdate", updateColor);

    return () => {
      editor.off("selectionUpdate", updateColor);
    };
  }, [editor]);

  // 외부 클릭 시 팔레트 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-color-palette]")) {
        setIsColorPaletteOpen(false);
      }
    };

    if (isColorPaletteOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isColorPaletteOpen]);

  const predefinedColors = [
    "#000000",
    "#333333",
    "#666666",
    "#999999",
    "#CCCCCC",
    "#FF0000",
    "#FF6B6B",
    "#FF9F43",
    "#FDD835",
    "#7ED321",
    "#50E3C2",
    "#4ECDC4",
    "#45B7D1",
    "#6C5CE7",
    "#A55EEA",
    "#FD79A8",
    "#FDCB6E",
    "#E84393",
    "#00B894",
    "#0984E3",
  ];

  const handleColorChange = (color: string) => {
    if (!editor) return;
    setCurrentColor(color);
    editor.chain().focus().setColor(color).run();
    setIsColorPaletteOpen(false);
  };

  const removeColor = () => {
    if (!editor) return;
    editor.chain().focus().unsetColor().run();
    setCurrentColor("#000000");
    setIsColorPaletteOpen(false);
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex bg-black/5"
    >
      {/* Left Sidebar - Document Outline (Resizable width, independent scroll) */}
      <AnimatePresence>
        {showOutline && (
          <motion.div
            key="outline-sidebar"
            initial={{ opacity: 0, x: -240 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -240 }}
            transition={{
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="h-full flex-shrink-0 overflow-hidden"
          >
            <div className="h-full">
              {documentId && (
                <IndexSidebar
                  documentId={documentId}
                  outlineData={outlineData}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gap between panels */}
      <AnimatePresence>
        {showOutline && (
          <motion.div
            key="outline-gap"
            initial={{ width: 0 }}
            animate={{ width: 8 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0"
          />
        )}
      </AnimatePresence>

      {/* Main Editor (Flexible width, independent scroll) */}
      <div className="flex-1 h-full min-w-0 overflow-hidden flex justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="h-full backdrop-blur-md bg-white/95 border-white/30 flex flex-col p-0">
            {/* Toolbar - Fixed at top */}
            {showToolbar && (
              <div className="flex-shrink-0 overflow-x-auto">
                <EditorToolbar
                  editor={editor}
                  showOutline={showOutline}
                  showAiChat={showAiChat}
                  onToggleOutline={handleToggleOutline}
                  onToggleAiChat={handleToggleAiChat}
                  onToggleColorPalette={() =>
                    setIsColorPaletteOpen(!isColorPaletteOpen)
                  }
                />
                <Separator className="border-white/10" />
              </div>
            )}

            {/* Editor Content - Scrollable */}
            <div className="flex-1 overflow-y-auto relative">
              <EditorContent
                editor={editor}
                className={cn(
                  "focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200",
                  "prose prose-neutral dark:prose-invert max-w-none",
                  "px-8 py-6 min-h-full text-[14px]",
                  "prose-headings:scroll-mt-16 prose-headings:text-slate-800",
                  "prose-p:text-slate-700 prose-p:leading-relaxed",
                  "prose-strong:text-slate-800 prose-em:text-slate-700",
                  "prose-blockquote:border-l-slate-300 prose-blockquote:text-slate-600",
                  "[&_span[style*='font-size']]:leading-normal", // 커스텀 폰트 크기 적용
                  className
                )}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Gap between panels */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div
            key="ai-gap"
            initial={{ width: 0 }}
            animate={{ width: 8 }}
            exit={{ width: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0"
          />
        )}
      </AnimatePresence>

      {/* Right Sidebar - AI Chat (Resizable width, independent scroll) */}
      <AnimatePresence>
        {showAiChat && (
          <motion.div
            key="ai-sidebar"
            initial={{ opacity: 0, x: 240 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 240 }}
            transition={{
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="h-full flex-shrink-0 overflow-hidden"
          >
            <div className="h-full">
              <AiSidebar documentId={documentId || ""} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Palette - Floating */}
      {isColorPaletteOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          data-color-palette
          className="fixed top-[120px] left-1/2 transform -translate-x-1/2 z-[200] p-4 backdrop-blur-md bg-white/95 border border-white/30 rounded-xl shadow-2xl"
        >
          <div className="grid grid-cols-5 gap-3 mb-4">
            {predefinedColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className="w-8 h-8 rounded-lg border border-gray-300 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-none"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={removeColor}
              className="text-xs h-8 px-3 border-none"
            >
              기본값
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
