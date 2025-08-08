import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaGoogle } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-xl font-bold mb-2">PPDB Kabupaten Blitar</h3>
            <p className="text-sm">Sawahan, Pojok, Kec. Garum,<br /> Kabupaten Blitar, Jawa Timur 66182</p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h4 className="text-lg font-semibold mb-2">Kontak</h4>
            <p className="text-sm">Email: dispendik@blitarkab.go.id</p>
            <p className="text-sm">Telepon: (0342) 800 608</p>
          </div>
          <div className="w-full md:w-1/3">
            <h4 className="text-lg font-semibold mb-2">Ikuti Kami</h4>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/dispendik.kabblitar/" className="text-white hover:text-blue-400"><FaFacebook size={24} /></a>
              <a href="https://www.instagram.com/dispendik.blitarkab/" className="text-white hover:text-blue-400"><FaInstagram  size={24} /></a>
              <a href="https://dispendik.blitarkab.go.id/" className="text-white hover:text-blue-400"><FaGoogle size={24} /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>Copyrights © 2019 DISKOMINFO KABUPATEN BLITAR</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;