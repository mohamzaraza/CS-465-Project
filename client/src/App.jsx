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

// Categories
import UpperBody from "./pages/workouts/upper/UpperBody";
import LowerBody from "./pages/workouts/lower/LowerBody";
import Core from "./pages/workouts/core/Core";

// Muscle groups
import Chest from "./pages/workouts/upper/Chest";
import Shoulders from "./pages/workouts/upper/Shoulders";
import Back from "./pages/workouts/upper/Back";
import Biceps from "./pages/workouts/upper/Biceps";
import Triceps from "./pages/workouts/upper/Triceps";
import Forearms from "./pages/workouts/upper/Forearm";

import Quads from "./pages/workouts/lower/Quads";
import Hamstrings from "./pages/workouts/lower/Hamstrings";
import Glutes from "./pages/workouts/lower/Glutes";
import Calves from "./pages/workouts/lower/Calves";

import Abs from "./pages/workouts/core/Abs";
import Obliques from "./pages/workouts/core/Obliques";
import LowerBack from "./pages/workouts/core/LowerBack";

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
          <Route path="/kevai" element={<KevAi/>} />
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

          {/* Upper Body group */}
          <Route path="/workouts/upper" element={<UpperBody />} />
          <Route path="/workouts/upper/chest" element={<Chest />} />
          <Route path="/workouts/upper/back" element={<Back />} />
          <Route path="/workouts/upper/shoulders" element={<Shoulders />} />
          <Route path="/workouts/upper/biceps" element={<Biceps />} />
          <Route path="/workouts/upper/triceps" element={<Triceps />} />
          <Route path="/workouts/upper/forearm" element={<Forearms />} />

          {/* Lower Body group */}
          <Route path="/workouts/lower" element={<LowerBody />} />
          <Route path="/workouts/lower/quads" element={<Quads />} />
          <Route path="/workouts/lower/hamstrings" element={<Hamstrings />} />
          <Route path="/workouts/lower/glutes" element={<Glutes />} />
          <Route path="/workouts/lower/calves" element={<Calves />} />

          {/* Core group */}
          <Route path="/workouts/core" element={<Core />} />
          <Route path="/workouts/core/abs" element={<Abs />} />
          <Route path="/workouts/core/obliques" element={<Obliques />} />
          <Route path="/workouts/core/lowerback" element={<LowerBack />} />

          <Route path="/rank/chest" element={<ProtectedRoute><RankChest /></ProtectedRoute>}/>


          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}