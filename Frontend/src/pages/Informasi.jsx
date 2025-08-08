import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { asset } from '../assets/asset';
import { FaFileDownload, FaWhatsapp, FaBook, FaArrowRight } from 'react-icons/fa';
import { Spinner } from "@material-tailwind/react";

// CSS untuk styling konten
const contentStyle = `
  .content-wrapper {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
  }

  .content-wrapper ul {
    list-style-type: disc !important;
    margin-left: 2rem !important;
    margin-bottom: 1rem !important;
  }

  .content-wrapper ol {
    list-style-type: decimal !important;
    margin-left: 2rem !important;
    margin-bottom: 1rem !important;
  }

  .content-wrapper li {
    margin-bottom: 0.5rem !important;
    display: list-item !important;
  }

  .content-wrapper ul li::marker {
    color: #333 !important;
  }

  .content-wrapper ol li::marker {
    color: #333 !important;
  }

  .content-wrapper p {
    margin-bottom: 1rem !important;
  }

  .content-wrapper h1, 
  .content-wrapper h2, 
  .content-wrapper h3, 
  .content-wrapper h4 {
    font-weight: bold !important;
    margin-top: 1.5rem !important;
    margin-bottom: 1rem !important;
  }

  @media (min-width: 640px) {
    .content-wrapper {
      font-size: 16px;
    }
  }
`;

const Informasi = () => {
  const [informasi, setInformasi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInformasi = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/informasi/active`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Gagal mengambil informasi');
        }

        const data = await response.json();
        if (data.length > 0) {
          setInformasi(data[0]);
        }
      } catch (error) {
        console.error('Error fetching informasi:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInformasi();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <style>{contentStyle}</style>
      <Header />
      <Navbar />

      {/* Banner Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={asset.banner1}
          alt="Banner Informasi"
          className="w-full h-full object-cover brightness-50 transform scale-105 hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            INFORMASI
          </h1>
          <div className="w-24 h-1 bg-blue-500 rounded-full animate-width"></div>
        </div>
      </div>

      {/* Informasi Content */}
      <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-16">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              {error}
            </div>
          ) : informasi ? (
            <div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4">{informasi.judul}</h1>
              </div>
              
              <div 
                className="content-wrapper"
                dangerouslySetInnerHTML={{ 
                  __html: informasi.deskripsi 
                }} 
              />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Belum ada informasi tersedia
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Informasi;