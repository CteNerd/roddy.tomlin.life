import React, { useState } from "react";
import {CaretDownOutlined,InstagramOutlined,FacebookOutlined,LinkedinOutlined,TwitterOutlined} from '@ant-design/icons'
import "./sideNav.css";

export default function SideNav() {
    const [showBallDropdown, setShowBallDropdown] = useState(false);
    const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
    const [showSocialDropdown, setShowSocialDropdown] = useState(false);

  /* Set the width of the side navigation to 0 */
  function closeNav() {
    console.log("closed");
    if (document.getElementById("mySidenav"))
      document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
    document.body.style.backgroundColor = "white";
  }

  return (
    <div id="mySidenav" class="sidenav">
      <a href="javascript:void(0)" class="closebtn" onClick={closeNav}>
        &times;
      </a>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/photos">Photos</a>
      <button onClick={() => setShowBallDropdown(!showBallDropdown)} class="dropdown-btn">
        Ball Is Life
        <CaretDownOutlined className={'fa-caret-down'} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showBallDropdown ? "block" : "none" }}
      >
        <a href="#">High School</a>
        <a href="#">College</a>
        <a href="#">Professional</a>
      </div>
      <button onClick={() => setShowProjectsDropdown(!showProjectsDropdown)} class="dropdown-btn">
        Projects
        <CaretDownOutlined className={'fa-caret-down'} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showProjectsDropdown ? "block" : "none" }}
      >
        <a href="https://ttyltutors.com">TTYL</a>
        <a href="https://www.pearlrae.com">Pearl Rae</a>
        <a href="https://jimmyjamkalewraps.com">Jimmy Jam Kale Wrap</a>
        <a href="#">We'll Call Tix</a>
        <a href="#">We'll Call Consulting</a>
        <a href="#">Woodshop</a>
      </div>
      <button onClick={() => setShowSocialDropdown(!showSocialDropdown)} class="dropdown-btn">
        Social
        <CaretDownOutlined className={'fa-caret-down'} />
      </button>
      <div
        class="dropdown-container"
        style={{ display: showSocialDropdown ? "block" : "none" }}
      >
        <a href="https://www.facebook.com/roddy.tomlin.3"><FacebookOutlined /> Facebook</a>
        <a href="https://www.linkedin.com/in/tutoringrod/"><LinkedinOutlined /> LinkedIn</a>
        <a href="https://twitter.com/rct_62"><TwitterOutlined /> Twitter</a>
        <a href="https://www.instagram.com/d.o.n._tomlin/"><InstagramOutlined /> Instagram</a>
      </div>
    </div>
  );
}
