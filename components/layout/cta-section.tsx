"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CTASection() {
  const router = useRouter();
  return (
    <section className="relative min-h-screen bg-black overflow-hidden">
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
          className="text-white text-center font-semibold mb-6 sm:mb-8 max-w-6xl leading-tight font-montserrat"
          style={{
            fontSize: "clamp(1.5rem, 6vw, 4.375rem)",
            lineHeight: "1.2",
          }}
        >
          Ready to revolutionize
          <br className="hidden sm:block" />
          your writing process?
        </motion.h2>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Button
            className="bg-[#a3cbff] hover:bg-[#8bb8ff] text-black font-semibold border-2 border-[#3c3c3c] transition-all duration-300 hover:scale-105 font-montserrat rounded-lg sm:rounded-xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6"
            style={{
              fontSize: "clamp(0.875rem, 3vw, 1.5rem)",
            }}
            size="lg"
            onClick={() => {
              router.push("/auth");
            }}
          >
            Start Your Writing Revolution
          </Button>
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
