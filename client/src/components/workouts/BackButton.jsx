import { useNavigate } from "react-router-dom";

export default function BackButton({ to }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="mb-10 px-6 py-2 text-lg font-display text-olympus-gold 
                 border border-olympus-gold/40 rounded-md
                 hover:bg-olympus-gold hover:text-black 
                 transition-all duration-300"
    >
      ← Back
    </button>
  );
}