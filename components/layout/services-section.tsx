"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ServiceCardProps {
  title: string;
  description: string;
  imageCount: number;
  isReversed?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  imageCount,
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
          className="font-montserrat font-semibold mb-3 sm:mb-4 lg:mb-6"
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
          className="text-sm sm:text-base lg:text-xl leading-relaxed font-montserrat font-normal opacity-90"
        >
          {description}
        </motion.p>
      </div>

      {/* Images */}
      <div className="flex-1 w-full">
        {imageCount === 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative w-full aspect-video rounded-lg overflow-hidden"
          >
            <Image
              src="/assets/placeholder.svg"
              alt="Service image"
              fill
              className="object-cover"
            />
          </motion.div>
        )}

        {imageCount === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[1, 2].map((num, index) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                viewport={{ once: true }}
                className="relative w-full aspect-video rounded-lg overflow-hidden"
              >
                <Image
                  src="/assets/placeholder.svg"
                  alt={`Service image ${num}`}
                  fill
                  className="object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}

        {imageCount === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((num, index) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                viewport={{ once: true }}
                className="relative w-full aspect-video rounded-lg overflow-hidden"
              >
                <Image
                  src="/assets/placeholder.svg"
                  alt={`Service image ${num}`}
                  fill
                  className="object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const ServicesSection: React.FC = () => {
  const services = [
    {
      title: "Persistent AI Conversations",
      description:
        "Never lose context again. Our AI remembers every discussion, building on previous conversations to deliver increasingly intelligent assistance. Chat history that evolves with your document.",
      imageCount: 2,
    },
    {
      title: "Intelligent Document Indexing",
      description:
        "Automatically parse markdown headers to understand your document's DNA. Navigate complex structures effortlessly while AI maintains section-aware context throughout your writing process.",
      imageCount: 1,
      isReversed: true,
    },
    {
      title: "Unified Knowledge Management",
      description:
        "Upload PDFs, Word docs, images, and more. Tag, organize, and instantly access your research materials. Drag-and-drop simplicity meets enterprise-grade file management.",
      imageCount: 3,
    },
  ];

  return (
    <section className="relative bg-black overflow-hidden">
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
                Three revolutionary features that transform how you write. Each
                component works in perfect harmony to create the ultimate
                writing environment.
              </p>
              <div className="flex flex-col gap-y-6 sm:gap-y-8 lg:gap-y-12">
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-montserrat font-medium text-black underline">
                  Infinite Memory
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-montserrat font-medium text-black underline">
                  Smart Structure
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-montserrat font-medium text-black underline">
                  Total Control
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
              <Image
                src="/assets/placeholder.svg"
                alt="Hero service image"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* #2 Bottom section with service cards */}
      <div className="relative bg-black/50 backdrop-blur-md py-12 lg:py-20">
        <div className="container mx-auto">
          {/* Quote text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-left mb-12 lg:mb-20"
          >
            <p className="text-white text-xl lg:text-2xl leading-relaxed font-montserrat font-normal max-w-4xl">
              We&apos;ve shattered the context window. Finally, an AI that
              understands your entire manuscript from introduction to
              conclusion. &ldquo;Writing has never felt this natural and
              powerful.&rdquo;
            </p>
          </motion.div>

          {/* Service cards */}
          <div className="space-y-8 lg:space-y-0">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                description={service.description}
                imageCount={service.imageCount}
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
              className="object-contain grayscale"
            />
          </div>

          <div className="hidden xl:block absolute bottom-1/4 right-1/2 w-96 h-96 opacity-30 rotate-90 pointer-events-none">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale"
            />
          </div>

          <div className="hidden lg:block absolute top-1/2 left-12 w-32 h-32 opacity-30 rotate-90 pointer-events-none">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale"
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
          className="object-contain grayscale rotate-180"
        />
      </div>
    </section>
  );
};

export default ServicesSection;
