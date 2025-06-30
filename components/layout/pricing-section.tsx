"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  buttonText: string;
  isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  buttonText,
  isPopular = false,
}) => {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: isPopular ? 0.1 : 0 }}
      viewport={{ once: true }}
      className={`
      relative group w-full
      ${isPopular ? "max-w-sm lg:max-w-md" : "max-w-xs lg:max-w-sm"}
      ${isPopular ? "lg:scale-105 xl:scale-110" : ""}
      min-h-[400px] sm:min-h-[450px] lg:min-h-[500px]
      backdrop-blur-xl bg-white/10 border border-white/20
      rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8
      flex flex-col justify-between
      hover:bg-white/15 transition-all duration-300
      shadow-2xl hover:shadow-3xl
      ${isPopular ? "ring-1 ring-blue-500/50" : ""}
      mx-auto
    `}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-white text-black text-xs font-semibold px-2 sm:px-3 py-1 rounded-full border border-gray-200">
            Most Popular
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-montserrat font-semibold text-white mb-2 lg:mb-4">
          {title}
        </h3>
        <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-sans font-bold text-white">
          {price}
        </p>
        {price.includes("/") && (
          <p className="text-xs sm:text-sm text-white/70 mt-1">per month</p>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-3 lg:space-y-4 mt-4 sm:mt-6 lg:mt-8">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-2 sm:space-x-3">
            <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full bg-white flex items-center justify-center mt-0.5">
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-black" />
            </div>
            <span className="text-xs sm:text-sm lg:text-base font-montserrat text-white/90 leading-relaxed">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* Button */}
      <div className="mt-4 sm:mt-6 lg:mt-8">
        <Button
          className={`
          w-full h-10 sm:h-12 lg:h-14 rounded-lg sm:rounded-xl lg:rounded-2xl 
          text-xs sm:text-sm lg:text-base font-montserrat font-medium
          transition-all duration-300 transform hover:scale-[1.02]
          ${
            isPopular
              ? "bg-white hover:bg-gray-100 text-black shadow-lg hover:shadow-xl"
              : "bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50"
          }
        `}
          onClick={() => {
            router.push("/auth");
          }}
        >
          {buttonText}
        </Button>
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </motion.div>
  );
};

const PricingSection: React.FC = () => {
  const plans = [
    {
      title: "Free",
      price: "$0",
      features: [
        "Smart document editor",
        "10 AI conversations/month",
        "Up to 3 documents",
        "Basic file uploads",
      ],
      buttonText: "Start Writing Free",
      isPopular: false,
    },
    {
      title: "Pro",
      price: "$9.99/mo",
      features: [
        "Unlimited document editing",
        "Unlimited AI conversations",
        "Unlimited documents",
        "Advanced file management (50MB)",
        "Auto-generated outlines",
        "Priority support",
        "Collaboration features (coming soon)",
      ],
      buttonText: "Upgrade to Pro",
      isPopular: true,
    },
  ];

  return (
    <section className="relative bg-black overflow-hidden py-12 sm:py-16 lg:py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-montserrat font-semibold text-white text-center mb-4 sm:mb-6 lg:mb-8"
            style={{
              fontSize: "clamp(2rem, 8vw, 4.375rem)",
              lineHeight: "1.1",
            }}
          >
            Simple pricing,
            <br className="sm:block" />
            <span className="text-blue-200">infinite possibilities</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-sm sm:text-base lg:text-xl text-white/80 text-center max-w-3xl mx-auto leading-relaxed px-4"
          >
            Choose your writing superpower. Start free, upgrade when ready.
            <br className="hidden sm:block" />
            No hidden fees, no commitment - just pure writing excellence.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-end lg:items-center gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="flex-1 max-w-sm mx-8 md:mx-auto sm:mx-0"
            >
              <PricingCard {...plan} />
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-12 lg:mt-16 px-4"
        >
          <p className="text-xs sm:text-sm lg:text-base text-white/60 mb-2 sm:mb-4">
            7-day free trial • Cancel anytime • No setup fees
          </p>
          <p className="text-xs lg:text-sm text-white/40">
            All plans include our revolutionary AI writing engine and regular
            feature updates
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
