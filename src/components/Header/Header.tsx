import React, { useState, useEffect } from 'react';
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as HTMLElement).closest('.nav')) {
        closeMobileMenu();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="header">
      <div className="logo">Logo</div>
      <button className="nav-toggle" onClick={toggleMobileMenu}>
        ☰
      </button>
      <nav className={`nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-close" onClick={closeMobileMenu}>
          ✕
        </div>
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