import React from "react";
import './footer.css'
import {PhoneOutlined,AmazonOutlined, MailOutlined, BookOutlined} from '@ant-design/icons'

export default function Footer() {
  return (
    <div class="footer">
      <a
        className={"col-33"}
        href={
          "https://www.icloud.com/iclouddrive/0yVxU-Y1wdWi5k8dSWDVcGH-A#Roderick_Tomlin_IT_Resume-2020"
        }
      >
        <div className={'footer-btn'}>
          <BookOutlined /> R&eacute;sum&eacute;
        </div>
      </a>
      <a className={"col-33"} href={"tel:559-574-1056"}>
        <div className={'footer-btn'}>      <PhoneOutlined /> Contact

        </div>
      </a>
      <a className={"col-33"} href={"mailto:rtomlin62@gmail.com"}>
        <div className={'footer-btn'}>      <MailOutlined /> Email

        </div>
      </a>
      <p className={"col-50"}>
        <div className={'footer-btn'}>
      <AmazonOutlined /> Built On AWS Amplify
        </div>
      </p>
      <p className={"col-50"}>
        <div className={'footer-btn'}>
      Built Using ReactJS
        </div>
      </p>
    </div>
  );
}
