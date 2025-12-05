import { useState } from "react";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user's message
    setMessages(prev => [...prev, { role: "user", text }]);
    setThinking(true);

    // Simulate KevAi until you add the real API
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "KevAi (mock): I received your message. Once API is added, I will respond intelligently."
        }
      ]);
      setThinking(false);
    }, 1200);
  };

  return (
    <div className="w-full bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-olympus-gold/20 shadow-xl">

      {/* Messages */}
      <div className="h-[28rem] overflow-y-auto pr-3 space-y-6">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} text={msg.text} />
        ))}

        {thinking && <TypingIndicator />}
      </div>

      {/* Input */}
      <InputBar onSend={sendMessage} />
    </div>
  );
}