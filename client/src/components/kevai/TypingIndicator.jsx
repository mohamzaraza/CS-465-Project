export default function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center text-olympus-gold/80 pl-2">
      <span className="animate-bounce">•</span>
      <span className="animate-bounce delay-150">•</span>
      <span className="animate-bounce delay-300">•</span>
    </div>
  );
}