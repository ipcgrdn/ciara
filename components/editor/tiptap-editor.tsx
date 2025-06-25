"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EditorToolbar } from "./editor-toolbar";
import { AiSidebar } from "./ai-sidebar";
import { IndexSidebar } from "./index-sidebar";

interface TiptapEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
  showOutline?: boolean;
  showAiChat?: boolean;
}

export function TiptapEditor({
  content = "",
  onContentChange,
  placeholder = "문서 작성을 시작하세요...",
  className,
  showToolbar = true,
  showOutline: initialShowOutline = true,
  showAiChat: initialShowAiChat = true,
}: TiptapEditorProps) {
  // 사이드바 표시 상태 관리
  const [showOutline, setShowOutline] = useState(initialShowOutline);
  const [showAiChat, setShowAiChat] = useState(initialShowAiChat);
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
      className="w-full h-full flex"
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
              <IndexSidebar />
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
      <div className="flex-1 h-full min-w-0 overflow-hidden flex justify-center">
        <div className="w-full max-w-4xl mx-auto">
          <Card className="h-full backdrop-blur-md bg-white/5 border-white/10 shadow-2xl flex flex-col p-0">
            {/* Toolbar - Fixed at top */}
            {showToolbar && (
              <div className="flex-shrink-0 overflow-x-auto">
                <EditorToolbar
                  editor={editor}
                  showOutline={showOutline}
                  showAiChat={showAiChat}
                  onToggleOutline={() => setShowOutline(!showOutline)}
                  onToggleAiChat={() => setShowAiChat(!showAiChat)}
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
                  "px-8 py-6 min-h-full",
                  "prose-headings:scroll-mt-16 prose-headings:text-slate-800",
                  "prose-p:text-slate-700 prose-p:leading-relaxed",
                  "prose-strong:text-slate-800 prose-em:text-slate-700",
                  "prose-blockquote:border-l-slate-300 prose-blockquote:text-slate-600",
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
              <AiSidebar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
