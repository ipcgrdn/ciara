"use client";

import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/header";
import HeroSection from "@/components/layout/hero-section";
import ServicesSection from "@/components/layout/services-section";
import TestimonialsSection from "@/components/layout/testimonials-section";
import PricingSection from "@/components/layout/pricing-section";
import CTASection from "@/components/layout/cta-section";
import Footer from "@/components/layout/footer";

export default function LandingPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-sm font-bold">C</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main>
      <Header />
      <HeroSection />
      <ServicesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  );
}
