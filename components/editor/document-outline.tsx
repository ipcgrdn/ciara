'use client'

import { Editor } from '@tiptap/react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { FileText, Hash, List, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentOutlineProps {
  editor: Editor
}

interface HeadingItem {
  level: number
  text: string
  id: string
  position: number
}

export function DocumentOutline({ editor }: DocumentOutlineProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (!editor) return

    const updateHeadings = () => {
      const headingNodes: HeadingItem[] = []
      const doc = editor.state.doc

      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level
          const text = node.textContent
          const id = `heading-${pos}`
          
          headingNodes.push({
            level,
            text: text || `제목 ${level}`,
            id,
            position: pos,
          })
        }
      })

      setHeadings(headingNodes)
    }

    // 초기 로드
    updateHeadings()

    // 에디터 업데이트 시마다 제목 목록 갱신
    const updateHandler = () => {
      updateHeadings()
    }

    editor.on('update', updateHandler)

    return () => {
      editor.off('update', updateHandler)
    }
  }, [editor])

  const scrollToHeading = (position: number) => {
    const view = editor.view
    const node = view.state.doc.nodeAt(position)
    
    if (node) {
      // 헤딩 위치로 스크롤
      const pos = editor.view.coordsAtPos(position)
      const container = editor.view.dom.closest('.prose') || editor.view.dom
      
      if (container && pos) {
        container.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
      
      // 커서도 해당 위치로 이동
      editor.commands.setTextSelection(position)
      editor.commands.focus()
    }
  }

  const getHeadingIcon = (level: number) => {
    const baseClass = "h-3 w-3"
    const colors = {
      1: "text-blue-600",
      2: "text-green-600", 
      3: "text-orange-600",
      4: "text-purple-600",
      5: "text-pink-600",
      6: "text-gray-600"
    }
    
    return <Hash className={cn(baseClass, colors[level as keyof typeof colors] || colors[6])} />
  }

  const getIndentClass = (level: number) => {
    const indents = {
      1: "ml-0",
      2: "ml-4",
      3: "ml-8", 
      4: "ml-12",
      5: "ml-16",
      6: "ml-20"
    }
    return indents[level as keyof typeof indents] || indents[6]
  }

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: 60 }}
        transition={{ duration: 0.3 }}
        className="h-fit"
      >
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(false)}
                className="p-2"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="h-fit"
    >
      <Card className="h-fit max-h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              문서 구조
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="p-2"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {headings.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">제목을 추가하면</p>
                <p className="text-sm">목차가 나타납니다</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full max-h-[500px]">
              <div className="space-y-1">
                {headings.map((heading, index) => (
                  <motion.button
                    key={`${heading.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => scrollToHeading(heading.position)}
                    className={cn(
                      "w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors duration-150",
                      "flex items-center gap-2 text-sm",
                      getIndentClass(heading.level)
                    )}
                  >
                    {getHeadingIcon(heading.level)}
                    <span className="truncate flex-1" title={heading.text}>
                      {heading.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 