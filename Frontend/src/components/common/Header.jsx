import { FaFacebook, FaTwitter, FaGoogle, FaEnvelope, FaPhone, FaInstagram } from 'react-icons/fa';
import React from 'react';

const Header = () => {
  return (
    <div className="bg-gray-100 py-2">
      <div className="container mx-auto px-4 flex justify-between items-center text-sm">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <FaEnvelope className="text-blue-600 mr-2" />
            <span className="mr-2">Email:</span>
            <a href="mailto:dispendik@blitarkab.go.id" className="text-blue-600 hover:text-blue-800">
              dispendik@blitarkab.go.id
            </a>
          </span>
          <span className="flex items-center">
            <FaPhone className="text-blue-600 mr-2" />
            <span className="mr-2">Telepon:</span>
            <a href="tel:(0342) 800 608" className="text-blue-600 hover:text-blue-800">
              (0342) 800 608
            </a>
          </span>
        </div>
        <div className="flex space-x-4">
          <a href="https://www.facebook.com/dispendikkabblitar/" className="text-blue-600 hover:text-blue-800">
            <FaFacebook size={20} />
          </a>
          <a href="https://www.instagram.com/dispendik.blitarkab/" className="text-pink-600 hover:text-pink-800">
            <FaInstagram size={20} />
          </a>
          <a href="https://dispendik.blitarkab.go.id/" className="text-red-500 hover:text-red-700">
            <FaGoogle size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;