"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="relative bg-black text-white py-16">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16 mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <h2 className="text-4xl font-bold font-montserrat mb-6 tracking-wider">
              CLARA
            </h2>
            <p className="text-sm font-light font-montserrat leading-relaxed text-white/90">
              ULTIMATE ESSAY AI,
              <br />
              PAPER AI, ACADEMIC WRITING
              <br />
              AI ASSISTANT
            </p>
          </motion.div>

          {/* Sitemap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-lg font-light font-montserrat mb-6 text-white/80">
              Sitemap
            </h3>
            <ul className="space-y-4">
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
                    className="text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
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
            <h3 className="text-lg font-light font-montserrat mb-6 text-white/80">
              Company
            </h3>
            <ul className="space-y-4">
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
                    className="text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact & Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {/* Contact Links */}
            <h3 className="text-lg font-light font-montserrat mb-6 text-white/80">
              Contact
            </h3>
            <ul className="space-y-4 mb-8">
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
                    className="text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
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
          className="pt-12 border-t border-white/20"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Copyright */}
            <p className="text-xs font-normal font-montserrat text-white/80">
              ©2025 CLARA SUPPLY B.V. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex space-x-6">
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
            <p className="text-xs font-normal font-montserrat text-white/80">
              A THING BY DENNIS & ILJA
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
