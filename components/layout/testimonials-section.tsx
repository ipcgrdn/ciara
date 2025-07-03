"use client";

import React from "react";
import { motion } from "framer-motion";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote:
        "CIARA completely transformed my thesis writing. The AI actually remembers conversations from weeks ago and builds on them. It's like having a brilliant research partner.",
      name: "Dr. Sarah Chen",
      title: "PhD RESEARCHER",
    },
    {
      quote:
        "I wrote a 200-page technical report with CIARA. The consistency across chapters was perfect - it understood the entire document structure throughout the process.",
      name: "Marcus Johnson",
      title: "SENIOR ENGINEER",
    },
    {
      quote:
        "As a novelist, I need my AI to understand character arcs and plot threads. CIARA's file management and persistent memory make complex storytelling effortless.",
      name: "Elena Rodriguez",
      title: "BESTSELLING AUTHOR",
    },
    {
      quote:
        "Finally, an AI that doesn't forget what we discussed yesterday. The conversation history feature alone saves me hours of re-explaining context.",
      name: "David Kim",
      title: "TECHNICAL WRITER",
    },
    {
      quote:
        "The interface feels like Cursor but for writing. Intuitive, powerful, and clearly built by people who understand long-form content creation.",
      name: "Jessica Park",
      title: "CONTENT STRATEGIST",
    },
    {
      quote:
        "CIARA's outline indexing changed everything. I can jump between sections and the AI instantly understands where I am in my document structure.",
      name: "Prof. Michael Zhang",
      title: "ACADEMIC RESEARCHER",
    },
    {
      quote:
        "The knowledge management system is incredible. All my research materials in one place, perfectly organized, and instantly accessible during writing.",
      name: "Lisa Thompson",
      title: "SCIENCE JOURNALIST",
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
    <section className="relative bg-black py-12 sm:py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 xl:px-24">
        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2
            className="text-white font-montserrat font-semibold leading-tight"
            style={{
              fontSize: "clamp(1.5rem, 6vw, 3.75rem)",
              lineHeight: "1.2",
            }}
          >
            Writers who switched to CIARA
            <br />
            never looked back
          </h2>
        </motion.div>

        {/* Review by section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col items-center mb-8 sm:mb-12 lg:mb-16"
        >
          {/* Decorative line */}
          <div className="relative w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6 sm:mb-8"></div>

          <p className="text-white text-base sm:text-lg lg:text-2xl font-montserrat mb-6 sm:mb-8">
            Loved by creators worldwide :
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
