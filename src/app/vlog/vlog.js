import React, { useEffect, useState } from "react";
import PageHeader from "../../shared-components/page-header/page-header";
import Banner from "../../images/banner-img.png";
import { httpGetRequest } from "../../httpClient/client";

export default function Vlog() {
  const [youtubeVideos, setYoutubeVideos] = useState();

  useEffect(async () => {
    let responseVideo = {};
    let responseVideos = [];
    let response = await httpGetRequest({
      url:
        "https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCDDwVn1sr9_LIIyTLo0WfCy3kC6jIFY3w&part=id,contentDetails,snippet&playlistId=PL-6JZMCvkoY-bhmjRmgClmwJ2kxXF-R1C&maxResults=50",
    });

    response.items.forEach((item) => {
      if (item.kind === "youtube#playlistItem") {
        responseVideo = {
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
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
      title: "Video",
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
        pageDescription={
          "Welcome to 62, What it do? Not just a channel for dads, but for guys. Rather the topic is workouts, fatherhood, or  building your first website, I am here to talk about it. Through my experiences as an NFL player or software engineer, I hope it enlightens all that listen. I appreciate you swinging by, and if you would like to find out more about me, feel free to drop me a message."
        }
      />
      <table className={"tt"}>
        <tr>
          <Columns />
        </tr>
        <TableData />
      </table>
    </>
  );
}
