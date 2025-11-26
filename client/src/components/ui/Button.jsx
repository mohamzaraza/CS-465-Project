import { motion } from "framer-motion";

export default function Button({
  children,
  className = "",
  onClick,
  type = "button",
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-8 py-3
        bg-olympus-gold text-black
        rounded-xl font-display tracking-widest
        shadow-gold-glow
        transition-all duration-300
        ${className}
      `}
      onClick={onClick}
      type={type}
    >
      {children}
    </motion.button>
  );
}