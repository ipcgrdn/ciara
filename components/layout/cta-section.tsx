"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function CTASection() {
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Main Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-white text-center text-4xl md:text-6xl lg:text-7xl font-semibold mb-8 max-w-6xl leading-tight font-montserrat"
        >
          Let&apos;s make this official, sign up
          <br />
          and access the vault
        </motion.h2>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Button
            className="bg-[#a3cbff] hover:bg-[#8bb8ff] text-black font-semibold text-xl md:text-2xl px-8 py-6 rounded-xl border-2 border-[#3c3c3c] transition-all duration-300 hover:scale-105 font-montserrat"
            size="lg"
          >
            Become a Clara Pro Member
          </Button>
        </motion.div>

        {/* Decorative Images */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
            whileInView={{ opacity: 0.9, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="absolute top-0 right-0 w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 blur-lg"
          >
            <Image
              src="/assets/futerals3.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 0.75, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
            className="absolute bottom-12 right-2/3 w-36 h-36 md:w-52 md:h-52 lg:w-68 lg:h-68"
          >
            <Image
              src="/assets/futerals3.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            whileInView={{ opacity: 0.85, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            viewport={{ once: true }}
            className="absolute bottom-6 left-2/3 w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72"
          >
            <Image
              src="/assets/futerals2.svg"
              alt="Decorative element"
              fill
              className="object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            whileInView={{ opacity: 0.7, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            viewport={{ once: true }}
            className="absolute top-2/5 right-4/5 w-52 h-52 md:w-68 md:h-68 lg:w-92 lg:h-92 transform -translate-y-1/2 blur-sm"
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
