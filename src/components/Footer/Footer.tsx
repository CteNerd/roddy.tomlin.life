import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <a href="/resume.pdf" className="link">Résumé</a>
      <a href="mailto:roddy@example.com" className="link">Contact</a>
      <p className="built">Built Using ReactJS</p>
    </footer>
  );
};

export default Footer;
