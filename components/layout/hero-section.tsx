"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TypingAnimation from "@/components/ui/typing-animation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  number: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ number, label }) => (
  <div className="flex flex-col items-center">
    <div className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[100px] leading-tight font-montserrat font-normal text-center">
      {number}
    </div>
    <div className="text-white text-sm sm:text-base md:text-lg lg:text-xl xl:text-[24px] leading-relaxed font-montserrat font-normal text-center">
      {label}
    </div>
  </div>
);

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-black overflow-hidden pt-24 md:pt-32">
      {/* Background images with overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <Image
            src="/assets/background.svg"
            alt="Background"
            fill
            className="object-cover filter grayscale"
            priority
          />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen space-y-6 sm:space-y-8">
            <div className="relative">
              {/* Main Title with Typing Animation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col items-center justify-center"
              >
                <TypingAnimation
                  className="text-white leading-tight font-instrument"
                  style={{
                    fontSize: "clamp(2rem, 8vw, 5rem)",
                    lineHeight: "1.1",
                  }}
                  duration={15}
                  startOnView={true}
                >
                  The AI Writing Agent
                </TypingAnimation>
                <p className="text-white text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed font-montserrat font-normal text-center mt-4">
                  더 빠르고 효율적인 문서 작성 경험을 시작하세요
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="flex flex-row space-x-3 sm:space-x-4 items-center justify-center mt-12"
              >
                <Link href="/#cta">
                  <Button
                    size="lg"
                    className="text-white bg-transparent border-white hover:bg-transparent transition-all duration-300 hover:scale-105 font-semibold border-2"
                    style={{
                      fontSize: "clamp(0.5rem, 4vw, 1.2rem)",
                      lineHeight: "1.5",
                      padding:
                        "clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 3vw, 1.5rem)",
                    }}
                  >
                    사전 등록하기
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  </Button>
                </Link>

                {/* 오픈채팅 참가하기 버튼 CTASection 스타일로 */}
                <a
                  href="https://open.kakao.com/o/gtiAgUGh"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="text-white bg-transparent border-white hover:bg-transparent transition-all duration-300 hover:scale-105 font-semibold border-2"
                    style={{
                      fontSize: "clamp(0.5rem, 4vw, 1.2rem)",
                      lineHeight: "1.5",
                      padding:
                        "clamp(0.5rem, 2vw, 1rem) clamp(0.75rem, 3vw, 1.5rem)",
                    }}
                  >
                    오픈채팅 참가하기
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                  </Button>
                </a>
              </motion.div>

              {/* Demo Video */}
              <div className="w-full flex justify-center mt-24">
                <div className="w-full max-w-8xl aspect-video rounded-2xl overflow-hidden shadow-lg">
                  <video
                    src="https://tvcgnt7ylycddtrr.public.blob.vercel-storage.com/full.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-transparent backdrop-blur-md rounded-t-4xl w-full">
        <div className="max-w-[1728px] mx-auto px-4 sm:px-8 lg:px-16 xl:px-[68px] py-12 sm:py-16 lg:py-24 xl:py-[102px]">
          {/* Main title */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white font-montserrat font-semibold mb-12 sm:mb-16 lg:mb-24 xl:mb-[142px]"
            style={{
              fontSize: "clamp(2rem, 8vw, 4.375rem)",
              lineHeight: "0.9",
            }}
          >
            WHY CIARA
          </motion.h2>

          {/* Content layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row justify-between items-start mb-12 sm:mb-16 lg:mb-24 xl:mb-[133px] space-y-6 lg:space-y-0 lg:space-x-8"
          >
            {/* Left description */}
            <div className="w-full lg:w-[440px]">
              <p className="text-white font-montserrat font-normal text-base sm:text-lg leading-relaxed mb-6">
                &quot;10페이지 쓰다 보면 1페이지에 뭘 썼는지 까먹어요.&quot;
                <br />
                &quot;앞뒤 내용이 안 맞아도 모르겠어요.&quot;
                <br />
                &quot;같은 말을 계속 반복하는 것 같아요.&quot;
              </p>
              <p className="text-white font-montserrat font-normal text-base sm:text-lg leading-relaxed">
                긴 문서를 쓰는 모든 사람들의 진짜 고민을 들었습니다.
                <br />
                문제는 도구가 아니라 <strong>기억과 일관성</strong>이었습니다.
              </p>
            </div>

            {/* Right description */}
            <div className="w-full lg:w-[440px]">
              <p className="text-white font-montserrat font-normal text-base sm:text-lg leading-relaxed mb-6">
                우리는 화려한 기능보다는 <strong>진짜 필요한 것</strong>에
                집중했습니다.
                <br />
                당신의 글 전체를 기억하고, 앞뒤 맥락을 맞춰주고,
                <br />
                알아서 문서를 완성해주는 AI.
              </p>
              <p className="text-white font-montserrat font-normal text-base sm:text-lg leading-relaxed">
                당신의 시간을 되돌려드리겠습니다.
                <br />
                더 이상 키보드 앞에서 고민하지 마세요.
                <br />
                <strong>Ciara에게 맡겨보세요.</strong>
              </p>
            </div>
          </motion.div>

          {/* Pain points cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 border-t border-white pt-8 sm:pt-12 border-b pb-8 sm:pb-12"
          >
            <StatCard number="5x" label="Context Length" />
            <StatCard number="10x" label="Faster Writing" />
            <StatCard number="24/7" label="AI Agent" />
            <StatCard number="1%" label="Effort Needed" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
