"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-black/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-sm font-bold">C</span>
          </div>
          <p className="text-gray-800">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50/80 via-white to-slate-100/60 relative overflow-hidden">
      {/* Background Glass Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Large glass orb - top right */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-white/30 via-slate-100/20 to-transparent rounded-full blur-3xl" />

        {/* Medium glass orb - bottom left */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-slate-200/25 via-white/15 to-transparent rounded-full blur-2xl" />

        {/* Small floating elements */}
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-white/20 rounded-full blur-xl" />
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-slate-100/30 rounded-full blur-lg" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-sm bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 backdrop-blur-md bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                <span className="text-black text-sm font-bold">C</span>
              </div>
              <span className="text-2xl font-light text-black">CLARA</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden md:flex items-center space-x-8"
            >
              <a
                href="#features"
                className="text-gray-800 hover:text-black transition-colors text-sm font-medium"
              >
                기능
              </a>
              <a
                href="#about"
                className="text-gray-800 hover:text-black transition-colors text-sm font-medium"
              >
                소개
              </a>

              {user ? (
                <Link href="/dashboard">
                  <Button
                    size="sm"
                    className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30"
                  >
                    대시보드
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="backdrop-blur-sm bg-white/20 border-black/30 hover:bg-white/30"
                  >
                    로그인
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extralight text-black leading-tight mb-8"
          >
            긴 문서 작성을 위한
            <br />
            <span className="font-light bg-gradient-to-r from-gray-700 to-black bg-clip-text text-transparent">
              AI 어시스턴트
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-800 font-light leading-relaxed mb-12 max-w-3xl mx-auto"
          >
            논문, 보고서, 소설까지. 아주 긴 컨텍스트도 완벽히 이해하여
            <br className="hidden md:block" />
            당신과 함께 글을 써나가는 새로운 문서 작성 경험
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30 px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  대시보드로 이동
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button
                  size="lg"
                  className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30 px-8 py-3 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  문서 작성 시작하기
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="lg"
              className="text-gray-800 hover:text-black px-8 py-3 text-lg font-medium"
            >
              데모 보기
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Preview */}
      <section
        id="features"
        className="relative z-10 container mx-auto px-6 py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          <div className="text-center p-8 backdrop-blur-sm bg-white/10 rounded-2xl border border-black/20">
            <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-black/30 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-black text-lg">🧠</span>
            </div>
            <h3 className="text-xl font-medium text-black mb-3">
              긴 컨텍스트 이해
            </h3>
            <p className="text-gray-800 leading-relaxed">
              아무리 긴 문서라도 전체 맥락을 완벽히 파악하여 일관성 있는
              글쓰기를 도와드립니다.
            </p>
          </div>

          <div className="text-center p-8 backdrop-blur-sm bg-white/10 rounded-2xl border border-black/20">
            <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-black/30 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-black text-lg">📖</span>
            </div>
            <h3 className="text-xl font-medium text-black mb-3">
              목차 단위 관리
            </h3>
            <p className="text-gray-800 leading-relaxed">
              문서를 구조화하여 관리하고, 각 섹션별로 최적화된 AI 지원을
              제공합니다.
            </p>
          </div>

          <div className="text-center p-8 backdrop-blur-sm bg-white/10 rounded-2xl border border-black/20">
            <div className="w-12 h-12 backdrop-blur-md bg-white/20 border border-black/30 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-black text-lg">⚡</span>
            </div>
            <h3 className="text-xl font-medium text-black mb-3">실시간 협업</h3>
            <p className="text-gray-800 leading-relaxed">
              Cursor처럼 즉각적인 AI 제안과 수정으로 끊김 없는 작성 경험을
              제공합니다.
            </p>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-light text-black mb-6">
            더 나은 글쓰기 경험을
            <br />
            지금 시작해보세요
          </h2>
          <p className="text-xl text-gray-800 mb-8 leading-relaxed">
            아직 초기 단계이지만, 함께 만들어가는 서비스입니다.
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30 px-10 py-4 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                대시보드로 이동하기
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button
                size="lg"
                className="backdrop-blur-md bg-black/80 hover:bg-black text-white border border-gray-600/30 px-10 py-4 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                무료로 시작하기
              </Button>
            </Link>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-sm bg-white/10 border-t border-black/20 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-800">
            <p className="text-sm">© 2025 CLARA AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
