import React from 'react';
import { Navbar, Typography, IconButton } from "@material-tailwind/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import { Link } from 'react-router-dom';
import { asset } from '../../../assets/asset';
import LogoutButton from '../LogoutButton';

const UserHeader = ({ isOpen, toggleSidebar }) => {
  return (
    <Navbar className="mx-auto max-w-full px-2 sm:px-3 py-1 sm:py-2 rounded-none">
      <div className="relative flex items-center justify-between w-full">
        {/* Tombol Sidebar Mobile (Kiri) */}
        <div className="md:hidden">
          <IconButton
            variant="text"
            color="blue-gray"
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            {isOpen ? (
              <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Bars3Icon className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </IconButton>
        </div>

        {/* Logo (Center di Mobile) */}
        <div className="absolute left-1/2 -translate-x-1/2 md:static md:left-0 md:transform-none md:flex md:items-center">
          <Link to="/user" className="flex items-center space-x-1 sm:space-x-2">
            <img  
              src={asset.Logo_blitar} 
              alt="Logo Kota Blitar" 
              className="h-6 sm:h-7 md:h-[28px] lg:h-[32px] xl:h-10 ml-0 sm:ml-2 md:ml-3 lg:ml-6 xl:ml-8 transition-all duration-300"
            />
          </Link>
          
          {/* Tombol Sidebar Desktop */}
          <div className="hidden md:block ml-2">
            <IconButton
              variant="text"
              color="blue-gray"
              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-gray-100"
              onClick={toggleSidebar}
            >
              {isOpen ? (
                <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Bars3Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </IconButton>
          </div>
        </div>

        {/* Tombol Logout */}
        <div className="flex items-center -mr-2 md:mr-0">
          <LogoutButton />
        </div>
      </div>
    </Navbar>
  );
};

export default UserHeader;
