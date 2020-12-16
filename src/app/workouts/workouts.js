import { Table } from "antd";
import React from "react";
import "./workouts.css";

export default function Workouts() {
  const dataSource = [
    {
      key: "1",
      title: "12 Workouts Of Christmas",
      date: "December 16, 2020",
      link: "https://youtu.be/_LWT8boHh0E",
    },
  ];

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
      title: "Video Url",
      dataIndex: "link",
      key: "link",
    },
  ];

  function TableData() {
    let content = [];

    dataSource.forEach((data) => {
      content.push(
        <tr>
          <td>{data.title}</td>
          <td>{data.date}</td>
          <td>
            <a href={data.link}>
              <button type={"submit"}>WATCH</button>
            </a>
          </td>
        </tr>
      );
    });
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
      <table className={"tt"}>
        <tr>
          <Columns />
        </tr>
        <TableData />
      </table>
    </>
  );
}
