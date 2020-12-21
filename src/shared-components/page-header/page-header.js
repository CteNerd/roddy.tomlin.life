import React from "react";

export default function PageHeader(props) {
  return (
    <>
      <h1>{props.pageTitle}</h1>
      <p>{props.pageDescription}</p>
    </>
  );
}
