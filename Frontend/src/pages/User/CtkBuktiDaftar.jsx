import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
} from "@material-tailwind/react";
import UserSidebar from '../../components/common/User/UserSidebar';
import UserHeader from '../../components/common/User/UserHeader';
import UserFooter from '../../components/common/User/UserFooter';
import { PrintButton } from '../../components/element/Button/variant';
import { UserGuard } from '../../utils/AuthGuard';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LogoBlitar from '../../assets/original/Lambang_kabupaten_Blitar.png';
import QRCode from 'react-qr-code';

// Fungsi untuk mengenkripsi string
const encodeString = (str) => {
  const encoded = btoa(str).split('').reverse().join('');
  return encoded.replace(/=/g, '$');
};

const CtkBuktiDaftar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pendaftaranData, setPendaftaranData] = useState(null);
  const [fotoUrl, setFotoUrl] = useState('');

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (!userDataString) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userDataString);
    
    // Fetch pendaftaran data
    const fetchPendaftaranData = async () => {
      try {
        // Get pendaftaran by user ID
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/user/${userData.id_user}`);
        if (response.data.success) {
          const data = response.data.data;
          setPendaftaranData(data);
          
          // Set foto URL dengan format yang benar
          if (data?.dok_foto) {
            setFotoUrl(`${import.meta.env.VITE_API_URL.replace('/api', '')}/content/uploads/pendaftaran/foto/${data.dok_foto}`);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Gagal mengambil data pendaftaran');
      }
    };

    fetchPendaftaranData();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsOpen(width >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handlePrint = () => {
    window.print();
  };

  return (
    <UserGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <UserHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <UserSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-4 md:p-8">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <Typography variant="h5" color="blue-gray">
                    Cetak Bukti Pendaftaran
                  </Typography>
                  <PrintButton
                    className="print:hidden"
                    onClick={handlePrint}
                  >
                    Cetak
                  </PrintButton>
                </div>

                {/* Wadah dengan background abu-abu dan scrollbar */}
                <div className="bg-gray-200 rounded-lg p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {/* Container putih untuk formulir */}
                  <div className="bg-gray-200 rounded-lg mx-auto">
                    {/* Konten Bukti Pendaftaran */}
                    <div id="printSection" className="bg-white p-4 sm:p-8 mx-auto w-full max-w-4xl shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-sm print:shadow-none text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                      {/* Logo dan Header */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
                        <img 
                          src={LogoBlitar}
                          alt="Logo Kabupaten Blitar" 
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-4 sm:mb-0 sm:mr-4"
                        />
                        <div className="flex-1 text-center">
                          <Typography className="text-center text-lg sm:text-xl text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 900 }}>
                            FORMULIR PENDAFTARAN
                          </Typography>
                          <Typography className="text-center text-lg sm:text-xl text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 900 }}>
                            CALON PESERTA DIDIK BARU KABUPATEN BLITAR
                          </Typography>
                          <Typography className="text-center text-lg sm:text-xl text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 900 }}>
                            TAHUN PELAJARAN 2024/2025
                          </Typography>
                          <Typography className="text-center text-lg sm:text-xl text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 900 }}>
                            JALUR {pendaftaranData?.jalur_pendaftaran?.nama === 'ZONASI' ? 'DOMISILI' : pendaftaranData?.jalur_pendaftaran?.nama}
                          </Typography>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4 mb-8">
                        {[
                          { no: "1", label: "No. Pendaftaran", value: pendaftaranData?.no_pendaftaran },
                          { no: "2", label: "Nama Calon Siswa", value: pendaftaranData?.nama_siswa },
                          { no: "3", label: "Tempat, Tanggal Lahir", value: pendaftaranData ? `${pendaftaranData.tempat_lahir}, ${new Date(pendaftaranData.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : '' },
                          { no: "4", label: "Sekolah Asal", value: pendaftaranData?.sekolah_asal_data?.nama },
                          { no: "5", label: "Sekolah Tujuan", value: pendaftaranData?.sekolah_tujuan_data?.nama },
                          { no: "6", label: "Nama Ayah", value: pendaftaranData?.nama_ayah },
                          { no: "7", label: "Nama Ibu", value: pendaftaranData?.nama_ibu },
                          { no: "8", label: "Alamat Rumah", value: pendaftaranData?.alamat },
                          { no: "9", label: "No. Telp/HP", value: pendaftaranData?.nomor_telepon }
                        ].map((item) => (
                          <div key={item.no} className="flex flex-col sm:flex-row text-base sm:text-lg text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>
                            <div className="flex mb-1 sm:mb-0">
                              <div className="w-8" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>{item.no}.</div>
                              <div className="w-36 sm:w-48" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>{item.label}</div>
                              <div className="w-4" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>:</div>
                            </div>
                            <div className="flex-1 pl-12 sm:pl-0 border-b border-gray-400 text-gray-900 print:text-black print:border-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>{item.value || ''}</div>
                          </div>
                        ))}
                      </div>

                      {/* Container untuk foto dan QR */}
                      <div className="flex justify-center sm:justify-end mb-4">
                        {/* Foto dan QR */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>
                          {/* Foto 3x4 */}
                          <div className="w-32 h-40 border border-gray-300">
                            {fotoUrl ? (
                              <img
                                src={fotoUrl}
                                alt="Foto Diri 3x4"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                No Photo
                              </div>
                            )}
                          </div>
                          {/* QR Code */}
                          <div className="w-40 h-40 border border-gray-300 flex items-center justify-center bg-white">
                            <QRCode
                              value={`${window.location.origin}/cetak-pendaftaran/${encodeString(`${pendaftaranData?.id_pendaftaran}-${pendaftaranData?.no_pendaftaran?.replace(/\./g, '')}`)}`}
                              size={150}
                              level="H"
                              className="p-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Spacer untuk memberikan jarak */}
                      <div className="flex-grow" style={{ minHeight: '120px' }}></div>

                      {/* Tanggal */}
                      <div className="text-right" style={{ marginTop: '60px' }}>
                        <Typography className="text-base text-gray-900 print:text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>
                          Tanggal Daftar: {pendaftaranData?.waktu_daftar ? new Date(pendaftaranData.waktu_daftar).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) : '-'}
                        </Typography>
                      </div>
                    </div>

                    <style>{`
                      @media print {
                        @page {
                          size: A4;
                          margin: 0;
                        }
                        body * {
                          visibility: hidden;
                        }
                        .print\\:hidden {
                          display: none !important;
                        }
                        #printSection, #printSection * {
                          visibility: visible;
                          font-family: 'Times New Roman', Times, serif !important;
                        }
                        #printSection {
                          position: fixed;
                          left: 50%;
                          top: 50%;
                          transform: translate(-50%, -50%);
                          width: 210mm;
                          height: 297mm;
                          padding: 20mm;
                          margin: 0;
                          background-color: white;
                          box-sizing: border-box;
                        }
                        /* Preserve styling saat print */
                        .flex { display: flex !important; }
                        .items-start { align-items: flex-start !important; }
                        .justify-end { justify-content: flex-end !important; }
                        .text-center { text-align: center !important; }
                        .text-right { text-align: right !important; }
                        .text-xl { font-size: 1.25rem !important; }
                        .text-lg { font-size: 1.125rem !important; }
                        .text-base { font-size: 1rem !important; }
                        .mr-4 { margin-right: 1rem !important; }
                        .mb-8 { margin-bottom: 2rem !important; }
                        .mb-4 { margin-bottom: 1rem !important; }
                        .w-20 { width: 5rem !important; }
                        .h-20 { height: 5rem !important; }
                        .w-8 { width: 2rem !important; }
                        .w-48 { width: 12rem !important; }
                        .w-4 { width: 1rem !important; }
                        .w-32 { width: 8rem !important; }
                        .h-40 { height: 10rem !important; }
                        .w-40 { width: 10rem !important; }
                        .gap-4 { gap: 1rem !important; }
                        .space-y-4 > * + * { margin-top: 1rem !important; }
                        .border { border-width: 1px !important; }
                        .border-b { border-bottom-width: 1px !important; }
                        .border-gray-300 { border-color: #d1d5db !important; }
                        .border-gray-400 { border-color: #9ca3af !important; }
                        .object-contain { object-fit: contain !important; }
                        .object-cover { object-fit: cover !important; }
                        .overflow-hidden { overflow: hidden !important; }
                        .bg-white { background-color: white !important; }
                        .bg-gray-100 { background-color: #f3f4f6 !important; }
                      }
                    `}</style>
                  </div>
                </div>
              </Card>
            </main>
            <UserFooter />
          </div>
        </div>

      </div>
    </UserGuard>
  );
};

export default CtkBuktiDaftar;