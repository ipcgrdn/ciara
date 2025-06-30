"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";

interface StatCardProps {
  number: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({ number, label }) => (
  <div className="flex flex-col items-center">
    <div className="text-white text-[100px] leading-[135px] font-montserrat font-normal text-center">
      {number}
    </div>
    <div className="text-white text-[24px] leading-[30px] font-montserrat font-normal text-center">
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
          className="relative w-200 h-200"
        >
          <Image
            src="/assets/futerals.svg"
            alt="Futerals"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="items-center min-h-screen space-y-8">
            <div className="relative">
              {/* Main Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-2xl font-medium text-white leading-tight"
                style={{
                  fontFamily: "Montserrat",
                  lineHeight: "100px",
                  fontSize: "80px",
                }}
              >
                ULTIMATE ESSAY AI <br />
                PAPER, ACADEMIC WRITING <br />
                AI AGENT
              </motion.h1>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-md">
                Our web service is designed to revolutionize <br /> the way you
                interact with digital platforms. <br />
                With a focus on user-centric design, seamless
              </p>
            </motion.div>

            <div className="flex flex-row justify-between mt-12">
              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="flex flex-col space-y-4 items-start"
              >
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button
                    size="lg"
                    className="text-white bg-transparent border-white hover:bg-transparent transition-all duration-300 hover:scale-105 font-semibold text-2xl px-8 py-6 underline"
                    style={{ fontSize: "30px", lineHeight: "45px" }}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>

                <Button
                  size="lg"
                  className="text-white bg-transparent border-white hover:bg-transparent transition-all duration-300 hover:scale-105 font-semibold text-2xl px-8 py-6 underline"
                  style={{ fontSize: "30px", lineHeight: "45px" }}
                >
                  Learn More
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-right space-y-6"
              >
                <h2
                  className="text-4xl md:text-5xl font-bold text-white tracking-wider"
                  style={{
                    fontFamily: "Montserrat",
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "-6.2px",
                  }}
                >
                  ＣＬＡＲＡ
                </h2>
                <p className="text-white/80 max-w-sm lg:ml-auto leading-relaxed">
                  Our web service is designed to revolutionize <br /> the way
                  you interact with digital platforms. <br />
                  With a focus on user-centric design, seamless
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* WHO WE ARE Section */}
      <div className="relative z-10 bg-transparent backdrop-blur-md rounded-t-4xl w-full">
        <div className="max-w-[1728px] mx-auto px-[68px] py-[102px]">
          {/* Main title */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-white text-[70px] leading-[63px] font-montserrat font-semibold mb-[142px]"
          >
            WHO WE ARE
          </motion.h2>

          {/* Content layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-between items-start mb-[133px]"
          >
            {/* Left description */}
            <div className="w-[442px]">
              <p className="text-white text-[22px] leading-[33px] font-montserrat font-normal">
                functionality, and cutting-edge technology, we provide a
                comprehensive online experience that adapts to your needs.
              </p>
            </div>

            {/* Right description */}
            <div className="w-[420px]">
              <p className="text-white text-[20px] leading-[30px] font-montserrat font-normal">
                Our web service is designed to revolutionize the way you
                interact with digital platforms. With a focus on user-centric
                design, seamless
              </p>
            </div>
          </motion.div>

          {/* Statistics cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex justify-between items-center border-t border-white pt-12 border-b pb-12"
          >
            <StatCard number="56" label="Major Projects" />
            <StatCard number="150+" label="Clients" />
            <StatCard number="23" label="Awards" />
            <StatCard number="7" label="Years of work" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
