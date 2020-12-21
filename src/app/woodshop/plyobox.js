import React from "react";
import PageHeader from "../../shared-components/page-header/page-header";
import plyoboxFront from "./images/plyobox-front.jpeg";
import plyoboxAngle from "./images/plyobox-angle.jpeg";
import "./plyobox.css";

export default function PlyoBox() {
  return (
    <>
      <PageHeader
        pageTitle={"Plyometric Box"}
        pageDescription={
          'Below you will find instructions on how I built my 12" x 18" x 24" plyometrix box. If you would like to change the size of the box within the instructions, please complete all 3 boxes below and press update. Thank you.'
        }
      />
      <div>
        <img src={plyoboxFront} className={"instruction-img"} />
        <img src={plyoboxAngle} className={"instruction-img-2"} />
        <p className={"instruction-p"}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
          {<br/>}
          {<br/>}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
          {<br/>}
          {<br/>}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </div>
    </>
  );
}
