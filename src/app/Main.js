import React from "react";
import Home from "./home/home";
import About from "./about/about";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./Main.css";
import Workouts from "./workouts/workouts";
import Woodshop from "./woodshop/woodshop";
import PlyoBox from "./woodshop/plyobox";

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
          <Route path="/woodshop/plyobox">
            <PlyoBox />
          </Route>
          <Route path="/woodshop">
            <Woodshop />
          </Route>
          <Route path="/workouts">
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
