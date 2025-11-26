/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      backgroundImage: {
        "hero-olympus": "url('/src/assets/homebg.jpg')",
        "hero-greek":
          "url('https://images.unsplash.com/photo-1603166980821-2a343b3bf3f1?auto=format&fit=crop&w=1600&q=80')",
        "marble-dark":
          "url('https://images.unsplash.com/photo-1587307358481-884c4d843012?auto=format&fit=crop&w=1600&q=80')",
        "marble-gold":
          "url('https://images.unsplash.com/photo-1589987607627-6160f8798ed1?auto=format&fit=crop&w=1600&q=80')"
      },

      fontFamily: {
        display: ["Cinzel", "serif"],
        body: ["Inter", "sans-serif"]
      },

      colors: {
        olympus: {
          black: "#0B0C10",
          charcoal: "#1A1C1F",
          stone: "#2A2D31",
          gold: "#C9A86A",
          goldlight: "#E7D5A4",
          red: "#B23A48",
          amber: "#FFB648"
        }
      },

      boxShadow: {
        "gold-glow": "0 0 20px rgba(201,168,106,0.4)",
        deep: "0 4px 20px rgba(0,0,0,0.6)"
      },

      fontSize: {
        hero: "4rem",
        myth: "5.5rem",
        titan: "7rem"
      }
    }
  },
  plugins: []
};