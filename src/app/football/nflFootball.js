import PageHeader from "../../shared-components/page-header/page-header";
import PlaceholderText from "../../shared-components/placeholder-text/placeholder-text";
import React from "react";

export default function NflFootball() {
  return (
    <>
      <PageHeader
        pageTitle={"NFL Football"}
        pageDescription={
          "Not For Long. You learn quick how to get up... or keep falling."
        }
      />
      <div className={"instruction-p"}>
        <PlaceholderText />
        <PlaceholderText />
      </div>
      ß
    </>
  );
}
