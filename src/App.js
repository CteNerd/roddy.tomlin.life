import "./App.css";
import Footer from "./app/footer/footer";
import SideNav from "./app/side-nav/sideNav";
import Main from "./app/Main.js";
import BannerImg from "./assets/images/roddy_tomlin_life_banner.png"
import Workouts from "./app/workouts/workouts.js";
import HSFootball from "./app/football/hsFootball";
import NCAAFootball from "./app/football/ncaaFootball";
import NFLFootball from "./app/football/nflFootball";
import Woodshop from "./app/woodshop/woodshop";
import Vlog from "./app/vlog/vlog";
import PlyoBox from "./app/woodshop/plyobox";
import WorkoutInstructions from "./app/workouts/workouts-instructional";
import Childhood from "./app/about/childhood";
import College from "./app/about/college";
import Nfl from "./app/about/nfl";
import IT from "./app/about/it";
import Wedding from "./app/about/wedding";
import Home from "./app/home/home";
import About from "./app/about/about";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Updated import
import './styles/global.css'

function App() {
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

export default App;
