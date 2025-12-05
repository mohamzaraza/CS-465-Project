// src/components/dieting/RevealSection.jsx
import React, { useRef, useEffect, useState } from "react";

export default function RevealSection({ children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target); // animate once
        }
      },
      {
        threshold: 0.2, // 20% in view triggers it
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}