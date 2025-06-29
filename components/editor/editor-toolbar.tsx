"use client";

import { Editor } from "@tiptap/react";
import { motion } from "framer-motion";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  PanelLeftOpen,
  PanelRightOpen,
  Minus,
  Plus,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface EditorToolbarProps {
  editor: Editor;
  showOutline?: boolean;
  showAiChat?: boolean;
  onToggleOutline?: () => void;
  onToggleAiChat?: () => void;
  onToggleColorPalette?: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  icon,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8 p-0 backdrop-blur-sm border transition-all duration-200",
              isActive
                ? "bg-white/30 border-white/40 text-slate-800 shadow-sm"
                : "bg-white/10 border-white/20 text-slate-600 hover:bg-white/20 hover:border-white/30"
            )}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="backdrop-blur-sm bg-white/90 border-white/20 text-slate-800">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 폰트 크기 조절 컴포넌트
function FontSizeControl({ editor }: { editor: Editor }) {
  const [fontSize, setFontSize] = useState("14");

  // 현재 선택된 텍스트의 폰트 크기 가져오기
  useEffect(() => {
    const updateFontSize = () => {
      const attrs = editor.getAttributes("textStyle");
      if (attrs.fontSize) {
        const size = attrs.fontSize.replace("px", "");
        setFontSize(size);
      } else {
        setFontSize("14"); // 기본값
      }
    };

    updateFontSize();
    editor.on("selectionUpdate", updateFontSize);

    return () => {
      editor.off("selectionUpdate", updateFontSize);
    };
  }, [editor]);

  const handleFontSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    if (size >= 8 && size <= 72) {
      setFontSize(newSize);
      editor.chain().focus().setFontSize(`${size}px`).run();
    }
  };

  const increaseFontSize = () => {
    const currentSize = parseInt(fontSize);
    const newSize = Math.min(72, currentSize + 2);
    handleFontSizeChange(newSize.toString());
  };

  const decreaseFontSize = () => {
    const currentSize = parseInt(fontSize);
    const newSize = Math.max(8, currentSize - 2);
    handleFontSizeChange(newSize.toString());
  };

  return (
    <div className="flex items-center gap-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              className="h-8 w-8 p-0 backdrop-blur-sm border bg-white/10 border-white/20 text-slate-600 hover:bg-white/20 hover:border-white/30 rounded-r-none border-r-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="backdrop-blur-sm bg-white/90 border-white/20 text-slate-800">
            <p>폰트 크기 줄이기</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Input
        type="number"
        min="8"
        max="72"
        value={fontSize}
        onChange={(e) => handleFontSizeChange(e.target.value)}
        className="w-16 h-8 text-center text-xs backdrop-blur-sm bg-white/10 border-white/20 text-slate-700 border-l-0 border-r-0 rounded-none"
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              className="h-8 w-8 p-0 backdrop-blur-sm border bg-white/10 border-white/20 text-slate-600 hover:bg-white/20 hover:border-white/30 rounded-l-none border-l-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="backdrop-blur-sm bg-white/90 border-white/20 text-slate-800">
            <p>폰트 크기 늘리기</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// 폰트 색상 선택 컴포넌트
function FontColorControl({
  editor,
  onToggleColorPalette,
}: {
  editor: Editor;
  onToggleColorPalette: () => void;
}) {
  const [currentColor, setCurrentColor] = useState("#000000");

  // 현재 선택된 텍스트의 폰트 색상 가져오기
  useEffect(() => {
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

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleColorPalette}
              className="h-8 w-8 p-0 backdrop-blur-sm border bg-white/10 border-white/20 text-slate-600 hover:bg-white/20 hover:border-white/30"
            >
              <div className="relative">
                <Palette className="h-4 w-4" />
                <div
                  className="absolute -bottom-1 left-0 right-0 h-1 rounded-sm border border-white/30"
                  style={{ backgroundColor: currentColor }}
                />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="backdrop-blur-sm bg-white/90 border-white/20 text-slate-800">
            <p>텍스트 색상</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function EditorToolbar({
  editor,
  showOutline = true,
  showAiChat = true,
  onToggleOutline,
  onToggleAiChat,
  onToggleColorPalette,
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const formatButtons = [
    {
      icon: <Bold className="h-4 w-4" />,
      tooltip: "Bold (Ctrl+B)",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      tooltip: "Italic (Ctrl+I)",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      tooltip: "Strikethrough",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      icon: <Code className="h-4 w-4" />,
      tooltip: "Inline Code",
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
    },
  ];

  const listButtons = [
    {
      icon: <List className="h-4 w-4" />,
      tooltip: "Bullet List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      tooltip: "Numbered List",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      icon: <Quote className="h-4 w-4" />,
      tooltip: "Quote",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
  ];

  const actionButtons = [
    {
      icon: <Undo className="h-4 w-4" />,
      tooltip: "Undo (Ctrl+Z)",
      onClick: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
    },
    {
      icon: <Redo className="h-4 w-4" />,
      tooltip: "Redo (Ctrl+Y)",
      onClick: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-1 p-2 backdrop-blur-sm bg-white/10 border-b border-white/10"
    >
      {/* Format Buttons */}
      <div className="flex items-center gap-1">
        {formatButtons.map((button, index) => (
          <ToolbarButton key={`format-${index}`} {...button} />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-2 h-6 border-white/20" />

      {/* Font Size Control */}
      <FontSizeControl editor={editor} />

      <Separator orientation="vertical" className="mx-2 h-6 border-white/20" />

      {/* Font Color Control */}
      <FontColorControl
        editor={editor}
        onToggleColorPalette={onToggleColorPalette || (() => {})}
      />

      <Separator orientation="vertical" className="mx-2 h-6 border-white/20" />

      {/* List Buttons */}
      <div className="flex items-center gap-1">
        {listButtons.map((button, index) => (
          <ToolbarButton key={`list-${index}`} {...button} />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-2 h-6 border-white/20" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {actionButtons.map((button, index) => (
          <ToolbarButton key={`action-${index}`} {...button} />
        ))}
      </div>

      {/* Spacer to push sidebar controls to the right */}
      <div className="flex-1" />

      {/* Sidebar Toggle Buttons */}
      <div className="flex items-center gap-1">
        {onToggleOutline && (
          <ToolbarButton
            onClick={onToggleOutline}
            isActive={showOutline}
            icon={<PanelLeftOpen className="h-4 w-4" />}
            tooltip={
              showOutline ? "인덱스 사이드바 숨기기" : "인덱스 사이드바 보이기"
            }
          />
        )}

        {onToggleAiChat && (
          <ToolbarButton
            onClick={onToggleAiChat}
            isActive={showAiChat}
            icon={<PanelRightOpen className="h-4 w-4" />}
            tooltip={showAiChat ? "AI 사이드바 숨기기" : "AI 사이드바 보이기"}
          />
        )}
      </div>
    </motion.div>
  );
}
