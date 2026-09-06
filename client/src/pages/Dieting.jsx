// src/pages/Dieting.jsx

import React from "react";

import DietHeroSection from "../components/dieting/DietHeroSection";
import DietBasicsSection from "../components/dieting/DietBasicsSection";
import FoodCategoriesSection from "../components/dieting/FoodCategoriesSection";
import BuildPlateSection from "../components/dieting/BuildPlateSection";
import DietTipsMythsSection from "../components/dieting/DietTipsMythsSection";
import DietCTASection from "../components/dieting/DietCTASection";
import RevealSection from "../components/dieting/RevealSection";

export default function Dieting() {
  return (
    <div className="w-screen overflow-x-hidden bg-black">
      {/* =====================================================
          SECTION 1 — HERO (DIETING & NUTRITION GUIDE)
          ===================================================== */}
      <section
        className="
          relative min-h-[100vh] w-full
          bg-[url('/src/assets/food.jpg')]
          bg-cover bg-[center_63%] bg-fixed
          flex items-center
        "
      >
     {/* Dark overlay for readability */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />

  {/* Hero content container */}
  <div className="relative w-full max-w-6xl mx-auto px-4 pt-32 pb-20 md:pb-24 ">
    <RevealSection>
    <DietHeroSection />
    </RevealSection>
  </div>
</section>

      {/* =====================================================
          SECTION 2 — BASICS & PRINCIPLES
          ===================================================== */}
      <section
        className="
          relative min-h-screen
          bg-marble-grey bg-cover bg-center bg-fixed
          flex items-center
        "
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/90" />

        <div className="relative w-full max-w-6xl mx-auto px-4 py-20 md:py-24 ">
          <RevealSection>
          <DietBasicsSection />
          </RevealSection>
        </div>
      </section>

      {/* =====================================================
          SECTION 3 — FOOD CATEGORIES + BUILD YOUR PLATE
          ===================================================== */}
      <section
        className="
          relative min-h-screen
          bg-marble-dark bg-cover bg-center bg-fixed
          flex items-center
        "
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/90" />

        <div className="relative w-full max-w-6xl mx-auto px-4 py-20 md:py-24 space-y-12 ">
          <RevealSection>
          <FoodCategoriesSection />
          </RevealSection>

          <RevealSection>
          <BuildPlateSection />
          </RevealSection>
        </div>
      </section>

      {/* =====================================================
          SECTION 4 — GOAL-BASED TIPS + MYTHS + CTA
          ===================================================== */}
      <section
        className="
          relative min-h-screen
          bg-[url('/src/assets/meals.jpg')]
          bg-cover bg-center bg-fixed
          flex items-center
        "
      >
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative w-full max-w-6xl mx-auto px-4 py-20 md:py-24 space-y-12 ">
          <RevealSection>
          <DietTipsMythsSection />
          </RevealSection>

          <RevealSection>
          <DietCTASection />
          </RevealSection>
        </div>
      </section>
    </div>
  );
}

