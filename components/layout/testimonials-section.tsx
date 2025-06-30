"use client";

import React from "react";
import { motion } from "framer-motion";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote:
        "I've tried several AI writing tools, but this one really stands out. It's intuitive, fast, and produces surprisingly natural-sounding text.",
      name: "Amy Yang",
      title: "GRAPHIC DESIGNER",
    },
    {
      quote:
        "The AI-powered features have completely transformed my writing workflow. I can focus on creativity while the tool handles the technical aspects.",
      name: "John Smith",
      title: "CONTENT WRITER",
    },
    {
      quote:
        "Clara has become an essential part of my daily routine. The quality of output is consistently impressive and saves me hours of work.",
      name: "Sarah Johnson",
      title: "MARKETING MANAGER",
    },
    {
      quote:
        "As a developer, I appreciate how Clara understands context and helps me write better documentation and comments.",
      name: "Mike Chen",
      title: "SOFTWARE ENGINEER",
    },
    {
      quote:
        "The user interface is clean and intuitive. Even non-technical team members can use it effectively.",
      name: "Lisa Brown",
      title: "PROJECT MANAGER",
    },
    {
      quote:
        "Clara's AI suggestions are remarkably accurate and help me maintain consistency across all my writing projects.",
      name: "David Wilson",
      title: "TECHNICAL WRITER",
    },
    {
      quote:
        "The collaborative features make it easy to work with my team. We can share projects and maintain our brand voice effortlessly.",
      name: "Emma Davis",
      title: "CREATIVE DIRECTOR",
    },
  ];

  const avatarUrls = [
    "/assets/placeholder.svg",
    "/assets/placeholder.svg",
    "/assets/placeholder.svg",
    "/assets/placeholder.svg",
    "/assets/placeholder.svg",
    "/assets/placeholder.svg",
  ];

  return (
    <section className="relative bg-black py-16 lg:py-24">
      <div className="container mx-auto px-6 lg:px-16 xl:px-24">
        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-white text-3xl lg:text-5xl xl:text-6xl font-montserrat font-semibold leading-tight">
            We built Clara to help
            <br />
            creative developers work better.
          </h2>
        </motion.div>

        {/* Review by section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-12 lg:mb-16"
        >
          {/* Decorative line */}
          <div className="relative w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"></div>

          <p className="text-white text-lg lg:text-2xl font-montserrat mb-8">
            Review by :
          </p>

          {/* Avatar Circles */}
          <AvatarCircles numPeople={99} avatarUrls={avatarUrls} />
        </motion.div>

        {/* Infinite Moving Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="w-full"
        >
          <InfiniteMovingCards
            items={testimonials}
            direction="left"
            speed="slow"
            pauseOnHover={true}
            className="w-full"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
