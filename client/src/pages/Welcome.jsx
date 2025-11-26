import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-hero-greek bg-cover bg-center flex items-center justify-center relative">

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-6">

        {/* Main Title */}
        <h1 className="text-titan font-display text-olympus-gold tracking-[0.15em] drop-shadow-2xl animate-fadeInSlow">
          ASCEND TO OLYMPUS
        </h1>

        {/* Subtitle */}
        <p className="text-xl mt-8 font-body text-gray-200 max-w-2xl mx-auto leading-relaxed animate-fadeInSlow delay-[400ms]">
          “Strength is earned in silence.  
          Victory is forged in discipline.  
          Step inside — and rise beyond mortal limits.”
        </p>

        {/* Button */}
        <button
          onClick={() => navigate("/home")}
          className="mt-12 px-12 py-4 font-display text-xl text-olympus-black 
          bg-olympus-gold rounded-xl shadow-gold-glow 
          hover:scale-105 transition-transform duration-200 
          animate-fadeInSlow delay-[800ms]"
        >
          ENTER THE TEMPLE
        </button>

      </div>
    </div>
  );
}