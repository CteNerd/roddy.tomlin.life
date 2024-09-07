import React, { useState } from 'react';
import './Header.css';
import DropdownMenu from '../DropdownMenu/DropdownMenu';

interface HeaderProps {
  menus: {
    title: string;
    items: string[];
  }[];
}

const Header: React.FC<HeaderProps> = ({ menus }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="logo">Logo</div>
      <button className="nav-toggle" onClick={toggleMobileMenu}>
        ☰
      </button>
      <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <ul className="nav-list">
          {menus.map((menu, index) => (
            <li key={index}>
              <DropdownMenu menu={menu} />
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;