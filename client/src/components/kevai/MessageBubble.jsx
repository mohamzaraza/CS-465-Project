export default function MessageBubble({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed 
          ${isUser
            ? "bg-olympus-gold text-olympus-black"
            : "bg-black/60 border border-olympus-gold/25 text-gray-200"
          }
        `}
      >
        {text}
      </div>
    </div>
  );
}