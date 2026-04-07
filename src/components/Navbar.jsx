import React from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import MangerIcon from './MangerIcon';

const Navbar = ({ currentUser, darkMode, setDarkMode, onLogout }) => {
  return (
    <nav className={`border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print backdrop-blur-md ${
      darkMode ? 'bg-[#0a1a0e]/90 border-[#1e3a2a]' : 'bg-[#fef5e8]/90 border-[#e0c9a8]'
    }`}>
      <div className="flex items-center gap-3">
        <MangerIcon size={28} className="drop-shadow-sm" />
        <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c41e3a] to-[#2d7a4e] text-xl tracking-tighter">
          TRACKER 2026
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full transition-colors ${
            darkMode ? 'hover:bg-[#1e3a2a] text-amber-300' : 'hover:bg-amber-50 text-amber-600'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={onLogout}
          className={`flex items-center gap-2 font-bold text-sm uppercase px-3 py-2 rounded-xl transition-all text-red-500 ${
            darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
          }`}
        >
          <span className="hidden sm:inline opacity-70 mr-1">{currentUser}</span>
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
