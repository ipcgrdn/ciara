"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { OrbitingCircles } from "../ui/OrbitingCircles";
import { Infinity, File, UploadCloud } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  filePath: string;
  fileType: "image" | "video";
  isReversed?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  filePath,
  fileType,
  isReversed = false,
}) => (
  <div className="relative mb-12 sm:mb-16 lg:mb-24 xl:mb-32">
    {/* Content */}
    <div
      className={`relative z-10 flex flex-col ${
        isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
      } items-center justify-between gap-6 sm:gap-8 px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-20`}
    >
      {/* Text content */}
      <div className="w-full lg:w-1/3 text-white">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="font-montserrat font-semibold mb-3 sm:mb-4 lg:mb-6 underline"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            lineHeight: "1.2",
          }}
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-sm sm:text-base lg:text-lg leading-relaxed font-montserrat font-normal opacity-90"
        >
          {description}
        </motion.p>
      </div>

      {/* Images */}
      <div className="flex-1 w-full">
        {fileType === "image" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
          >
            <span className="text-black text-2xl sm:text-4xl font-bold select-none">
              Coming Soon
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative w-full aspect-video rounded-lg overflow-hidden"
          >
            <video src={`${filePath}`} autoPlay loop muted playsInline />
          </motion.div>
        )}
      </div>
    </div>
  </div>
);

const ServicesSection: React.FC = () => {
  const services = [
    {
      title: "Infinite Context",
      description:
        "이제 맥락을 잃지 마세요. Ciara는 전체 문서를 기억하여, 앞뒤 내용이 일치하지 않는 문제를 해결합니다.",
      filePath:
        "https://tvcgnt7ylycddtrr.public.blob.vercel-storage.com/infinite-video.mp4",
      fileType: "video",
    },
    {
      title: "Intelligent Document Indexing",
      description:
        "Ciara는 목차 기반으로 작동합니다. 복잡한 문서도 손쉽게 탐색하고, AI가 항상 섹션별 맥락을 유지합니다.",
      filePath:
        "https://tvcgnt7ylycddtrr.public.blob.vercel-storage.com/index-video.mp4",
      fileType: "video",
      isReversed: true,
    },
    {
      title: "Unified Knowledge Management",
      description:
        "PDF, 워드, 이미지 등 다양한 자료를 한 번에 업로드하고, 태그로 손쉽게 관리하세요. Ciara가 참고 자료로 활용합니다.",
      filePath: "",
      fileType: "image",
    },
  ];

  return (
    <section id="features" className="relative bg-black overflow-hidden">
      {/* #1 Top section with CIARA SERVICES */}
      <div className="relative bg-blue-300 py-8 sm:py-12 lg:py-20 rounded-t-4xl rounded-b-4xl">
        {/* Decorative element - Hidden on mobile and tablet */}
        <div className="hidden xl:block absolute top-1/4 left-1/4 w-64 h-64 rotate-12 opacity-30">
          <Image
            src="/assets/futerals.svg"
            alt="Decorative element"
            fill
            className="object-contain"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main titles */}
          <div className="flex mb-8 sm:mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="font-montserrat font-medium text-black"
              style={{
                fontSize: "clamp(3rem, 12vw, 9rem)",
                lineHeight: "0.9",
              }}
            >
              SERVICES
            </motion.h2>
          </div>

          {/* Description and service list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start">
            {/* Left: Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <p className="text-sm sm:text-base lg:text-xl leading-relaxed font-montserrat font-medium text-black mb-8 sm:mb-12">
                세 가지 기능으로 글쓰기의 새로운 기준을 제시합니다.
                <br className="hidden sm:block" />각 기능은 유기적으로 연결되어
                최고의 작업 환경을 만듭니다.
              </p>
              <div className="flex flex-col gap-y-6 sm:gap-y-8 lg:gap-y-12">
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-montserrat font-medium text-black underline">
                  1. Infinite Context
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-montserrat font-medium text-black underline">
                  2. Intelligent Document Indexing
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-montserrat font-medium text-black underline">
                  3. Unified Knowledge Management
                </p>
              </div>
            </motion.div>

            {/* Right: Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="lg:col-span-7 relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden"
            >
              <OrbitingCircles
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                radius={100}
              >
                <Infinity />
                <File />
                <UploadCloud />
              </OrbitingCircles>
              <OrbitingCircles
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                radius={160}
                reverse
              >
                <Infinity />
                <File />
                <Infinity />
                <UploadCloud />
              </OrbitingCircles>
            </motion.div>
          </div>
        </div>
      </div>

      {/* #2 Bottom section with service cards */}
      <div className="relative bg-black/50 backdrop-blur-md py-12 lg:py-20">
        <div className="container mx-auto">
          {/* Service cards */}
          <div className="space-y-8 lg:space-y-0">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                description={service.description}
                filePath={service.filePath}
                fileType={service.fileType as "image" | "video"}
                isReversed={service.isReversed}
              />
            ))}
          </div>

          {/* Decorative futerals elements - hidden on mobile for cleaner look */}
          <div className="hidden xl:block absolute top-1/4 right-6/7 w-96 h-96 opacity-30 rotate-90 pointer-events-none">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale opacity-50"
            />
          </div>

          <div className="hidden xl:block absolute bottom-1/4 right-1/2 w-96 h-96 opacity-30 rotate-90 pointer-events-none">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale opacity-50"
            />
          </div>

          <div className="hidden lg:block absolute top-1/2 left-12 w-32 h-32 opacity-30 rotate-90 pointer-events-none">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Large decorative element at bottom - extends beyond viewport */}
      <div className="absolute -bottom-24 transform translate-x-1/8 translate-y-2/4 w-512 h-512 opacity-20 rotate-100 overflow-hidden pointer-events-none">
        <Image
          src="/assets/futerals.svg"
          alt="Decorative element"
          fill
          className="object-contain grayscale rotate-180 opacity-50"
        />
      </div>
    </section>
  );
};

export default ServicesSection;
