import { useState } from "react";

export default function InputBar({ onSend }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask KevAi anything..."
        className="
          flex-1 px-4 py-3 rounded-xl bg-black/40 text-gray-200 
          border border-olympus-gold/25 outline-none
          focus:border-olympus-gold transition-all duration-200
        "
      />

      <button
        type="submit"
        className="
          px-6 py-3 bg-olympus-gold text-olympus-black font-display rounded-xl
          hover:scale-105 transition-all duration-200 shadow-gold-glow
        "
      >
        Send
      </button>
    </form>
  );
}