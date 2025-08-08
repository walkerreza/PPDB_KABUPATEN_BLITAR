import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Spinner } from "@material-tailwind/react";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";
import { asset } from "../assets/asset";
import moment from "moment";
import "moment/locale/id";
import Table from "../components/table/TableVariant/Table";
import { getJalurDisplayName } from "../utils/jalurMapping";
moment.locale("id");

// Data awal kosong
const dummyData = [];

// Helper function untuk headers
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const HasilPPDB = () => {
  const location = useLocation();
  const [sekolah, setSekolah] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    zonasi: [],      // Untuk SD & SMP
    afirmasi: [],    // Untuk SD & SMP
    prestasi: [],    // Untuk SMP
    perpindahan: [], // Untuk SD & SMP
    reguler: []      // Untuk TK
  });
  const [activeJalur, setActiveJalur] = useState({
    TK: [],
    SD: [],
    SMP: []
  });

  // Ambil params dari URL
  const searchParams = new URLSearchParams(location.search);
  const idSekolah = searchParams.get("id_sekolah");
  const namaSekolah = searchParams.get("nama_sekolah") || "";

  // Fetch data sekolah by ID
  const fetchSekolah = async () => {
    if (!idSekolah) {
      console.log('No school ID provided');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching sekolah data for ID:', idSekolah);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/${idSekolah}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data sekolah');
      }
      const result = await response.json();
      console.log('Sekolah data from API:', result);
      
      if (!result.data?.tipe_sekolah?.slug) {
        console.error('No tipe_sekolah or slug found in response');
        setError('Tipe sekolah tidak valid');
        return;
      }

      setSekolah(result.data);
      const tipeSekolah = result.data.tipe_sekolah.slug.toUpperCase();
      console.log('Tipe sekolah from API:', tipeSekolah);
      fetchData(tipeSekolah);
    } catch (err) {
      console.error('Error fetching sekolah:', err);
      setError('Gagal mengambil data sekolah');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data hasil PPDB
  const fetchData = async (tipeSekolah) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data for tipe sekolah:', tipeSekolah);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pendaftaran/data-pendaftaran-sekolah/${idSekolah}`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengambil data');
      }
      
      const result = await response.json();
      console.log('Total data received:', result.data.length);
      
      // Group data berdasarkan jalur dengan optimasi untuk data besar
      const groupedData = {
        zonasi: [],
        afirmasi: [],
        prestasi: [],
        perpindahan: [],
        reguler: []
      };

      // Optimasi grouping untuk dataset besar
      result.data.forEach(d => {
        const jalur = d.jalur_pendaftaran?.nama.toLowerCase();
        if (jalur && groupedData.hasOwnProperty(jalur)) {
          groupedData[jalur].push({
            no_pendaftaran: d.no_pendaftaran,
            nama_siswa: d.nama_siswa,
            is_diterima: d.is_diterima !== undefined ? d.is_diterima : 0, // Memeriksa dan memberikan nilai default
            jalur: jalur
          });
        }
      });

      setData(groupedData);
      console.log('Data berhasil dikelompokkan:', {
        zonasi: groupedData.zonasi.length,
        afirmasi: groupedData.afirmasi.length,
        prestasi: groupedData.prestasi.length,
        perpindahan: groupedData.perpindahan.length,
        reguler: groupedData.reguler.length
      });

    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Gagal mengambil data hasil PPDB');
      toast.error(error.message || 'Gagal mengambil data hasil PPDB');
    } finally {
      setLoading(false);
    }
  };

  // Cek jadwal aktif
  const checkJadwalAktif = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/search?is_public=1`);
      const result = await response.json();
      const jadwalList = result.data;

      // Helper function untuk cek jadwal aktif
      const isJadwalActive = (jadwal) => {
        if (!jadwal) return false;
        const mulai = moment(jadwal.tanggal_mulai);
        const selesai = moment(jadwal.tanggal_selesai);
        return moment().isBetween(mulai, selesai) && jadwal.status === 1;
      };

      // Cari semua jadwal
      const jadwalSDZonasi = jadwalList.find(j => j.id_jadwal_pendaftaran === 2);
      const jadwalSDAfirmasi = jadwalList.find(j => j.id_jadwal_pendaftaran === 5);
      const jadwalSDPerpindahan = jadwalList.find(j => j.id_jadwal_pendaftaran === 8);
      
      const jadwalSMPZonasi = jadwalList.find(j => j.id_jadwal_pendaftaran === 11);
      const jadwalSMPAfirmasi = jadwalList.find(j => j.id_jadwal_pendaftaran === 14);
      const jadwalSMPPrestasi = jadwalList.find(j => j.id_jadwal_pendaftaran === 17);
      const jadwalSMPPerpindahan = jadwalList.find(j => j.id_jadwal_pendaftaran === 20);
      
      const jadwalTKReguler = jadwalList.find(j => j.id_jadwal_pendaftaran === 27);
      
      const newActiveJalur = {
        TK: [],
        SD: [],
        SMP: []
      };

      // Cek TK Reguler
      if (isJadwalActive(jadwalTKReguler)) {
        newActiveJalur.TK.push('reguler');
      }

      // Cek SD (Zonasi, Afirmasi, Perpindahan)
      if (isJadwalActive(jadwalSDZonasi)) {
        newActiveJalur.SD.push('zonasi');
      }
      if (isJadwalActive(jadwalSDAfirmasi)) {
        newActiveJalur.SD.push('afirmasi');
      }
      if (isJadwalActive(jadwalSDPerpindahan)) {
        newActiveJalur.SD.push('perpindahan');
      }

      // Cek SMP (Zonasi, Afirmasi, Prestasi, Perpindahan)
      if (isJadwalActive(jadwalSMPZonasi)) {
        newActiveJalur.SMP.push('zonasi');
      }
      if (isJadwalActive(jadwalSMPAfirmasi)) {
        newActiveJalur.SMP.push('afirmasi');
      }
      if (isJadwalActive(jadwalSMPPrestasi)) {
        newActiveJalur.SMP.push('prestasi');
      }
      if (isJadwalActive(jadwalSMPPerpindahan)) {
        newActiveJalur.SMP.push('perpindahan');
      }

      setActiveJalur(newActiveJalur);
      console.log('Active jalur per tipe sekolah:', newActiveJalur);

    } catch (error) {
      console.error('Error checking jadwal:', error);
      setActiveJalur({
        TK: [],
        SD: [],
        SMP: []
      });
    }
  };

  // Get tipe sekolah dari ID
  const getTipeSekolah = (id) => {
    console.log('Getting tipe sekolah for ID:', id);
    console.log('Current sekolah data:', sekolah);
    
    if (!id || !sekolah) {
      console.log('No ID or sekolah data available');
      return null;
    }

    console.log('tipe_sekolah from API:', sekolah.tipe_sekolah);
    return sekolah.tipe_sekolah?.slug?.toUpperCase() || null;
  };

  // Get jalur berdasarkan tipe sekolah
  const getJalurByTipe = (tipe) => {
    console.log('Getting jalur for tipe:', tipe);
    if (!tipe) {
      console.log('No tipe provided');
      return [];
    }
    
    // Mapping tipe ke jalur
    const jalurMapping = {
      'TK': ['reguler'],
      'RA': ['reguler'],
      'SDN': ['zonasi', 'afirmasi', 'perpindahan'],
      'SDS': ['zonasi', 'afirmasi', 'perpindahan'],
      'MIN': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'MIS': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'SMPN': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'SMPS': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'MTSN': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'MTSS': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'SMAN': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'SMAS': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'MAN': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'MAS': ['zonasi', 'afirmasi', 'prestasi', 'perpindahan'],
      'SMKN': ['afirmasi', 'prestasi', 'perpindahan'],
      'SMKS': ['afirmasi', 'prestasi', 'perpindahan'],
      'MAKN': ['afirmasi', 'prestasi', 'perpindahan'],
      'MAKS': ['afirmasi', 'prestasi', 'perpindahan']
    };

    const jalurList = jalurMapping[tipe] || [];
    console.log('Found jalur list:', jalurList);
    return jalurList;
  };

  // Helper untuk cek apakah jalur aktif untuk tipe sekolah tertentu
  const isJalurAktif = (jalur) => {
    const tipeSekolah = getTipeSekolah(idSekolah);
    if (!tipeSekolah) return false;

    // Map tipe sekolah ke kategori (TK/SD/SMP)
    let kategori;
    if (['TK', 'RA'].includes(tipeSekolah)) {
      kategori = 'TK';
    } else if (['SDN', 'SDS', 'MIN', 'MIS'].includes(tipeSekolah)) {
      kategori = 'SD';
    } else if (['SMPN', 'SMPS', 'MTSN', 'MTSS'].includes(tipeSekolah)) {
      kategori = 'SMP';
    } else {
      return false;
    }

    return activeJalur[kategori].includes(jalur);
  };

  // Tentukan tipe dan jalur yang ditampilkan
  const tipeSekolah = getTipeSekolah(idSekolah);
  const jalurYangDitampilkan = getJalurByTipe(tipeSekolah);

  // Definisi kolom untuk tabel
  const columns = [
    {
      key: "no",
      label: "No",
      render: (_, __, index) => index + 1,
      sortable: false
    },
    {
      key: "no_pendaftaran",
      label: "Nomor Registrasi",
      sortable: false
    },
    {
      key: "nama_siswa",
      label: "Nama Siswa",
      sortable: false
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (value, row) => {
        // Jika row adalah undefined atau null, tampilkan 'Tidak Diketahui'
        if (!row) {
          return <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">Tidak Diketahui</span>;
        }
        
        // Gunakan operator nullish coalescing untuk memberikan nilai default 0 jika is_diterima undefined atau null
        const isDiterima = row.is_diterima ?? 0;
        const status = isDiterima === 1 ? "Diterima" : "Tidak Diterima";
        
        // Style yang lebih formal dan sesuai standar instansi pemerintah
        if (isDiterima === 1) {
          return (
            <span className="px-2 py-1 border border-green-800 bg-white text-green-800 text-xs">
              {status}
            </span>
          );
        } else {
          return (
            <span className="px-2 py-1 border border-red-800 bg-white text-red-800 text-xs">
              {status}
            </span>
          );
        }
      }
    }
  ];

  // Fungsi untuk memverifikasi dan menyanitasi data
  const sanitizeData = (dataArray) => {
    if (!Array.isArray(dataArray)) return [];
    
    return dataArray.map(item => {
      if (!item) return null;
      return {
        no_pendaftaran: item.no_pendaftaran || '-',
        nama_siswa: item.nama_siswa || '-',
        is_diterima: item.is_diterima !== undefined ? item.is_diterima : 0,
        jalur: item.jalur || '-'
      };
    }).filter(Boolean); // Hapus item null
  };

  // Komponen untuk satu halaman hasil
  const HasilPage = ({ jalur, data }) => {
    // Memastikan data valid sebelum diproses lebih lanjut
    const validatedData = sanitizeData(data);
    
    // Jika tidak ada data valid, tampilkan pesan kosong
    if (validatedData.length === 0) {
      return (
        <div className="w-[210mm] h-[297mm] bg-white shadow-lg print:shadow-none mb-1 sm:mb-2 md:mb-4 lg:mb-6 print:mb-0 transform-gpu scale-[0.35] sm:scale-[0.45] md:scale-[0.65] lg:scale-100 origin-top print:scale-100 print:transform-none">
          <div className="h-full p-8 flex flex-col">
            <div className="flex items-center gap-4 pb-4">
              <img
                src={asset.logo_kemdikbud}
                alt="Logo Kemendikbud"
                className="w-20 h-20 object-contain"
              />
              <div className="text-center flex-1" style={{ fontFamily: 'Times New Roman, serif' }}>
                <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>HASIL SELEKSI PPDB</h1>
                <h2 className="text-xl font-bold mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>{namaSekolah}</h2>
                <p className="mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>TAHUN AJARAN {moment().year()}/{moment().year()+1}</p>
                <p className="text-xl font-bold mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>JALUR {getJalurDisplayName(jalur).toUpperCase()}</p>
              </div>
            </div>
            <div className="border-b-2 border-black mb-4"></div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-lg">Tidak ada data siswa untuk jalur ini</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Split data into chunks of 25 items per page
    const itemsPerPage = 25;
    const totalData = validatedData.length;
    const totalPages = Math.ceil(totalData / itemsPerPage);
    const pages = [];
    
    // Get tahun ajaran - untuk PPDB di awal tahun (Januari-Juni)
    // selalu menunjuk ke tahun ajaran yang akan datang
    const currentYear = moment().year();
    const tahunAjaran = `${currentYear}/${currentYear+1}`;
    
    // Optimize chunking for large datasets
    for (let i = 0; i < validatedData.length; i += itemsPerPage) {
      pages.push(validatedData.slice(i, i + itemsPerPage));
    }

    return (
      <>
        {pages.map((pageData, pageIndex) => (
          <div key={pageIndex} className="w-[210mm] h-[297mm] bg-white shadow-lg print:shadow-none mb-1 sm:mb-2 md:mb-4 lg:mb-6 print:mb-0 transform-gpu scale-[0.35] sm:scale-[0.45] md:scale-[0.65] lg:scale-100 origin-top print:scale-100 print:transform-none">
            <div className="h-full p-8 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4">
                <img
                  src={asset.logo_kemdikbud}
                  alt="Logo Kemendikbud"
                  className="w-20 h-20 object-contain"
                />
                <div className="text-center flex-1" style={{ fontFamily: 'Times New Roman, serif' }}>
                  <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>HASIL SELEKSI PPDB</h1>
                  <h2 className="text-xl font-bold mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>{namaSekolah}</h2>
                  <p className="mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>TAHUN AJARAN {tahunAjaran}</p>
                  <p className="text-xl font-bold mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>JALUR {getJalurDisplayName(jalur).toUpperCase()}</p>
                </div>
              </div>

              {/* Garis Pemisah */}
              <div className="border-b-2 border-black mb-4"></div>

              {/* Content Area */}
              <div className="flex-1">
                <Table 
                  data={pageData}
                  columns={columns}
                  searchable={false}
                  exportable={false}
                  pagination={false}
                  sortable={false}
                  className="[&_th]:!cursor-default [&_th]:!select-none text-sm print:text-[11pt]"
                />
              </div>

              {/* Footer */}
              <div className="text-left mt-4">
                <p className="text-sm italic mb-2">
                  Informasi ini dapat dilihat pada website ppdb.blitarkab.go.id atau scan barcode dibawah ini.
                </p>
                <QRCode
                  value={`${window.location.origin}/hasil-ppdb?jalur=${jalur}&id_sekolah=${idSekolah}&nama_sekolah=${encodeURIComponent(namaSekolah)}`}
                  size={80}
                />
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  // Effect untuk fetch data awal dan cek jadwal
  useEffect(() => {
    if (idSekolah) {
      fetchSekolah();
      checkJadwalAktif();
    }
  }, [idSekolah]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render semua halaman hasil
  return (
    <div className="min-h-screen bg-gray-200 p-0 sm:p-2 md:p-4 print:p-0 print:bg-white flex flex-col items-center">
      {/* Tombol Cetak */}
      <button
        onClick={() => window.print()}
        className="fixed bottom-4 right-4 md:top-4 md:bottom-auto z-50 print:hidden bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-full md:rounded-lg shadow-lg flex items-center gap-1 md:gap-2 transition-colors text-sm md:text-base"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
        </svg>
        <span className="hidden md:inline">Cetak</span>
      </button>

      {console.log('Tipe Sekolah:', tipeSekolah)}
      {console.log('Jalur Yang Ditampilkan:', jalurYangDitampilkan)}
      {console.log('Active Jalur:', activeJalur)}
      {console.log('Data:', data)}
      {/* Render halaman untuk jalur yang aktif */}
      {jalurYangDitampilkan.map((jalur) => {
        console.log('Checking jalur:', jalur, 'isActive:', isJalurAktif(jalur));
        // Skip jika jalur tidak aktif
        if (!isJalurAktif(jalur)) {
          return null;
        }

        // Pastikan ada data untuk jalur ini
        if (!data[jalur] || data[jalur].length === 0) {
          return (
            <div key={jalur} className="w-[210mm] h-[297mm] bg-white shadow-lg print:shadow-none mb-1 sm:mb-2 md:mb-4 lg:mb-6 print:mb-0 transform-gpu scale-[0.35] sm:scale-[0.45] md:scale-[0.65] lg:scale-100 origin-top print:scale-100 print:transform-none">
            <div className="h-full p-8 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-4 pb-4">
                <img
                  src={asset.logo_kemdikbud}
                  alt="Logo Kemendikbud"
                  className="w-20 h-20 object-contain"
                />
                <div className="text-center flex-1" style={{ fontFamily: 'Times New Roman, serif' }}>
                  <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>HASIL SELEKSI PPDB</h1>
                  <h2 className="text-xl font-bold mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>{namaSekolah}</h2>
                  <p className="mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>TAHUN AJARAN {`${moment().year()}/${moment().year()+1}`}</p>
                  <p className="text-xl font-bold mt-2" style={{ fontFamily: 'Times New Roman, serif' }}>JALUR {getJalurDisplayName(jalur).toUpperCase()}</p>
                </div>
              </div>

              {/* Garis Pemisah */}
              <div className="border-b-2 border-black mb-4"></div>

              {/* Message */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-lg">Belum ada siswa yang diterima di jalur ini</p>
              </div>

              {/* Footer */}
              <div className="text-left">
                <p className="text-sm italic mb-2">
                  Informasi ini dapat dilihat pada website ppdb.blitarkab.go.id atau scan barcode dibawah ini.
                </p>
                <QRCode
                  value={`${window.location.origin}/hasil-ppdb?jalur=${jalur}&id_sekolah=${idSekolah}&nama_sekolah=${encodeURIComponent(namaSekolah)}`}
                  size={80}
                />
              </div>
            </div>
          </div>
          );
        }

        // Render halaman dengan data
        return <HasilPage key={jalur} jalur={jalur} data={data[jalur]} />;
      })}

      {/* Error jika tipe sekolah tidak valid */}
      {!tipeSekolah && (
        <div className="text-center text-red-500 p-4">
          <p>Error: Tipe sekolah tidak valid</p>
        </div>
      )}
    </div>
  );
};

export default HasilPPDB;
