import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { asset } from '../../assets/asset';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-3 md:py-4">
        <div className="flex justify-between items-center">
          {/* Logo dan Judul */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={asset.Logo_blitar} 
              alt="Logo Kota Blitar" 
              className="h-8 sm:h-9 md:h-[42px] lg:h-[46px] xl:h-14 ml-0 sm:ml-2 md:ml-4 lg:ml-8 xl:ml-9 transition-all duration-300" 
            />
          </Link>

          {/* Tombol Hamburger untuk Mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Menu Navigasi Desktop */}
          <div className="hidden md:flex items-center md:space-x-4 lg:space-x-6 xl:space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium text-sm md:text-base relative group transition-all duration-300 ease-in-out">
              <span className="relative z-10">BERANDA</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
            </Link>
            <Link to="/buat-akun" className="text-gray-700 hover:text-blue-600 font-medium text-sm md:text-base relative group transition-all duration-300 ease-in-out">
              <span className="relative z-10">PENDAFTARAN</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
            </Link>
            <Link to="/pengumuman" className="text-gray-700 hover:text-blue-600 font-medium text-sm md:text-base relative group transition-all duration-300 ease-in-out">
              <span className="relative z-10">PENGUMUMAN</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
            </Link>
            <Link to="/GrafikHome" className="text-gray-700 hover:text-blue-600 font-medium text-sm md:text-base relative group transition-all duration-300 ease-in-out">
              <span className="relative z-10">GRAFIK</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
            </Link>
            <Link to="/informasi" className="text-gray-700 hover:text-blue-600 font-medium text-sm md:text-base relative group transition-all duration-300 ease-in-out">
              <span className="relative z-10">INFORMASI</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
            </Link>
            <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium text-sm md:text-base relative group transition-all duration-300 ease-in-out">
              <span className="relative z-10">LOGIN</span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
            </Link>
          </div>
        </div>

        {/* Menu Mobile */}
        <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} pt-4`}>
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleMenu}
            >
              BERANDA
            </Link>
            <Link 
              to="/buat-akun" 
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleMenu}
            >
              BUAT AKUN
            </Link>
            <Link 
              to="/pengumuman" 
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleMenu}
            >
              PENGUMUMAN
            </Link>
            <Link 
              to="/GrafikHome" 
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleMenu}
            >
              GRAFIK
            </Link>
            <Link 
              to="/informasi" 
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleMenu}
            >
              INFORMASI
            </Link>
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-all duration-300"
              onClick={toggleMenu}
            >
              LOGIN
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;