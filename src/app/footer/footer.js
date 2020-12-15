import React from "react";
import {PhoneOutlined,AmazonOutlined, MailOutlined, BookOutlined} from '@ant-design/icons'

export default function Footer() {
  let resume = "&‌eacute;";

  return (
    <div class="footer">
      <a
        className={"col-33"}
        href={
          "https://www.icloud.com/iclouddrive/0yVxU-Y1wdWi5k8dSWDVcGH-A#Roderick_Tomlin_IT_Resume-2020"
        }
      >
        <BookOutlined /> R&eacute;sum&eacute;
      </a>
      <a className={"col-33"} href={"tel:559-574-1056"}>
      <PhoneOutlined /> Contact
      </a>
      <a className={"col-33"} href={"mailto:rtomlin62@gmail.com"}>
      <MailOutlined /> Email
      </a>
      <p className={"col-33"}>
      <AmazonOutlined /> Built On AWS Amplify
      </p>
    </div>
  );
}
