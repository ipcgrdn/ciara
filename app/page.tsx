"use client";

import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/layout/loading";
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
    return <Loading />;
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
