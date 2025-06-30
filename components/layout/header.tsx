"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Header() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Contact", href: "#contact" },
  ];

  const languages = [
    { code: "en", name: "English" },
    { code: "ko", name: "한국어" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-black/30 backdrop-blur-xl rounded-l-3xl rounded-r-3xl mt-4 ml-4 mr-4"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center"
          >
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-white text-xl font-bold tracking-wider">
                CLARA
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden lg:flex items-center space-x-8"
          >
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                <Link
                  href={link.href}
                  className="text-white text-sm font-normal hover:text-white/80 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
          </motion.nav>

          {/* Right Side - Language, Login, Start Free */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center space-x-4"
          >
            {/* Language Selector */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-1 text-white text-sm font-medium hover:text-white/80 transition-colors"
              >
                <span>English</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {isLanguageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 right-0 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden min-w-[140px]"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setIsLanguageOpen(false)}
                        className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors flex items-center space-x-2"
                      >
                        <span className="text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Start Free Button */}
            <Link href={user ? "/dashboard" : "/auth"}>
              <Button
                size="sm"
                className="bg-white text-black hover:bg-white/90 font-medium px-6 py-2 rounded-full transition-all duration-200 hover:scale-105"
              >
                {user ? "Dashboard" : "Start Free"}
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden text-white p-2"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-white text-lg font-normal hover:text-white/80 transition-colors py-2"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Language Selector */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center space-x-2 text-white text-lg font-medium mb-3">
                  <span>Language</span>
                </div>
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                    >
                      <span className="text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <Link href={user ? "/dashboard" : "/auth"}>
                  <Button
                    onClick={() => setIsMenuOpen(false)}
                    size="sm"
                    className="w-full bg-white text-black hover:bg-white/90 font-medium rounded-full"
                  >
                    {user ? "Dashboard" : "Start Free"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
