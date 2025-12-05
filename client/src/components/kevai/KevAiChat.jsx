import { useState } from "react";
import { askKevAi } from "../../lib/kevaiClient";
import ReactMarkdown from "react-markdown";

export default function KevAiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await askKevAi(input);

      const aiMsg = { role: "assistant", content: reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("KevAi Chat Error:", err);

      const errMsg = {
        role: "assistant",
        content:
          "⚠ KevAi encountered an issue reaching the Oracle. Try again in a moment.",
      };

      setMessages((prev) => [...prev, errMsg]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#111] text-white pt-32 px-6 flex flex-col items-center">

      {/* Title */}
      <h1 className="text-5xl font-display text-olympus-gold mb-10 drop-shadow-lg">
        KevAi — The Oracle of LiftLogic
      </h1>

      {/* Chat Window */}
      <div className="w-full max-w-3xl bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-olympus-gold/20 space-y-4 h-[60vh] overflow-y-auto">

        {messages.map((msg, i) => (
            <div
            key={i}
            className={`p-4 rounded-xl ${
                msg.role === "user"
                ? "bg-olympus-gold/20 border border-olympus-gold/40 text-olympus-gold"
                : "bg-black/50 border border-gray-700"
            }`}
            >
            <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
        </div>

        ))}

        {loading && (
          <div className="italic text-gray-400">
            KevAi is thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="w-full max-w-3xl flex mt-6 gap-3">
        <input
          className="flex-1 p-3 rounded-xl bg-black/60 border border-gray-700 focus:border-olympus-gold outline-none"
          placeholder="Ask KevAi anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-6 py-3 bg-olympus-gold text-black font-display rounded-xl hover:scale-105 transition-all disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
