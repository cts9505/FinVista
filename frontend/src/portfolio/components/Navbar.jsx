import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/stocks', label: 'Stocks' },
    { path: '/gold', label: 'Gold' },
    { path: '/mutual-funds', label: 'Mutual Funds' },
    { path: '/real-estate', label: 'Real Estate' },
    { path: '/fixed-deposits', label: 'Fixed Deposits' },
    { path: '/ppf', label: 'PPF' },
    { path: '/crypto', label: 'Crypto' },
  ];

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Portfolio Manager</h1>
        <div className="space-x-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'text-yellow-300 font-semibold' : 'hover:text-yellow-200'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;