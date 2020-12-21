import PageHeader from "../../shared-components/page-header/page-header";
import PlaceholderText from "../../shared-components/placeholder-text/placeholder-text";
import React from "react";

export default function NcaaFootball() {
  return (
    <>
      <PageHeader
        pageTitle={"NCAA Football"}
        pageDescription={"Balancing Act Not Many Want"}
      />
      <div className={"instruction-p"}>
        <PlaceholderText />
        <PlaceholderText />
      </div>
    </>
  );
}
