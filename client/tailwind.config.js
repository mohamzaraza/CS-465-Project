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
        "marble-dark": "url('/src/assets/dark-marble.jpg')",
        "marble-white-gold" : "url('/src/assets/gold-marble.avif')",
        "marble-grey" : "url('/src/assets/grey-marble.jpg')",
        "marble-black-gold" : "url('/src/assets/blackg-marble.jpg')",
        "temple" : "url('/src/assets/temple.jpg')",
        
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
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
      },
        }
  },
  plugins: []
};