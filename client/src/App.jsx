import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import Home from "./pages/Home";
import About from "./pages/About";
import Philosophy from "./pages/Philosophy";
import Roadmap from "./pages/Roadmap";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Calculator from "./pages/Calculator";
import Welcome from "./pages/Welcome";
import Dieting from "./pages/Dieting";
import KevAi from "./pages/KevAi";
import Barracks from "./pages/Barracks";
import TheForge from "./pages/TheForge"
import ColosseumGate from "./components/colosseum/ColosseumGate";   // NEW GATE WRAPPER
// ColosseumPage is NOW loaded inside ColosseumGate only, never routed directly.


// Workouts home
import WorkoutsHome from "./pages/workouts/index";

// Regions and muscle groups, both driven by data/muscleGroups.js
import RegionPage from "./pages/workouts/RegionPage";
import MusclePage from "./pages/workouts/MusclePage";

//AUTHENTICATION
import { useAuth } from "./context/useAuth";
import AuthNavigator from "./context/AuthNavigator";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";

import RankChest from "./pages/RankChest";


export default function App() {
    const { loading } = useAuth();

  // Vite serves the app under the `base` set in vite.config.js ("/CS-465-Project/"),
  // so the router has to know about that prefix or every route falls through to NotFound.
  // The trailing slash is stripped because React Router expects "/CS-465-Project", not "/CS-465-Project/".
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    ); 
  }

  return (
    <Router basename={basename}>
      <AuthNavigator />
      <MainLayout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/philosophy" element={<Philosophy />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/kevai" element={<ProtectedRoute><KevAi/></ProtectedRoute>} />
          <Route path="/dieting" element={<Dieting />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/calculator" element={<Calculator />} />

          {/* Premium Pages */}

          <Route path="/barracks" element={<ProtectedRoute><Barracks /></ProtectedRoute>}/>
          <Route path="/theforge" element={<ProtectedRoute><TheForge /></ProtectedRoute>} />
          <Route path="/colosseum"element={<ProtectedRoute><ColosseumGate /></ProtectedRoute>}/>

          {/* LOGIN */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Workouts Home */}
          <Route path="/workouts" element={<WorkoutsHome />} />

          {/* Regions (upper, lower, core) and their muscles; unknown slugs render NotFound */}
          <Route path="/workouts/:region" element={<RegionPage />} />
          <Route path="/workouts/:region/:muscle" element={<MusclePage />} />

          <Route path="/rank/chest" element={<ProtectedRoute><RankChest /></ProtectedRoute>}/>


          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}