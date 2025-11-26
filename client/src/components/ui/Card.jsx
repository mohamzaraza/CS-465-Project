export default function Card({ children, className = "" }) {
  return (
    <div
      className={`
        bg-black/40 backdrop-blur-md
        border border-olympus-gold/20
        rounded-2xl p-6
        shadow-lg shadow-black/40
        hover:border-olympus-gold/40
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}