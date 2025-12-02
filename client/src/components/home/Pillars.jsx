import React from "react";
import PillarCard from "./PillarCard";

export default function Pillars({ pillars }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
      {pillars.map((pillar) => (
        <PillarCard
          key={pillar.title}
          title={pillar.title}
          frontText={pillar.frontText}
          backText={pillar.backText}
          frontImage={pillar.frontImage}
          backImage={pillar.backImage}
          color={pillar.color}
        />
      ))}
    </div>
  );
}