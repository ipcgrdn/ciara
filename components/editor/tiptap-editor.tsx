'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EditorToolbar } from './editor-toolbar'
import { DocumentOutline } from './document-outline'

interface TiptapEditorProps {
  content?: string
  onContentChange?: (content: string) => void
  placeholder?: string
  className?: string
  showToolbar?: boolean
  showOutline?: boolean
}

export function TiptapEditor({
  content = '',
  onContentChange,
  placeholder = '문서 작성을 시작하세요...',
  className,
  showToolbar = true,
  showOutline = true
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We'll use the custom heading extension
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-neutral dark:prose-invert max-w-none',
          'min-h-[500px] px-6 py-4',
          'focus:outline-none',
          'prose-headings:scroll-mt-16',
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onContentChange?.(html)
    },
    immediatelyRender: false,
  })

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto"
    >
      <div className="flex gap-6">
        {/* Main Editor */}
        <div className="flex-1">
          <Card className="overflow-hidden">
            {showToolbar && (
              <>
                <EditorToolbar editor={editor} />
                <Separator />
              </>
            )}
            <div className="relative">
              <EditorContent 
                editor={editor}
                className="min-h-[500px] focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200"
              />
              
              {/* AI Assistant Button - 추후 구현 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  // AI 기능 구현 예정
                  console.log('AI Assistant clicked')
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </motion.button>
            </div>
          </Card>
        </div>

        {/* Document Outline Sidebar */}
        {showOutline && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-80"
          >
            <DocumentOutline editor={editor} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
} 