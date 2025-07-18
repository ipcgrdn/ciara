"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Confetti from "react-confetti";

export default function CTASection() {
  const [email, setEmail] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const handlePreRegister = async () => {
    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }
    // 이메일 형식 간단 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    // Supabase에 저장
    const { error } = await supabase.from("register").insert([{ email }]);
    if (error) {
      if (error.code === "23505") {
        alert("이미 등록된 이메일입니다.");
      } else {
        alert("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      return;
    }
    setShowConfetti(true);
    setEmail("");
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <section id="cta" className="relative min-h-screen bg-black overflow-hidden">
      {/* Confetti & 감사 메시지 오버레이 */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-lg">
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 1920}
            height={typeof window !== "undefined" ? window.innerHeight : 1080}
            numberOfPieces={400}
            recycle={false}
          />
          <div className="text-white text-2xl font-bold mt-8 text-center drop-shadow-lg">
            🎉 사전 등록이 완료되었습니다!
          </div>
        </div>
      )}
      {/* Background Image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src="/assets/background.svg"
          alt="Background"
          fill
          className="object-cover filter"
          priority
        />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8 sm:py-12">
        {/* Main Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-white text-center mb-6 sm:mb-8 max-w-6xl leading-tight font-montserrat font-semibold"
          style={{
            fontSize: "clamp(1.5rem, 6vw, 4.375rem)",
            lineHeight: "1.2",
          }}
        >
          Write smarter with Ciara
          <br />
          Start your writing revolution
        </motion.h2>

        {/* CTA 이메일 입력 및 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="w-full flex flex-col items-center gap-4 mt-8"
        >
          <div className="flex flex-row items-center gap-2 w-full max-w-xs sm:max-w-xl">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="flex-1 rounded-lg border-2 border-[#3c3c3c] bg-transparent text-white placeholder-white placeholder:opacity-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white transition-all"
              style={{
                fontSize: "clamp(0.4rem, 2vw, 1.2rem)",
                lineHeight: "1.5",
              }}
            />
            <Button
              className="bg-[#a3cbff] hover:bg-[#8bb8ff] text-black font-semibold border-2 border-[#3c3c3c] transition-all duration-300 hover:scale-105 font-montserrat rounded-lg sm:rounded-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 text-base sm:text-lg"
              size="lg"
              onClick={handlePreRegister}
              style={{
                fontSize: "clamp(0.4rem, 2vw, 1.2rem)",
                lineHeight: "1.5",
                padding:
                  "clamp(0.62rem, 1.7vw, 1.6rem) clamp(0.95rem, 2.5vw, 1.7rem)",
              }}
            >
              사전 등록하기
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </Button>
          </div>
          {/* 오픈채팅 참가하기 버튼 */}
          <a
            href="https://open.kakao.com/o/gtiAgUGh"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-xs sm:max-w-xl"
          >
            <Button
              className="bg-[#a3cbff] hover:bg-[#8bb8ff] text-black font-semibold border-2 border-[#3c3c3c] transition-all duration-300 hover:scale-105 font-montserrat rounded-lg sm:rounded-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 text-base sm:text-lg w-full mt-2 hidden"
              size="lg"
              style={{
                fontSize: "clamp(0.4rem, 2vw, 1.2rem)",
                lineHeight: "1.5",
                padding:
                  "clamp(0.62rem, 1.7vw, 1.6rem) clamp(0.95rem, 2.5vw, 1.7rem)",
              }}
            >
              오픈채팅 참가하기
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </Button>
          </a>
        </motion.div>

        {/* Decorative Images - Simplified for mobile */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top right decoration - Hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
            whileInView={{ opacity: 0.9, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 lg:w-72 lg:h-72 blur-lg"
          >
            <Image
              src="/assets/futerals3.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>

          {/* Bottom left decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 0.75, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
            className="absolute bottom-8 sm:bottom-12 right-2/3 w-24 h-24 sm:w-36 sm:h-36 md:w-52 md:h-52 lg:w-68 lg:h-68"
          >
            <Image
              src="/assets/futerals3.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>

          {/* Bottom right decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            whileInView={{ opacity: 0.85, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            viewport={{ once: true }}
            className="absolute bottom-4 sm:bottom-6 left-2/3 w-28 h-28 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72"
          >
            <Image
              src="/assets/futerals2.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>

          {/* Left side decoration - Hidden on mobile and tablet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            whileInView={{ opacity: 0.7, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            viewport={{ once: true }}
            className="absolute top-2/5 right-4/5 w-52 h-52 lg:w-68 lg:h-68 xl:w-92 xl:h-92 transform -translate-y-1/2 blur-sm"
          >
            <Image
              src="/assets/futerals2.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>
        </div>
      </div>

      {/* Subtle gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 z-5"></div>
    </section>
  );
}
