"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

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
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: isPopular ? 0.1 : 0 }}
    viewport={{ once: true }}
    className={`
      relative group
      ${
        isPopular
          ? "w-full max-w-sm lg:max-w-md scale-105 lg:scale-110"
          : "w-full max-w-xs lg:max-w-sm"
      }
      ${isPopular ? "h-96 lg:h-[28rem]" : "h-80 lg:h-96"}
              backdrop-blur-xl bg-white/10 border border-white/20
        rounded-2xl lg:rounded-3xl p-6 lg:p-8
        flex flex-col justify-between
        hover:bg-white/15 transition-all duration-300
        shadow-2xl hover:shadow-3xl
        ${isPopular ? "ring-1 ring-blue-500/50" : ""}
    `}
  >
    {/* Popular Badge */}
    {isPopular && (
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="bg-white text-black text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">
          Most Popular
        </div>
      </div>
    )}

    {/* Header */}
    <div className="text-center">
      <h3 className="text-2xl lg:text-3xl font-montserrat font-semibold text-white mb-2 lg:mb-4">
        {title}
      </h3>
      <p className="text-3xl lg:text-4xl xl:text-5xl font-sans font-bold text-white">
        {price}
      </p>
      {price.includes("/") && (
        <p className="text-sm text-white/70 mt-1">per month</p>
      )}
    </div>

    {/* Features */}
    <div className="flex-1 flex flex-col justify-center space-y-3 lg:space-y-4 mt-6 lg:mt-8">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-white flex items-center justify-center">
            <Check className="w-3 h-3 lg:w-4 lg:h-4 text-black" />
          </div>
          <span className="text-sm lg:text-base font-montserrat text-white/90 leading-relaxed">
            {feature}
          </span>
        </div>
      ))}
    </div>

    {/* Button */}
    <div className="mt-6 lg:mt-8">
      <Button
        className={`
          w-full h-12 lg:h-14 rounded-xl lg:rounded-2xl 
          text-sm lg:text-base font-montserrat font-medium
          transition-all duration-300 transform hover:scale-[1.02]
          ${
            isPopular
              ? "bg-white hover:bg-gray-100 text-black shadow-lg hover:shadow-xl"
              : "bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50"
          }
        `}
      >
        {buttonText}
      </Button>
    </div>

    {/* Glass effect overlay */}
    <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
  </motion.div>
);

const PricingSection: React.FC = () => {
  const plans = [
    {
      title: "Free",
      price: "$0",
      features: [
        "Basic document editing",
        "Limited AI assistance",
        "5 documents per month",
      ],
      buttonText: "Get Started Free",
      isPopular: false,
    },
    {
      title: "Pro",
      price: "$9.99/mo",
      features: [
        "Unlimited document editing",
        "Advanced AI assistance",
        "Unlimited documents",
        "Priority support",
        "Collaboration features",
      ],
      buttonText: "Start Pro Trial",
      isPopular: true,
    },
  ];

  return (
    <section className="relative bg-black overflow-hidden py-16 lg:py-24">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_70%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-montserrat font-semibold text-white text-center mb-6 lg:mb-8"
          >
            Simple pricing,
            <br className="hidden sm:block" />
            <span className="text-blue-200">powerful features</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg lg:text-xl text-white/80 text-center max-w-3xl mx-auto leading-relaxed"
          >
            Choose the perfect plan for your writing journey.
            <br />
            Upgrade or downgrade at any time with no hidden fees.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col lg:flex-row justify-center items-end lg:items-center gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12 lg:mt-16"
        >
          <p className="text-sm lg:text-base text-white/60 mb-4">
            7-day free trial • Cancel anytime • No setup fees
          </p>
          <p className="text-xs lg:text-sm text-white/40">
            All plans include our core AI writing features and regular updates
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
