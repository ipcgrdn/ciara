'use client'
import { TiptapEditor } from '@/components/editor/tiptap-editor'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CLARA
              </h1>
              <span className="text-sm text-muted-foreground">
                AI-Powered Document Editor
              </span>
            </div>
            
            <nav className="flex items-center space-x-4">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                새 문서
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                내 문서
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                설정
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Editor Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">새 문서</h2>
          <p className="text-muted-foreground">
            AI가 도와주는 긴 문서 작성을 시작해보세요.
          </p>
        </div>
        
        <TiptapEditor
          placeholder="여기서 문서 작성을 시작하세요... AI가 도와드립니다!"
          onContentChange={(content) => {
            console.log('Content changed:', content)
          }}
        />
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2024 CLARA. AI-Powered Document Editor.</p>
            <p>Made with ❤️ for better writing</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
