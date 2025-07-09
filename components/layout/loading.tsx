"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Floating background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
          animate={{ opacity: 0.1, scale: 1, rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
            opacity: { duration: 2 },
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96"
        >
          <Image
            src="/assets/futerals.svg"
            alt="Background decoration"
            fill
            className="object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 180 }}
          animate={{ opacity: 0.05, scale: 1, rotate: -180 }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            opacity: { duration: 2, delay: 1 },
          }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64"
        >
          <Image
            src="/assets/futerals2.svg"
            alt="Background decoration"
            fill
            className="object-contain"
          />
        </motion.div>
      </div>

      {/* Main loading content */}
      <div className="relative text-center">
        {/* CIARA Logo with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Image
            src="/ciara.svg"
            alt="CIARA Logo"
            width={100}
            height={100}
          />
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex flex-col items-center space-y-6"
        >
          {/* Animated loading dots */}
          <div className="flex space-x-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
                className="w-3 h-3 bg-white rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
