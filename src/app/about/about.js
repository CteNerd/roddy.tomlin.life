import "./about.css";
import React from "react";
import PageHeader from "../../shared-components/page-header/page-header";

export default function About() {
  return (
    <>
      <PageHeader
        pageTitle={"About Roddy"}
        pageDescription={
          "Below are short snippets of parts of my life. Click on read more if you care to get a little more detail."
        }
      />

      <div className={"about-row"}>
        <div className={"column"}>
          <div className="card">
            <h3>{"Childhood"}</h3>
            <p>
              Born in Mississippi, I've never had the feeling like I was born
              and bred in The South. That could be due to the fact of being
              relocated to San Diego before I had a chance to take in the
              scenery but that was out of my control.
            </p>
            <p className="read-more">
              <button className="button">
                <a href={"/about/childhood"}>Read More</a>
              </button>
            </p>
          </div>
        </div>

        <div className={"column"}>
          <div className="card">
            <h3>{"College"}</h3>
            <p>
              College is supposed to be fun and interesting, if you know where
              you're going. For me, I thought there were only two options:
              Academic Scholarship and pay the rest at Rhodes University or same
              thing and play football at Bethel College
            </p>
            <p className="read-more">
              <button className="button">
                <a href={"/about/college"}>Read More</a>
              </button>
            </p>
          </div>
        </div>
        <div className={"column"}>
          <div className="card">
            <h3>{"NFL"}</h3>
            <p>
              Life started to calm down being in the NFL. I was doing something
              few had done before and the attention was all on me. What could go
              wrong? Something, like always. I learned quickly of the level of
              talent in the NFL.
            </p>
            <p className="read-more">
              <button className="button">
                <a href={"/about/nfl"}>Read More</a>
              </button>
            </p>
          </div>
        </div>
        <div className={"column"}>
          <div className="card">
            <h3>{"The Big Day"}</h3>
            <p>
              The storm of life had came and gone, now the only thing that
              mattered was taking care of the one I loved. Making sure
              everything was perfect and the way she wanted while at the same
              time having a good time.
            </p>
            <p className="read-more">
              <button className="button">
                <a href={"/about/wedding"}>Read More</a>
              </button>
            </p>
          </div>
        </div>
        <div className={"column"}>
          <div className="card">
            <h3>{"IT"}</h3>
            <p>
              Getting here was tough, but I had learned plenty along the way. I
              left two different loves of my life in order to reset and find me.
              While living in Alabama I ventured down the path of coaching
              briefly, I wasn't ready.
            </p>
            <p className="read-more">
              <button className="button">
                <a href={"/about/it"}>Read More</a>
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
