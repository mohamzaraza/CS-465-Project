import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  const location = useLocation();

  // Pages that hide both navbar & footer
  const hideFullLayout = location.pathname === "/";

  // Pages that hide ONLY the footer
  const hideFooter =
    location.pathname === "/colosseum";  // <--- Add more here if needed

  return (
    <>
      {/* Navbar */}
      {!hideFullLayout && <Navbar />}

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      {!hideFullLayout && !hideFooter && <Footer />}
    </>
  );
}
