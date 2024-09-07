import React from "react";
import Home from "./home/home";
import About from "./about/about";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Updated import
import "./Main.css";
import Workouts from "./workouts/workouts";
import HSFootball from "./football/hsFootball";
import NCAAFootball from "./football/ncaaFootball";
import NFLFootball from "./football/nflFootball";
import Woodshop from "./woodshop/woodshop";
import Vlog from "./vlog/vlog";
import PlyoBox from "./woodshop/plyobox";
import WorkoutInstructions from "./workouts/workouts-instructional";
import Childhood from "./about/childhood";
import College from "./about/college";
import Nfl from "./about/nfl";
import IT from "./about/it";
import Wedding from "./about/wedding";

export default function App() {
  return (
    <Router>
      <div className={"main-content"}>
        {/* A <Routes> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Routes> {/* Updated Switch to Routes */}
          <Route path="/about/childhood" element={<Childhood />} /> {/* Updated Route */}
          <Route path="/about/college" element={<College />} /> {/* Updated Route */}
          <Route path="/about/nfl" element={<Nfl />} /> {/* Updated Route */}
          <Route path="/about/wedding" element={<Wedding />} /> {/* Updated Route */}
          <Route path="/about/it" element={<IT />} /> {/* Updated Route */}
          <Route path="/about" element={<About />} /> {/* Updated Route */}
          <Route path="/hobbies/vlog" element={<Vlog />} /> {/* Updated Route */}
          <Route path="/hobbies/workouts/instructions" element={<WorkoutInstructions />} /> {/* Updated Route */}
          <Route path="/hobbies/workouts" element={<Workouts />} /> {/* Updated Route */}
          <Route path="/hobbies/woodshop/plyobox" element={<PlyoBox />} /> {/* Updated Route */}
          <Route path="/hobbies/woodshop" element={<Woodshop />} /> {/* Updated Route */}
          <Route path="/football/highschool" element={<HSFootball />} /> {/* Updated Route */}
          <Route path="/football/ncaa" element={<NCAAFootball />} /> {/* Updated Route */}
          <Route path="/football/nfl" element={<NFLFootball />} /> {/* Updated Route */}
          <Route path="/football" element={<Workouts />} /> {/* Updated Route */}
          <Route path="/" element={<Home />} /> {/* Updated Route */}
        </Routes>
      </div>
    </Router>
  );
}