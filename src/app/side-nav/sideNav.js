import React, { useState } from "react";
import {
  CaretDownOutlined,
  HomeOutlined,
  GithubOutlined,
  SmileOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  InstagramOutlined,
  FacebookOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import "./sideNav.css";

export default function SideNav() {
  const [showBallDropdown, setShowBallDropdown] = useState(false);
  const [showHobbiesDropdown, setShowHobbiesDropdown] = useState(false);
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);

  /* Set the width of the side navigation to 0 */
  function closeNav() {
    if (document.getElementById("mySidenav"))
      document.getElementById("mySidenav").style.width = "0";
    document.body.style.backgroundColor = "white";
  }

  return (
    <div id="mySidenav" class="sidenav">
      <a href="javascript:void(0)" class="closebtn" onClick={closeNav}>
        &times;
      </a>
      <a href="/">
        <HomeOutlined /> Home
      </a>
      <button
        onClick={() => setShowAboutDropdown(!showAboutDropdown)}
        class="dropdown-btn"
      >
        <SmileOutlined spin /> About
        <CaretDownOutlined className={"fa-caret-down"} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showAboutDropdown ? "block" : "none" }}
      >
        <a href="/about/childhood">Childhood</a>
        <a href="/about/college">College</a>
        <a href="/about/nfl">NFL</a>
        <a href="/about/wedding">The Big Day</a>
        <a href="/about/it">IT</a>
      </div>
      {/* <button
        onClick={() => setShowBallDropdown(!showBallDropdown)}
        class="dropdown-btn"
      >
        <TrophyOutlined /> Ball Is Life
        <CaretDownOutlined className={"fa-caret-down"} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showBallDropdown ? "block" : "none" }}
      >
        <a href="/football/highschool">High School</a>
        <a href="/football/ncaa">College</a>
        <a href="/football/nfl">Professional</a>
      </div> */}
      <button
        onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
        class="dropdown-btn"
      >
        <GithubOutlined /> Projects
        <CaretDownOutlined className={"fa-caret-down"} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showProjectsDropdown ? "block" : "none" }}
      >
        <a href="https://ttyltutors.com">TTYL</a>
        <a href="https://www.pearlrae.com">Pearl Rae</a>
        <a href="https://jimmyjamkalewraps.com">Jimmy Jam Kale Wrap</a>
        <a href="https://www.wewillcalltix.com">We'll Call Tix</a>
      </div>
      <button
        onClick={() => setShowHobbiesDropdown(!showHobbiesDropdown)}
        class="dropdown-btn"
      >
        <FieldTimeOutlined /> Hobbies
        <CaretDownOutlined className={"fa-caret-down"} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showHobbiesDropdown ? "block" : "none" }}
      >
        <a href="/hobbies/woodshop">Woodshop</a>
        <a href="/hobbies/workouts">Workouts</a>
        <a href="/hobbies/workouts/instructions">Workouts Instructional</a>
      </div>
      <button
        onClick={() => setShowSocialDropdown(!showSocialDropdown)}
        class="dropdown-btn"
      >
        <UsergroupAddOutlined /> Social
        <CaretDownOutlined className={"fa-caret-down"} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showSocialDropdown ? "block" : "none" }}
      >
        <a href="https://www.facebook.com/roddy.tomlin.3">
          <FacebookOutlined /> Facebook
        </a>
        <a href="https://www.linkedin.com/in/tutoringrod/">
          <LinkedinOutlined /> LinkedIn
        </a>
        <a href="https://twitter.com/rct_62">
          <TwitterOutlined /> Twitter
        </a>
        <a href="https://www.instagram.com/d.o.n._tomlin/">
          <InstagramOutlined /> Instagram
        </a>
      </div>
    </div>
  );
}
