import React from "react";
import PlaceholderText from "../../shared-components/placeholder-text/placeholder-text";
import PageHeader from "../../shared-components/page-header/page-header";
import "./home.css";

export default function Home() {
  return (
    <div className={"home-css"}>
      <PageHeader
        pageTitle={"Roderick C Tomlin II"}
        pageDescription={
          <p>The story, life, and r&eacute;sum&eacute; of Roddy Tomlin</p>
        }
      />
      <div className={"instruction-p"}>
        <PlaceholderText />
        <PlaceholderText />
        <PlaceholderText />
      </div>
    </div>
  );
}
