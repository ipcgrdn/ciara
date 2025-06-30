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
  <div className="relative mb-16 lg:mb-32">
    {/* Content */}
    <div
      className={`relative z-10 flex flex-col lg:flex-row ${
        isReversed ? "lg:flex-row-reverse" : ""
      } items-center justify-between gap-8 px-4 lg:px-16 py-12 lg:py-20`}
    >
      {/* Text content */}
      <div className="w-full lg:w-1/3 text-white">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-2xl lg:text-4xl font-montserrat font-semibold mb-4 lg:mb-6"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-base lg:text-xl leading-relaxed font-montserrat font-normal opacity-90"
        >
          {description}
        </motion.p>
      </div>

      {/* Images */}
      <div className="flex-1 grid gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      title: "SERVICE 1",
      description:
        "functionality, and cutting-edge technology, we provide a comprehensive online experience that adapts to your needs.",
      imageCount: 2,
    },
    {
      title: "SERVICE 2",
      description:
        "functionality, and cutting-edge technology, we provide a comprehensive online experience that adapts to your needs.",
      imageCount: 1,
      isReversed: true,
    },
    {
      title: "SERVICE 3",
      description:
        "functionality, and cutting-edge technology, we provide a comprehensive online experience that adapts to your needs.",
      imageCount: 3,
    },
  ];

  return (
    <section className="relative bg-black overflow-hidden">
      {/* #1 Top section with CLARA SERVICES */}
      <div className="relative bg-blue-300 py-12 lg:py-20 rounded-t-4xl rounded-b-4xl">
        <div className="hidden xl:block absolute top-1/4 left-1/4 w-256 h-256 rotate-12">
          <Image
            src="/assets/futerals.svg"
            alt="Decorative element"
            fill
            className="object-contain"
          />
        </div>

        <div className="relative z-10 container mx-auto">
          {/* Main titles */}
          <div className="flex mb-12 lg:mb-16">
            <motion.h2
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-6xl lg:text-9xl font-montserrat font-medium text-black"
            >
              SERVICES
            </motion.h2>
          </div>

          {/* Description and service list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <p className="text-base lg:text-xl leading-relaxed font-montserrat font-medium text-black">
                functionality, and cutting-edge technology, we provide a
                comprehensive online experience that adapts to your needs.
              </p>
              <div className="flex flex-col gap-y-12 mt-12">
                <p className="text-xl lg:text-3xl font-montserrat font-medium text-black underline">
                  Service 1
                </p>
                <p className="text-xl lg:text-3xl font-montserrat font-medium text-black underline">
                  Service 2
                </p>
                <p className="text-xl lg:text-3xl font-montserrat font-medium text-black underline">
                  Service 3
                </p>
              </div>
            </motion.div>

            {/* Right: Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="lg:col-span-7 relative aspect-video rounded-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/80 z-10"></div>
              <Image
                src="/assets/placeholder.svg"
                alt="Main service image"
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
              functionality, and cutting-edge technology, we provide a
              comprehensive online experience that adapts to your needs. "Now,
              writing documents is easier and more effortless than ever."
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
          <div className="hidden xl:block absolute top-1/4 right-6/7 w-96 h-96 opacity-30 rotate-90">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale"
            />
          </div>

          <div className="hidden xl:block absolute bottom-1/4 right-1/2 w-96 h-96 opacity-30 rotate-90">
            <Image
              src="/assets/futerals.svg"
              alt="Decorative element"
              fill
              className="object-contain grayscale"
            />
          </div>

          <div className="hidden lg:block absolute top-1/2 left-12 w-32 h-32 opacity-30 rotate-90">
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
      <div className="absolute -bottom-24 transform translate-x-1/8 translate-y-2/4 w-512 h-512 opacity-20 rotate-100 overflow-hidden">
        <Image
          src="/assets/futerals.svg"
          alt="Decorative element"
          fill
          className="object-contain grayscale rotate-180"
        />
      </div>
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </section>
  );
};

export default ServicesSection;
