import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative bg-[url('/src/assets/dark-marble.jpg')] bg-cover bg-center text-gray-300 pt-20 pb-10">

      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-t from-transparent to-[#111]" />

      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mb-16">
        ────══❖  LIFTLOGIC  ❖══────
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-12">

        {/* COLUMN 1 */}
        <div>
          <h3 className="text-olympus-gold text-xl font-display mb-4">The Temple</h3>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="hover:text-olympus-gold transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to="/Philosophy" className="hover:text-olympus-gold transition-colors">
                Philosophy
              </Link>
            </li>
            <li>
              <Link to="/Roadmap" className="hover:text-olympus-gold transition-colors">
                Roadmap
              </Link>
            </li>
          </ul>
        </div>

        {/* COLUMN 2 */}
        <div>
          <h3 className="text-olympus-gold text-xl font-display mb-4">Domains</h3>
          <ul className="space-y-2">
            <li><Link to="/Barracks" className="hover:text-olympus-gold transition-colors">Train</Link></li>
            <li><Link to="/dieting" className="hover:text-olympus-gold transition-colors">Nourish</Link></li>
            <li><Link to="/KevAi" className="hover:text-olympus-gold transition-colors">Transform</Link></li>
            <li><Link to="/colosseum" className="hover:text-olympus-gold transition-colors">Compete</Link></li>
          </ul>
        </div>

        {/* COLUMN 3 */}
        <div>
          <h3 className="text-olympus-gold text-xl font-display mb-4">Community</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-olympus-gold transition-colors">Join Discord</a></li>
            <li><a href="#" className="hover:text-olympus-gold transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-olympus-gold transition-colors">X (Twitter)</a></li>
          </ul>
        </div>

      </div>

      <div className="w-full text-center text-olympus-gold text-3xl font-display tracking-widest mt-20 mb-6">
        ───═❖  ❖═───
      </div>

      <p className="text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} LiftLogic — Forge Your Legend.
      </p>

    </footer>
  );
}
