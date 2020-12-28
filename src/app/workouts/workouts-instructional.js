import React, { useEffect, useState } from "react";
import PageHeader from "../../shared-components/page-header/page-header";
import { httpGetRequest } from "../../httpClient/client";
import "./workouts.css";

export default function WorkoutInstructions() {
  const moment = require("moment");
  const [youtubeVideos, setYoutubeVideos] = useState();

  useEffect(async () => {
    let responseVideo = {};
    let responseVideos = [];
    let response = await httpGetRequest({
      url:
        "https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCDDwVn1sr9_LIIyTLo0WfCy3kC6jIFY3w&part=id,contentDetails,snippet&playlistId=PL-6JZMCvkoY-Uivi7OwyFkKZ6skPGgj8p&maxResults=50",
    });

    response.items.forEach((item) => {
      if (item.kind === "youtube#playlistItem") {
        responseVideo = {
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          date: moment(item.contentDetails.videoPublishedAt).format(
            "MMMM Do YYYY"
          ),
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
      title: "Instructional",
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
      <PageHeader
        pageTitle={"Workout Instructionals"}
        pageDescription={
          "Thank you for coming by to hang with us. Below you will find instructional videos that will assist you in understanding the technique used during the workouts. If you have any questions or concerns, please feel free to reach out."
        }
      />
      <p className={"disclaimer"}>
        This website and video content is for informational purposes only and is
        not intended to offer medical advice, or replace the recommendations of
        your Doctor, Midwife, Physical Therapist or Medical Practitioner. Always
        consult your Doctor before beginning any exercise program. We will not
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
