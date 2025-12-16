import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function Navbar() {
const [scrolled, setScrolled] = useState(false);
const location = useLocation();

const { user, setUser } = useAuth();
const navigate = useNavigate();


useEffect(() => {
const handleScroll = () => {
setScrolled(window.scrollY > 40);
};


window.addEventListener("scroll", handleScroll);
return () => window.removeEventListener("scroll", handleScroll);
}, []);


const isHome = location.pathname === "/";

function handleLogout() {
  localStorage.removeItem("token");
  setUser(null);
  navigate("/login");
}


return (
<header
className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 backdrop-blur-md
${isHome && !scrolled ? "bg-transparent" : "bg-black/80 shadow-lg"}`}>

<nav className="max-w-7xl mx-auto flex items-center px-6 py-4 text-white">

  {/* LEFT — Logo */}
  <div className="flex items-center gap-3 shrink-0">
    <Link to="/" className="flex items-center gap-3">
      <img
        src="/src/assets/navlogo.png"
        alt="LiftLogic Logo"
        className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(201,168,106,0.6)]"
      />
      <span className="font-display text-2xl text-olympus-gold tracking-wide">
        LiftLogic
      </span>
    </Link>
  </div>


{/* LINKS */}
  <div className="flex-1 flex justify-center">
    <div className="flex gap-8 text-lg whitespace-nowrap">
<Link to="/home" className="hover:text-olympus-gold transition-colors duration-200">
Home</Link>

<Link to="/workouts" className="hover:text-olympus-gold transition-colors duration-200">
Workouts</Link>

<Link to="/kevai" className="hover:text-olympus-gold transition-colors duration-200">
KevAi</Link>

<Link to="/dieting" className="hover:text-olympus-gold transition-colors duration-200">
Dieting</Link>

<Link to="/calculator" className="hover:text-olympus-gold transition-colors duration-200">
Calculator</Link>

<Link to="/barracks" className="hover:text-olympus-gold transition-colors duration-200">
Barracks</Link>

<Link to="/theforge" className="hover:text-olympus-gold transition-colors duration-200">
The Forge</Link>

<Link to="/colosseum" className="hover:text-olympus-gold transition-colors duration-200">
Colosseum</Link>

  </div>
</div>

{/* AUTH UI */}
<div className="flex items-center gap-4 max-w-[240px] justify-end shrink-0">
  {!user ? (
    <Link
      to="/login"
      className="px-4 py-2 rounded-lg bg-red-600 text-black font-display 
                 hover:scale-105 transition"
    >
      Sign In
    </Link>
  ) : (
    <>
      <span className="max-w-[160px] truncate text-sm text-gray-300">
      {user.email}
      </span>

      <button
        onClick={handleLogout}
        className="px-3 py-1 text-sm rounded-md border border-red-600 text-red-400 hover:bg-red-600 hover:text-black transition"
      >
        Logout
      </button>
    </>
  )}
</div>

</nav>
</header>
);
}