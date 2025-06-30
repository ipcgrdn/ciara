"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TypingAnimation from "@/components/ui/typing-animation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

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
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen bg-black overflow-hidden pt-24">
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

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-4/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="relative w-128 h-128 xl:w-200 xl:h-200"
        >
          <Image
            src="/assets/futerals.svg"
            alt="Futerals"
            fill
            className="object-contain opacity-30 md:opacity-100"
            priority
          />
        </motion.div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-screen space-y-6 sm:space-y-8">
            <div className="relative">
              {/* Main Title with Typing Animation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <TypingAnimation
                  className="text-white leading-tight font-montserrat font-medium"
                  style={{
                    fontSize: "clamp(1.75rem, 8vw, 5rem)",
                    lineHeight: "1.1",
                  }}
                  duration={30}
                  startOnView={true}
                >
                  THE FUTURE OF
                </TypingAnimation>

                <TypingAnimation
                  className="text-white leading-tight font-montserrat font-medium bg-blue-300 bg-clip-text drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                  style={{
                    fontSize: "clamp(1.75rem, 8vw, 5rem)",
                    lineHeight: "1.1",
                  }}
                  duration={30}
                  startOnView={true}
                >
                  WRITING AGENT
                </TypingAnimation>

                <TypingAnimation
                  className="text-white leading-tight font-montserrat font-medium"
                  style={{
                    fontSize: "clamp(1.75rem, 8vw, 5rem)",
                    lineHeight: "1.1",
                  }}
                  duration={30}
                  startOnView={true}
                >
                  IS HERE
                </TypingAnimation>
              </motion.div>
            </div>

            {/* Description */}
            <div className="flex flex-col lg:flex-row justify-between mt-8 sm:mt-12 space-y-8 lg:space-y-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl">
                  The AI writing assistant that finally understands{" "}
                  <br className="hidden sm:block" />
                  your entire document. From research papers{" "}
                  <br className="hidden sm:block" />
                  to novels - write with infinite context.
                </p>
              </motion.div>
              {/* CLARA Section */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-left lg:text-right space-y-4 sm:space-y-6"
              >
                <h2
                  className="text-white tracking-wider font-montserrat font-bold"
                  style={{
                    fontSize: "clamp(1rem, 3vw, 1.25rem)",
                    fontWeight: 700,
                    letterSpacing: "clamp(-3px, -1vw, -6.2px)",
                  }}
                >
                  ＣＬＡＲＡ
                </h2>
                <p className="text-white/80 max-w-sm lg:ml-auto leading-relaxed text-sm sm:text-base">
                  Beyond the limitations of traditional AI tools.{" "}
                  <br className="hidden sm:block" />
                  Understanding entire document structure{" "}
                  <br className="hidden sm:block" />
                  with continuous conversational intelligence.
                </p>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="flex flex-col space-y-3 sm:space-y-4 items-start"
            >
              <Link href={user ? "/dashboard" : "/auth"}>
                <Button
                  size="lg"
                  className="text-white bg-transparent border-white hover:bg-transparent transition-all duration-300 hover:scale-105 font-semibold underline"
                  style={{
                    fontSize: "clamp(1rem, 4vw, 1.875rem)",
                    lineHeight: "1.5",
                    padding: "clamp(0.75rem, 2vw, 2rem) clamp(1rem, 3vw, 2rem)",
                  }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </Button>
              </Link>

              <Button
                size="lg"
                className="text-white bg-transparent border-white hover:bg-transparent transition-all duration-300 hover:scale-105 font-semibold underline"
                style={{
                  fontSize: "clamp(1rem, 4vw, 1.875rem)",
                  lineHeight: "1.5",
                  padding: "clamp(0.75rem, 2vw, 2rem) clamp(1rem, 3vw, 2rem)",
                }}
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* WHO WE ARE Section */}
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
            WHO WE ARE
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
            <div className="w-full lg:w-[442px]">
              <p className="text-white font-montserrat font-normal text-base sm:text-lg lg:text-xl xl:text-[22px] leading-relaxed">
                Born from the vision of &quot;Cursor for Writing&quot; - CLARA reimagines
                how we create long-form content.
              </p>
            </div>

            {/* Right description */}
            <div className="w-full lg:w-[420px]">
              <p className="text-white font-montserrat font-normal text-sm sm:text-base lg:text-lg xl:text-[20px] leading-relaxed">
                Outline-driven indexing meets persistent AI conversations.
                Maintain perfect consistency across documents of any length.
              </p>
            </div>
          </motion.div>

          {/* Statistics cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 border-t border-white pt-8 sm:pt-12 border-b pb-8 sm:pb-12"
          >
            <StatCard number="∞" label="Context Length" />
            <StatCard number="10+" label="File Formats" />
            <StatCard number="24/7" label="AI Partner" />
            <StatCard number="1%" label="Effort Needed" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
