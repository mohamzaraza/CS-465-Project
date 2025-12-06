import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";


export default function Navbar() {
const [scrolled, setScrolled] = useState(false);
const location = useLocation();


useEffect(() => {
const handleScroll = () => {
setScrolled(window.scrollY > 40);
};


window.addEventListener("scroll", handleScroll);
return () => window.removeEventListener("scroll", handleScroll);
}, []);


const isHome = location.pathname === "/";


return (
<header
className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 backdrop-blur-md
${isHome && !scrolled ? "bg-transparent" : "bg-black/80 shadow-lg"}`}>

<nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 text-white">
{/* Logo */}
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


{/* Links */}
<div className="flex gap-8 text-lg">
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

<Link to="/mealplan" className="hover:text-olympus-gold transition-colors duration-200">
MealPlan</Link>

<Link to="/barracks" className="hover:text-olympus-gold transition-colors duration-200">
Barracks</Link>

<Link to="/theforge" className="hover:text-olympus-gold transition-colors duration-200">
The Forge</Link>

<Link to="/colosseum" className="hover:text-olympus-gold transition-colors duration-200">
Colosseum</Link>




</div>
</nav>
</header>
);
}