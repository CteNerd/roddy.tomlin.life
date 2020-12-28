import React from "react";
import "./card.css";

export default function Card(props) {
  return (
    <div className="card">
      <a href={props.url}>
        <img src={props.src} className={"card-img"} />
        <h3>{props.title}</h3>
        <p>{props.description}</p>
      </a>
    </div>
  );
}
