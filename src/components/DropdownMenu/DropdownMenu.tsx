import React, { useState } from 'react';
import './DropdownMenu.css';

interface HeaderProps {
  menu: {
    title: string;
    items: {
      title: string;
      link: string;
    }[];
  };
}
  
  const DropdownMenu: React.FC<HeaderProps> = ({ menu }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        {menu.title}
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {menu.items.map((item, index) => (
            <li key={index} className="dropdown-item">
              <a href={item.link}><button>{item.title}</button></a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DropdownMenu;