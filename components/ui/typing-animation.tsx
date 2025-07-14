"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TypingAnimationProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
  startOnView?: boolean;
}

export default function TypingAnimation({
  children,
  className,
  style,
  duration = 100,
  delay = 0,
  as: Component = "div",
  startOnView = false,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [i, setI] = useState(0);
  const [isInView, setIsInView] = useState(!startOnView);

  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        setI(i + 1);
      }
    }, delay + i * duration);

    return () => clearTimeout(timer);
  }, [i, children, duration, delay, isInView]);

  return (
    <motion.div
      initial={startOnView ? { opacity: 0 } : {}}
      whileInView={startOnView ? { opacity: 1 } : {}}
      onViewportEnter={() => setIsInView(true)}
      viewport={{ once: true }}
    >
      <Component className={cn(className)} style={style}>
        {displayedText}
      </Component>
    </motion.div>
  );
}
