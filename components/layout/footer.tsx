"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="relative bg-black text-white py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 mb-8 sm:mb-10 lg:mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="col-span-1"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-montserrat mb-4 sm:mb-6 tracking-wider">
              CLARA
            </h2>
            <p className="text-xs sm:text-sm font-light font-montserrat leading-relaxed text-white/90">
              AI-powered long-form writing,
              <br />
              from research papers to novels
              <br />
              your intelligent writing partner
            </p>
          </motion.div>

          {/* Sitemap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base sm:text-lg font-light font-montserrat mb-4 sm:mb-6 text-white/80">
              Sitemap
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { name: "Home", href: "/" },
                { name: "About", href: "/about" },
                { name: "Features", href: "/features" },
                { name: "Pricing", href: "/pricing" },
              ].map((item, index) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={item.href}
                    className="text-xs sm:text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base sm:text-lg font-light font-montserrat mb-4 sm:mb-6 text-white/80">
              Company
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { name: "Terms & Conditions", href: "/terms" },
                { name: "Privacy Policy", href: "/privacy" },
              ].map((item, index) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={item.href}
                    className="text-xs sm:text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base sm:text-lg font-light font-montserrat mb-4 sm:mb-6 text-white/80">
              Contact
            </h3>
            <ul className="space-y-3 sm:space-y-4">
              {[
                { name: "FAQ", href: "/faq" },
                { name: "Contact", href: "/contact" },
              ].map((item, index) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={item.href}
                    className="text-xs sm:text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="pt-6 sm:pt-8 lg:pt-12 border-t border-white/20"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 text-center lg:text-left">
            {/* Copyright */}
            <p className="text-xs font-normal font-montserrat text-white/80 order-3 lg:order-1">
              ©2025 CLARA. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 order-2">
              {[
                { name: "LINKEDIN", href: "https://linkedin.com" },
                { name: "INSTAGRAM", href: "https://instagram.com" },
                { name: "X/TWITTER", href: "https://twitter.com" },
              ].map((social, index) => (
                <motion.div
                  key={social.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-normal font-montserrat hover:text-white/70 transition-colors duration-200"
                  >
                    {social.name}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Credit */}
            <p className="text-xs font-normal font-montserrat text-white/80 order-1 lg:order-3">
              Built for Writers, by Writers
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
