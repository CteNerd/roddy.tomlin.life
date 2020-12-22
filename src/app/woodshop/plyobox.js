import React, { useState } from "react";
import PageHeader from "../../shared-components/page-header/page-header";
import plyoboxFront from "./images/plyoboxFront.png";
import plyoboxAngle from "./images/plyoboxAngle.png";
import "./plyobox.css";

export default function PlyoBox() {
  const [measurementOne, setMeasurementOne] = useState(12);
  const [measurementTwo, setMeasurementTwo] = useState(18);
  const [measurementThree, setMeasurementThree] = useState(24);
  const [woodThickness, setWoodThickness] = useState(0.75);
  const [measurementTwoCut, setMeasurementTwoCut] = useState(
    18 - 2 * woodThickness
  );
  const [measurementThreeCut, setMeasurementThreeCut] = useState(
    24 - 2 * woodThickness
  );

  function handleUpdateClick() {
    setMeasurementTwoCut(measurementTwo - 2 * woodThickness);
    setMeasurementThreeCut(measurementThree - 2 * woodThickness);
  }

  return (
    <>
      <PageHeader
        pageTitle={"Plyometric Box"}
        pageDescription={
          'Below you will find instructions on how I built my 12" x 18" x 24" plyometrix box. If you would like to change the size of the box within the instructions, please change the measurements in the 3 boxes below and the instructions will update. Thank you.'
        }
      />
      <div className={"plyobox-custom-measurements"}>
        <label className={"column-100"}>Measurements</label>
        <form
          action={"#"}
          onSubmit={() => {
            handleUpdateClick();
            return false;
          }}
        >
          <div className={"column-25"}>
            <label>Side 1</label>
            <input
              required
              onChange={(e) => setMeasurementOne(e.target.value)}
              min={1}
              max={100}
              defaultValue={12}
              placeholder={"12"}
              type={"number"}
            />
          </div>
          <div className={"column-25"}>
            <label>Side 2</label>
            <input
              required
              onChange={(e) => setMeasurementTwo(e.target.value)}
              min={1}
              max={100}
              placeholder={"18"}
              defaultValue={18}
              type={"number"}
            />
          </div>
          <div className={"column-25"}>
            <label>Side 3</label>
            <input
              required
              onChange={(e) => setMeasurementThree(e.target.value)}
              min={1}
              max={100}
              defaultValue={24}
              placeholder={"24"}
              type={"number"}
            />
          </div>
          <div className={"column-25"}>
            <label>Wood Thickness</label>
            <input
              required
              onChange={(e) => setWoodThickness(e.target.value)}
              min={0.0}
              max={0.75}
              defaultValue={0.75}
              placeholder={0.75}
              step={0.125}
              type={"number"}
            />
          </div>
          <div className={"column-100"}>
            <button type={"submit"}>Update</button>
          </div>
        </form>
      </div>
      <div>
        <img src={plyoboxFront} className={"instruction-img"} />
        <img src={plyoboxAngle} className={"instruction-img-2"} />
        <div className={"instruction-p"}>
          <p>
            To get started you will need to get the following supplies from your
            local hardware store. If your local hardware store is kind enough to
            cut your plywood, or whatever type of wood you choose, I highly
            recommend getting those clean cuts done by the professionals unless
            you are fortunate enough to have access to a table or circular saw.
          </p>
          <p>
            Fun Fact: This 12" x 18" x 24" box can be made twice from your
            normal 4' x 8' plywood.
          </p>
          <p>And don't forget. MEASURE TWICE, CUT ONCE!!!</p>
          <h4>Materials:</h4>
          <table>
            <tr>
              <td>Cut Name</td>
              <td>Quantity</td>
              <td>Cut</td>
            </tr>
            <tr>
              <td>Side Without Framework</td>
              <td>2</td>
              <td>
                {measurementOne}" x {measurementTwo}"
              </td>
            </tr>
            <tr>
              <td>Base</td>
              <td>2</td>
              <td>
                {measurementTwoCut}" x {measurementThreeCut}"
              </td>
            </tr>
            <tr>
              <td>Side With Framework</td>
              <td>2</td>
              <td>
                {measurementThreeCut}" x {measurementOne}"
              </td>
            </tr>
          </table>
          <h4>And for framing:</h4>
          <table>
            <tr>
              <td>Item</td>
              <td>Quantity</td>
              <td>Note</td>
            </tr>
            <tr>
              <td>2" x 2" x 10' wood beams</td>
              <td>3</td>
              <td>These will be cut to frame the inside of the box.</td>
            </tr>
            <tr>
              <td>#8 x 1.75" wood screws</td>
              <td>30</td>
              <td></td>
            </tr>
            <tr>
              <td>Sander</td>
              <td>1</td>
              <td></td>
            </tr>
            <tr>
              <td>Sand paper</td>
              <td>2</td>
              <td>1 for chunks and 1 for smoothing</td>
            </tr>
            <tr>
              <td>Drill</td>
              <td>1</td>
              <td></td>
            </tr>
            <tr>
              <td>Drill bits</td>
              <td>1</td>
              <td>I used &#8539; drill bit</td>
            </tr>
            <tr>
              <td>Phillips Screw Head</td>
              <td>1</td>
              <td>I prefer drill attachment, but manual is cool to.</td>
            </tr>
          </table>
          <h4>Instructions:</h4>
          <h5>Step 1:</h5>
          <p>
            Assuming the plywood is cut and ready to go, we will begin with
            cutting the wood beams. We will need the following cuts in order to
            frame the inside of the box. This is pivotal, think of this as the
            support beams within your home.
          </p>
          <table style={{ float: "left", padding: "5px" }}>
            <tr>
              <td>Cut</td>
              <td>Quantity</td>
              <td>Note</td>
            </tr>
            <tr>
              <td>{measurementTwoCut}"</td>
              <td>4</td>
              <td>For Side A of the Base</td>
            </tr>
            <tr>
              <td>{measurementThreeCut - 3}"</td>
              <td>4</td>
              <td>For Side B of the Base.</td>
            </tr>
            <tr>
              <td>{measurementOne - 4.5}"</td>
              <td>4</td>
              <td>For {measurementOne}" side of Sides with Framework</td>
            </tr>
          </table>
          <p>
            <strong>Note for Cut #2:</strong> My wood beams happened to be 1.5"
            thick rather than the expected 2". This altered the cuts for Side B
            can see in the table they are cut 3" shorter, double 1.5", rather
            than 4".
          </p>
          <p>
            <strong>Note for Cut #3:</strong> This cut is for connecting the two
            bases. It is cut 4.5" shorter for the following reasons. First, to
            account for the 1.5" of the wood beams (3"). Second, the remaining
            1.5" is from the thickness of the wood on each side.
          </p>
          <h5>Step 2:</h5>
          <p>
            After you have made your cuts from the wood beams, lay the framework
            on the base and the side with framework to ensure the cuts are as
            expected. If the framework needs any cleaning up, now is the time to
            fix it. If all looks good, glue the framework to the base using wood
            glue and allow to sit for the instructed time.
          </p>
          <h5>Step 3:</h5>
          <p>
            While the base is drying to the framework, begin working on the
            sides with framework. Find the middle of the beam cut and align with
            the middle of the sides with framework. There should be
            approximately 2.25" of space on each side of the wood beam cut
            depending on the thickness of your plywood and wood beams. If this
            looks good, glue as well with centers aligned.
          </p>
          <h5>Step 4:</h5>
          <p>
            After glue has dried, flip over framed sides and drill holes every
            6". If you choose to skip this step and go straight to drilling
            screws that is fine, I prefer to pre-drill a small hole where I plan
            to place screws. Once completed the framework should be secure to
            the plywood sides.
          </p>
          <h5>Step 5:</h5>
          <p>
            Now that the framework is in place, begin by place the base on the
            ground and match a side with framework to a side on the base with
            the same length. The framework from the side piece should sit on the
            base framework and allow for the plywood siding to be flush with the
            plywood siding of the base. If this looks correct, connect the sides
            in the corner. Continue to opposite side.
          </p>
          <h5>Step 6:</h5>
          <p>
            The remaining two sides should not have framework and this is
            intentional, they will screw into the the sides with framework and
            the base. Ensure the corners are 90&#176; prior to screwing or
            drilling. To assist with clean corners, you can place the second
            base in place while screwing the sides.
          </p>
          <h5>Step 7:</h5>
          <p>
            With all the sides and one base in place, lay the box on the base
            side with the open side facing up. Using a mallot (and maybe a
            flathead screwdriver), tap the edges of the remaining base into the
            open side. This should be a snug, or even tight, fit. Once tapped
            into place, drill and screw into place. The box is ready to go.
          </p>
          <p>
            For finishing touches, I highly recommend sanding rough edges and
            corners.
          </p>
        </div>
      </div>
    </>
  );
}
