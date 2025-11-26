import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  const location = useLocation();

  // Hide navbar/footer on Welcome page
  const hideLayout = location.pathname === "/";

  return (
    <>
      {!hideLayout && <Navbar />}
      <main style={{ padding: hideLayout ? "0" : "20px" }}>
        {children}
      </main>
      {!hideLayout && <Footer />}
    </>
  );
}