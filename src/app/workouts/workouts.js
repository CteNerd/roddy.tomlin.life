import React, { useEffect, useState } from "react";
import { httpGetRequest } from "../../httpClient/client";
import "./workouts.css";

export default function Workouts() {
  const moment = require("moment");
  const [youtubeVideos, setYoutubeVideos] = useState();

  useEffect(async () => {
    let responseVideo = {};
    let responseVideos = [];
    let response = await httpGetRequest({
      url:
        "https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCDDwVn1sr9_LIIyTLo0WfCy3kC6jIFY3w&part=id,contentDetails,snippet&playlistId=PL-6JZMCvkoY-i2UvP4kW7JJH2cQApm7MA",
    });
    console.log(response);

    response.items.forEach((item) => {
      if (item.kind === "youtube#playlistItem") {
        responseVideo = {
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          date: moment(item.contentDetails.videoPublishedAt).format("MMMM Do YYYY"),
        };
        responseVideos.push(responseVideo);
      }
    });
    setYoutubeVideos(responseVideos);
  }, []);

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Workouts",
      dataIndex: "link",
      key: "link",
    },
  ];

  function TableData() {
    let content = [];
    if (youtubeVideos) {
      youtubeVideos.forEach((data) => {
        content.push(
          <tr>
            <td>{data.title}</td>
            <td>{data.date}</td>
            <td>
              <iframe
                width="360"
                height="220"
                title={data.title}
                src={"https://www.youtube.com/embed/" + data.id}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </td>
          </tr>
        );
      });
    }
    return <>{content}</>;
  }

  function Columns() {
    let content = [];

    columns.forEach((column) => {
      content.push(<th>{column.title}</th>);
    });
    return <>{content}</>;
  }

  return (
    <>
      <h1>Workouts</h1>
      <p>
        The following videos are workouts I do from day to day. Feel free to
        contact me for tips on new workouts, suggestions, or if you are looking
        for advice. Thanks for stopping by.
      </p>
      <p>
        If you need instructions on any of the exercises done in the workouts,
        please find instructional videos,{" "}
        <a href={"/hobbies/workouts/instructions"}>here</a>
      </p>
      <p className={"disclaimer"}>
        This website and video content is for informational purposes only and is
        not intended to offer medical advice, or replace the recommendations of
        your Doctor, Midwife, Physical Therapist or Medical Practitioner. Always
        consult with your Doctor before beginning any exercise program. We will not
        be held responsible in anyway for circumstances, conditions or injuries
        that result directly or indirectly from information provided.
      </p>
      <table className={"tt"}>
        <tr>
          <Columns />
        </tr>
        <TableData />
      </table>
    </>
  );
}
