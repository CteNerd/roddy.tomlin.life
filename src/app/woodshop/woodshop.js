import React from "react";
import Card from "../../shared-components/card/card";
import plyoboxFront from "./images/plyoboxFront.jpeg";
import "./woodshop.css";

export default function Woodshop() {
  return (
    <>
      <h1>Woodshop</h1>
      <p>
        Below are a few projects I have done in my spare time. Click on an item
        for instructions. Feel free to contact me as I am willing to learn from
        tips.
      </p>
      <div className={"row"}>
        <div className={"column"}>
          <Card
            src={plyoboxFront}
            url={"/woodshop/plyobox"}
            title={"Plyo Box"}
            description={
              "This one is 12 x 18 x 24. Learn to make yours here!!!"
            }
          />
        </div>
      </div>
    </>
  );
}
