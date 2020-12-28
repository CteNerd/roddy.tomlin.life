import React from "react";
import "./page-header.css";

export default function PageHeader(props) {
  return (
    <div className={"page-header"}>
      <h1>{props.pageTitle}</h1>
      <p>{props.pageDescription}</p>
    </div>
  );
}
