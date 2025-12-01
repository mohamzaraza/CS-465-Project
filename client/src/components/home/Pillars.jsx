import React from "react";

export default function Pillars({ pillars }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
      {pillars.map((pillar) => (
        <div
          key={pillar.title}
          className="relative flex flex-col items-center text-center p-6 bg-black/30 backdrop-blur-md rounded-2xl shadow-lg shadow-black/40 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(201,168,106,0.4)] transition-transform duration-300 cursor-pointer"
        >
          {/* Silhouette behind text */}
          {pillar.image && (
            <img
              src={pillar.image}
              alt={`${pillar.title} `}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-96 h-63 opacity-10 pointer-events-none"
            />
          )}

          <h3 className="text-3xl font-display text-olympus-gold mb-3 z-10">
            {pillar.title}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed z-10">
            {pillar.description}
          </p>
        </div>
      ))}
    </div>
  );
}

