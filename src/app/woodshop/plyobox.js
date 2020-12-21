import React from "react";
import PageHeader from "../../shared-components/page-header/page-header";
import plyoboxFront from "./images/plyoboxFront.png";
import plyoboxAngle from "./images/plyoboxAngle.png";
import "./plyobox.css";
import PlaceholderText from "../../shared-components/placeholder-text/placeholder-text";

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
        <div className={'instruction-p'}>
          <PlaceholderText />
        </div>
      </div>
    </>
  );
}
