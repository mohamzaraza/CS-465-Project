export default function Footer() {
  return (
    <footer className="relative bg-[url('/src/assets/dark-marble.jpg')] bg-cover bg-center text-gray-300 pt-20 pb-10">

      {/* Fade Upper part (Same as Hero) */}
      <div className="absolute top-0 left-0 w-full h-40 
        bg-gradient-to-t from-transparent to-[#111]">
      </div>

      {/* TOP BORDER */}
      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mb-16">
        ────══❖  LIFTLOGIC  ❖══────
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-12">

        {/* COLUMN 1 */}
        <div>
          <h3 className="text-olympus-gold text-xl font-display mb-4">The Temple</h3>
          <ul className="space-y-2">
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">About</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Philosophy</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Roadmap</li>
          </ul>
        </div>

        {/* COLUMN 2 */}
        <div>
          <h3 className="text-olympus-gold text-xl font-display mb-4">Domains</h3>
          <ul className="space-y-2">
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Train</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Nourish</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Transform</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Compete</li>
          </ul>
        </div>

        {/* COLUMN 3 */}
        <div>
          <h3 className="text-olympus-gold text-xl font-display mb-4">Community</h3>
          <ul className="space-y-2">
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Join Discord</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">Instagram</li>
            <li className="hover:text-olympus-gold transition-colors cursor-pointer">X (Twitter)</li>
          </ul>
        </div>

      </div>

      {/* BOTTOM BORDER */}
      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mt-20 mb-6">
        ───═❖  ❖═───
      </div>

      {/* COPYRIGHT */}
      <p className="text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} LiftLogic — Forge Your Legend.
      </p>

    </footer>
  );
}