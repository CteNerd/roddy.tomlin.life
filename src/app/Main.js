import React from "react";
import Home from "./home/home";
import About from "./about/about";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./Main.css";
import Workouts from "./workouts/workouts";
import HSFootball from "./football/hsFootball";
import NCAAFootball from "./football/ncaaFootball";
import NFLFootball from "./football/nflFootball";
import Woodshop from "./woodshop/woodshop";
import PlyoBox from "./woodshop/plyobox";
import WorkoutInstructions from "./workouts/workouts-instructional";

export default function App() {
  return (
    <Router>
      <div className={"main-content"}>
        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/about">
            <About />
          </Route>
          <Route path="/hobbies/workouts/instructions">
            <WorkoutInstructions />
          </Route>
          <Route path="/hobbies/workouts">
            <Workouts />
          </Route>
          <Route path="/hobbies/woodshop/plyobox">
            <PlyoBox />
          </Route>
          <Route path="/hobbies/woodshop">
            <Woodshop />
          </Route>
          <Route path="/football/highschool">
            <HSFootball />
          </Route>
          <Route path="/football/ncaa">
            <NCAAFootball />
          </Route>
          <Route path="/football/nfl">
            <NFLFootball />
          </Route>
          <Route path="/football">
            <Workouts />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
