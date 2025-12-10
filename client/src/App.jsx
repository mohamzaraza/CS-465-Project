import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Calculator from "./pages/Calculator";
import MealPlan from "./pages/MealPlan";
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

export default function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/kevai" element={<KevAi/>} />
          <Route path="/dieting" element={<Dieting />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/mealplan" element={<MealPlan />} />

          {/* Premium Pages */}

          <Route path="/barracks" element={<Barracks />} />
          <Route path="/theforge" element={<TheForge />} />
          <Route path="/colosseum"element={<MainLayout hideFooter={true}> <ColosseumGate /> </MainLayout>}
          />

          {/*<Route path="/colosseum" element={<Colosseum />} />*/}

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


          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}