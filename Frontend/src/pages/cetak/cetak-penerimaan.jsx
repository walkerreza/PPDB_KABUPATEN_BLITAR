import React, { useState, useEffect } from 'react';
import { Typography, Button } from "@material-tailwind/react";
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'react-qr-code';
import LogoBlitar from '../../assets/original/Lambang_kabupaten_Blitar.png';
import LogoPPDB from '../../assets/original/logo-blitar.png';

// Fungsi untuk mendekripsi string
const decodeString = (str) => {
  try {
    const decoded = str.replace(/\$/g, '=').split('').reverse().join('');
    return atob(decoded);
  } catch (error) {
    return null;
  }
};

// Fungsi untuk mengenkripsi string
const encodeString = (str) => {
  try {
    const encoded = btoa(str).split('').reverse().join('').replace(/=/g, '$');
    return encoded;
  } catch (error) {
    return null;
  }
};

const CetakPenerimaan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pendaftaranData, setPendaftaranData] = useState(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPendaftaranData = async () => {
      try {
        // Dekripsi ID dari URL
        const decodedId = decodeString(id);
        if (!decodedId) {
          setError(true);
          return;
        }

        // Format URL: id_pendaftaran-no_pendaftaran (contoh: 6-01-1-124142859)
        const urlParts = decodedId.split('-');
        const pendaftaranId = urlParts[0]; // ID pendaftaran (6)
        const noPendaftaran = urlParts.slice(1).join('-'); // Nomor pendaftaran (01-1-124142859)
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pendaftaran/${pendaftaranId}`);
        
        if (response.data.success) {
          const data = response.data.data;
          
          // Validasi nomor pendaftaran (hapus titik jika ada)
          const expectedNoPendaftaran = data.no_pendaftaran.replace(/\./g, '');
          if (expectedNoPendaftaran !== noPendaftaran) {
            setError(true);
            return;
          }
          
          setPendaftaranData(data);
          
          if (data?.dok_foto) {
            setFotoUrl(`${import.meta.env.VITE_API_URL.replace('/api', '')}/content/uploads/pendaftaran/foto/${data.dok_foto}`);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPendaftaranData();
    }
  }, [id, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Memuat data...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
          <Typography variant="h5" color="red" className="mb-4">
            Data Tidak Valid
          </Typography>
          <Typography className="mb-6">
            Mohon maaf, data yang Anda cari tidak dapat ditemukan atau tidak sesuai. 
          </Typography>
          <Button
            onClick={() => window.close()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
          >
            Tutup Halaman
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Navbar */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <img src={LogoPPDB} alt="Logo PPDB" className="h-10 w-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Konten */}
      <div className="p-6">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-[1000px] mx-auto">
          {/* Header dengan Judul dan Tombol */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h1 className="text-xl font-semibold text-gray-800">Cetak Bukti Penerimaan</h1>
            <Button
              onClick={handlePrint}
              className="print:hidden bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all"
            >
              Cetak
            </Button>
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
                      BUKTI PENERIMAAN
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
                        value={`${window.location.origin}/cetak-penerimaan/${encodeString(`${pendaftaranData?.id_pendaftaran}-${pendaftaranData?.no_pendaftaran?.replace(/\./g, '')}`)}`}
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
                  <Typography className="text-base" style={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 400 }}>
                    Tanggal Daftar: {pendaftaranData?.waktu_daftar ? new Date(pendaftaranData.waktu_daftar).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </Typography>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-2 sm:py-4 px-4 sm:px-8 bg-white shadow-md mt-6">
          <div className="flex flex-col sm:flex-row w-full flex-wrap items-center justify-center gap-3 sm:gap-6 px-2">
            <Typography color="blue-gray" className="text-sm sm:text-base font-normal">
              Copyright {new Date().getFullYear()} DISKOMINFO KOTA BLITAR
            </Typography>
          </div>
        </footer>

        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
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
  );
};

export default CetakPenerimaan;