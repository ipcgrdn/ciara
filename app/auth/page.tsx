"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background with same style as landing page */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <Image
            src="/assets/background.svg"
            alt="Background"
            fill
            className="object-cover filter grayscale"
            priority
          />
        </div>
      </div>

      {/* Background decorative element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="relative w-96 h-96 xl:w-128 xl:h-128"
        >
          <Image
            src="/assets/futerals.svg"
            alt="Futerals"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            {/* Back to Home Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Link
                href="/"
                className="absolute top-8 left-8 hidden md:inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-montserrat">Back to Home</span>
              </Link>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-montserrat mb-4 tracking-wider">
                Welcome to
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-montserrat mb-6 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">
                ＣＬＡＲＡ
              </h1>
            </motion.div>

            {/* Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-semibold font-montserrat text-white">
                        Sign in to continue
                      </h2>
                      <p className="text-white/60 text-sm">
                        Start your intelligent writing journey
                      </p>
                    </div>

                    <Button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="w-full h-12 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center justify-center space-x-3 backdrop-blur-sm"
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5 border-2 border-white/60 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="font-medium">
                            Continue with Google
                          </span>
                        </>
                      )}
                    </Button>

                    {/* Features List */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="space-y-3 pt-4 border-t border-white/10"
                    >
                      <p className="text-white/60 text-xs text-center mb-4">
                        What you&apos;ll get with CIARA:
                      </p>
                      <div className="space-y-2">
                        {[
                          "Infinite context understanding",
                          "Real-time collaborative editing",
                          "Academic writing support",
                          "Long-form document assistance",
                        ].map((feature, index) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: 0.7 + index * 0.1,
                            }}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-white rounded-full" />
                            <span className="text-white/80 text-sm">
                              {feature}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    <div className="text-center text-xs text-white/40 pt-4">
                      By signing in, you agree to our{" "}
                      <Link
                        href="/terms"
                        className="underline hover:text-white/60"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="underline hover:text-white/60"
                      >
                        Privacy Policy
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
