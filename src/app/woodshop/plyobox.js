import React, { useState } from "react";
import PageHeader from "../../shared-components/page-header/page-header";
import plyoboxFront from "./images/plyoboxFront.png";
import plyoboxAngle from "./images/plyoboxAngle.png";
import "./plyobox.css";
import PlaceholderText from "../../shared-components/placeholder-text/placeholder-text";

export default function PlyoBox() {
  const [measurementOne, setMeasurementOne] = useState(12);
  const [measurementTwo, setMeasurementTwo] = useState(18);
  const [measurementThree, setMeasurementThree] = useState(24);

  function handleMeasurementOneChange(e) {
    if (e.target.value) setMeasurementOne(e.target.value);
  }

  function handleMeasurementTwoChange(e) {
    if (e.target.value) setMeasurementTwo(e.target.value);
  }

  function handleMeasurementThreeChange(e) {
    if (e.target.value) setMeasurementThree(e.target.value);
  }

  return (
    <>
      <PageHeader
        pageTitle={"Plyometric Box"}
        pageDescription={
          'Below you will find instructions on how I built my 12" x 18" x 24" plyometrix box. If you would like to change the size of the box within the instructions, please change the measurements in the 3 boxes below and the instructions will update. Thank you.'
        }
      />
      <div className={'plyobox-custom-measurements'}>
            <label className={'column-100'}>Measurements</label>
          <div className={"column-33"}>
            <input
              onChange={handleMeasurementOneChange}
              min={1}
              max={100}
              placeholder={"12"}
              type={"number"}
            />
          </div>
          <div className={"column-33"}>
            <input
              onChange={handleMeasurementTwoChange}
              min={1}
              max={100}
              placeholder={"18"}
              type={"number"}
            />
          </div>
          <div className={"column-33"}>
            <input
              onChange={handleMeasurementThreeChange}
              min={1}
              max={100}
              placeholder={"24"}
              type={"number"}
            />
          </div>
      </div>
      <div>
        <img src={plyoboxFront} className={"instruction-img"} />
        <img src={plyoboxAngle} className={"instruction-img-2"} />
        <div className={"instruction-p"}>
          <p>
            To get started you will need to get the following supplies from your
            local hardware store. If your local hardware store is kind enough to
            cut your plywood, or whatever type of wood you choose, I highly
            recommend getting those clean cuts done by the professionals unless you are
            fortunate enough to have access to a table or circular saw.
          </p>
          <p>
            AND don't forget. MEASURE TWICE, CUT ONCE!!!
          </p>
          <h5>Materials</h5>
          <ul>
            2 cuts of each in your choice of wood
            <li>
              Side: {measurementOne}" x {measurementTwo}"
            </li>
            <li>
              Base: {measurementTwo}" x {measurementThree}"
            </li>
            <li>
              Side: {measurementThree}" x {measurementOne}"
            </li>
            <br />
            And for framing
            <li>3 - 2" x 2" x 10'</li>
            <li>30 - #8 x 1.75" wood screws</li>
            <li>Sander of choice</li>
            <li>Sand paper</li>
            <li>Drill</li>
            <li>Drill bits</li>
            <li>Drill Phillips Screw Head attachment</li>
          </ul>
          <PlaceholderText />
        </div>
      </div>
    </>
  );
}
