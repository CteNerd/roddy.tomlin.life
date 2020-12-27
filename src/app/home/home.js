import React from "react";
import FamilyPhoto from "./family-photo.png";
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
        <div className={"intro-img-container"}>
          <img className={"intro-img"} src={FamilyPhoto} />
        </div>
        <p>
          In layman's terms, I am simply grateful and blessed to be where I am;
          but I'll rest when I'm dead.
        </p>
        <p>
          Throughout life I have been blessed to meet people that are in
          different places within this race we call life. Listening to the words
          of these people has opened my eyes to views I didn't think of prior to
          the occassion. Rather it be learning from a rookie or the vet on
          his/her way to be enshrined, I believe wisdom can come from anyone at
          anytime.
        </p>
        <p>
          Here, you will find the projects that I am grateful to have the
          opportunities to work on, a little background on myself, background on
          my path to the NFL, and a few hobbies I have been keeping myself busy
          with.
        </p>
        <p>
          If you would like to reach out to me about anything, feel free to
          contact me via call, text, or email using the contact information
          below. Also, take your own copy of my r&eacute;sum&eacute; which can
          also be found below.
        </p>
      </div>
    </div>
  );
}
