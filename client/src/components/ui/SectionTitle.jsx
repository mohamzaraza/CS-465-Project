export default function SectionTitle({ children }) {
  return (
    <div className="text-center my-12">
      <h2
        className="
        text-4xl md:text-5xl font-display text-olympus-gold tracking-[0.15em]
        drop-shadow-xl"
      >
        {children}
      </h2>

      <div className="w-24 h-1 bg-olympus-gold/80 mx-auto mt-4 rounded-full shadow-gold-glow"></div>
    </div>
  );
}