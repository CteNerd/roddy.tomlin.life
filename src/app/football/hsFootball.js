import PageHeader from "../../shared-components/page-header/page-header";
import PlaceholderText from "../../shared-components/placeholder-text/placeholder-text";
import React from "react";

export default function HsFootball() {
  return (
    <>
      <PageHeader
        pageTitle={"High School Football"}
        pageDescription={"Roots like a tree trunk they said."}
      />
      <div className={"instruction-p"}>
        <PlaceholderText />
        <PlaceholderText />
      </div>
    </>
  );
}
