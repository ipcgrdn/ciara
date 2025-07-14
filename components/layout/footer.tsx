"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="relative bg-black text-white py-8 sm:py-12 lg:py-16"
    >
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
            <Image src="/logo.svg" alt="Ciara Logo" width={120} height={120} />
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
                { name: "소개", href: "/#about" },
                { name: "기능", href: "/#features" },
                { name: "가격", href: "/#pricing" },
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
                { name: "이용약관", href: "/terms", disabled: true },
                { name: "개인정보처리방침", href: "/privacy", disabled: true },
              ].map((item, index) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05 }}
                  viewport={{ once: true }}
                >
                  {item.disabled ? (
                    <span
                      className="text-xs sm:text-sm font-medium font-montserrat opacity-50 cursor-not-allowed"
                      aria-disabled="true"
                    >
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-xs sm:text-sm font-medium font-montserrat hover:text-white/70 transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  )}
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
                { name: "문의하기", href: "https://open.kakao.com/o/gtiAgUGh" },
                {
                  name: "카카오톡 오픈채팅",
                  href: "https://open.kakao.com/o/gtiAgUGh",
                },
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
      </div>
    </footer>
  );
}
