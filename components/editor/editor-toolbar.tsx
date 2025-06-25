'use client'

import { Editor } from '@tiptap/react'
import { motion } from 'framer-motion'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Type,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  icon: React.ReactNode
  tooltip: string
}

function ToolbarButton({ onClick, isActive, disabled, icon, tooltip }: ToolbarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8 p-0",
              isActive && "bg-primary text-primary-foreground"
            )}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  const formatButtons = [
    {
      icon: <Bold className="h-4 w-4" />,
      tooltip: "Bold (Ctrl+B)",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      tooltip: "Italic (Ctrl+I)",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: <Strikethrough className="h-4 w-4" />,
      tooltip: "Strikethrough",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
    },
    {
      icon: <Code className="h-4 w-4" />,
      tooltip: "Inline Code",
      onClick: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
    },
  ]

  const headingButtons = [
    {
      icon: <Type className="h-4 w-4" />,
      tooltip: "Paragraph",
      onClick: () => editor.chain().focus().setParagraph().run(),
      isActive: editor.isActive('paragraph'),
    },
    {
      icon: <Heading1 className="h-4 w-4" />,
      tooltip: "Heading 1",
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      tooltip: "Heading 2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      tooltip: "Heading 3",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
  ]

  const listButtons = [
    {
      icon: <List className="h-4 w-4" />,
      tooltip: "Bullet List",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      tooltip: "Numbered List",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: <Quote className="h-4 w-4" />,
      tooltip: "Quote",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
  ]

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
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-1 p-3 bg-muted/30 border-b"
    >
      {/* Format Buttons */}
      <div className="flex items-center gap-1">
        {formatButtons.map((button, index) => (
          <ToolbarButton key={`format-${index}`} {...button} />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-2 h-6" />

      {/* Heading Buttons */}
      <div className="flex items-center gap-1">
        {headingButtons.map((button, index) => (
          <ToolbarButton key={`heading-${index}`} {...button} />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-2 h-6" />

      {/* List Buttons */}
      <div className="flex items-center gap-1">
        {listButtons.map((button, index) => (
          <ToolbarButton key={`list-${index}`} {...button} />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-2 h-6" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {actionButtons.map((button, index) => (
          <ToolbarButton key={`action-${index}`} {...button} />
        ))}
      </div>

      {/* AI Assistant Button */}
      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            // AI 기능 구현 예정
            console.log('AI Assistant from toolbar')
          }}
        >
          <Palette className="h-4 w-4" />
          AI 도움말
        </Button>
      </div>
    </motion.div>
  )
} 