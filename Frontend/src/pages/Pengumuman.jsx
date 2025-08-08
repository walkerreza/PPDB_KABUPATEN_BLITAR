import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { asset } from '../assets/asset';
import { FaExclamationCircle, FaChrome } from 'react-icons/fa';
import SearchableSelect from '../components/forms/FormsVariant/Component/SearchableSelect';
import axios from 'axios';
import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Pengumuman = () => {
  const navigate = useNavigate();
  const [jenjang, setJenjang] = useState('');
  const [sekolah, setSekolah] = useState('');
  const [sekolahList, setSekolahList] = useState([]);
  const [isJadwalDibuka, setIsJadwalDibuka] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jadwalActive, setJadwalActive] = useState(false);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [activeJenjangList, setActiveJenjangList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = () => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    return headers;
  };

  // Fungsi untuk mengambil data sekolah berdasarkan jenjang
  const fetchSekolah = async (selectedJenjang) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sekolah/jenjang/${selectedJenjang.toLowerCase()}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSekolahList([]);
          setError(`Belum ada data sekolah untuk jenjang ${selectedJenjang.toUpperCase()}`);
          return;
        }
        throw new Error('Gagal mengambil data sekolah');
      }

      const result = await response.json();
      
      if (!result.status || !result.data || result.data.length === 0) {
        setSekolahList([]);
        setError(`Belum ada data sekolah untuk jenjang ${selectedJenjang.toUpperCase()}`);
        return;
      }

      setSekolahList(result.data);
      setError('');
    } catch (error) {
      console.error('Error fetching sekolah:', error);
      setSekolahList([]);
      setError('Gagal mengambil data sekolah. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Check jadwal pengumuman
  const checkJadwalPengumuman = useCallback(async () => {
    try {
      setLoadingJadwal(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jadwal-pendaftaran/search?is_public=1`);
      const jadwalData = response.data.data;
      setJadwalList(jadwalData);

      // Cari semua jadwal
      const jadwalSDZonasi = jadwalData.find(j => j.id_jadwal_pendaftaran === 2);
      const jadwalSDAfirmasi = jadwalData.find(j => j.id_jadwal_pendaftaran === 5);
      const jadwalSDPerpindahan = jadwalData.find(j => j.id_jadwal_pendaftaran === 8);
      
      const jadwalSMPZonasi = jadwalData.find(j => j.id_jadwal_pendaftaran === 11);
      const jadwalSMPAfirmasi = jadwalData.find(j => j.id_jadwal_pendaftaran === 14);
      const jadwalSMPPrestasi = jadwalData.find(j => j.id_jadwal_pendaftaran === 17);
      const jadwalSMPPerpindahan = jadwalData.find(j => j.id_jadwal_pendaftaran === 20);
      
      const jadwalTKReguler = jadwalData.find(j => j.id_jadwal_pendaftaran === 27);
      
      const now = moment();
      const activeJenjang = [];

      // Helper function buat cek jadwal aktif
      const isJadwalActive = (jadwal) => {
        if (!jadwal) return false;
        const mulai = moment(jadwal.tanggal_mulai);
        const selesai = moment(jadwal.tanggal_selesai);
        return now.isBetween(mulai, selesai) && jadwal.status === 1;
      };

      // Cek TK Reguler
      if (isJadwalActive(jadwalTKReguler)) {
        activeJenjang.push('tk');
      }

      // Cek SD (Zonasi, Afirmasi, Perpindahan)
      if (isJadwalActive(jadwalSDZonasi) || 
          isJadwalActive(jadwalSDAfirmasi) || 
          isJadwalActive(jadwalSDPerpindahan)) {
        activeJenjang.push('sd');
      }

      // Cek SMP (Zonasi, Afirmasi, Prestasi, Perpindahan)
      if (isJadwalActive(jadwalSMPZonasi) || 
          isJadwalActive(jadwalSMPAfirmasi) || 
          isJadwalActive(jadwalSMPPrestasi) || 
          isJadwalActive(jadwalSMPPerpindahan)) {
        activeJenjang.push('smp');
      }

      // Update state dengan jenjang yang aktif
      setJadwalActive(activeJenjang.length > 0);
      setActiveJenjangList(activeJenjang);

    } catch (error) {
      console.error('Error checking jadwal:', error);
      setJadwalActive(false);
      setActiveJenjangList([]);
    } finally {
      setLoadingJadwal(false);
    }
  }, []);

  useEffect(() => {
    checkJadwalPengumuman();
  }, [checkJadwalPengumuman]);

  const handleJenjangChange = (e) => {
    const selectedJenjang = e.target.value;
    setJenjang(selectedJenjang);
    setSekolah('');
    if (selectedJenjang) {
      fetchSekolah(selectedJenjang);
    } else {
      setSekolahList([]);
    }
  };

  const handleSekolahChange = (e) => {
    setSekolah(e.target.value);
  };

  const handleLihatHasil = () => {
    if (!sekolah) {
      toast.error('Silakan pilih sekolah terlebih dahulu');
      return;
    }

    const selectedSekolah = sekolahList.find(s => s.id_sekolah.toString() === sekolah.toString());
    console.log('Found sekolah:', selectedSekolah); // Debug
    
    if (selectedSekolah) {
      // Tentukan jalur berdasarkan jenjang dan jadwal aktif
      let jalur = 'zonasi'; // default
      const now = moment();

      // Helper function untuk cek jadwal aktif
      const isJadwalActive = (jadwal) => {
        if (!jadwal) return false;
        const mulai = moment(jadwal.tanggal_mulai);
        const selesai = moment(jadwal.tanggal_selesai);
        return now.isBetween(mulai, selesai) && jadwal.status === 1;
      };

      // TK selalu jalur reguler
      if (selectedSekolah.tipe_sekolah?.slug === 'tk') {
        jalur = 'reguler';
      } else {
        // Cek jadwal afirmasi
        const jadwalAfirmasi = selectedSekolah.tipe_sekolah?.slug === 'sd' 
          ? jadwalList.find(j => j.id_jadwal_pendaftaran === 5)  // SD Afirmasi
          : jadwalList.find(j => j.id_jadwal_pendaftaran === 14); // SMP Afirmasi

        if (isJadwalActive(jadwalAfirmasi)) {
          jalur = 'afirmasi';
        }

        // Cek jadwal prestasi (khusus SMP)
        if (selectedSekolah.tipe_sekolah?.slug === 'smp') {
          const jadwalPrestasi = jadwalList.find(j => j.id_jadwal_pendaftaran === 17);
          if (isJadwalActive(jadwalPrestasi)) {
            jalur = 'prestasi';
          }
        }

        // Cek jadwal perpindahan
        const jadwalPerpindahan = selectedSekolah.tipe_sekolah?.slug === 'sd'
          ? jadwalList.find(j => j.id_jadwal_pendaftaran === 8)  // SD Perpindahan
          : jadwalList.find(j => j.id_jadwal_pendaftaran === 20); // SMP Perpindahan

        if (isJadwalActive(jadwalPerpindahan)) {
          jalur = 'perpindahan';
        }

        // Cek jadwal zonasi
        const jadwalZonasi = selectedSekolah.tipe_sekolah?.slug === 'sd'
          ? jadwalList.find(j => j.id_jadwal_pendaftaran === 2)  // SD Zonasi
          : jadwalList.find(j => j.id_jadwal_pendaftaran === 11); // SMP Zonasi

        if (isJadwalActive(jadwalZonasi)) {
          jalur = 'zonasi';
        }
      }

      const url = `/hasil-ppdb?jalur=${jalur}&id_sekolah=${selectedSekolah.id_sekolah}&nama_sekolah=${encodeURIComponent(selectedSekolah.nama)}`;
      console.log('Redirecting to:', url); // Debug
      window.open(url, '_blank');
    } else {
      console.error('Sekolah tidak ditemukan!');
      toast.error('Sekolah tidak ditemukan!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navbar />
      
      {/* Banner Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={asset.banner1}
          alt="Banner Pengumuman"
          className="w-full h-full object-cover brightness-50 transform scale-105 hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40">
          <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            PENGUMUMAN
          </h1>
          <div className="w-24 h-1 bg-blue-500 rounded-full animate-width"></div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Pengumuman Hasil PPDB</h2>
            
            {jadwalActive ? (
              <>
                {/* Form Seleksi */}
                <div className="mb-6 sm:mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pilih Jenjang */}
                    <div>
                      <label htmlFor="jenjang" className="block text-sm font-medium text-gray-700 mb-1">
                        Pilih Jenjang
                      </label>
                      <select
                        id="jenjang"
                        value={jenjang}
                        onChange={handleJenjangChange}
                        className={`w-full p-2 text-sm sm:text-base border rounded-md ${
                          loadingJadwal ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        disabled={loadingJadwal}
                      >
                        <option value="">
                          {loadingJadwal ? 'Memuat...' : 'Pilih Jenjang'}
                        </option>
                        <option value="tk" disabled={!activeJenjangList.includes('tk')}>TK/RA</option>
                        <option value="sd" disabled={!activeJenjangList.includes('sd')}>SD/MI</option>
                        <option value="smp" disabled={!activeJenjangList.includes('smp')}>SMP/MTs</option>
                      </select>
                      {!jadwalActive && !loadingJadwal && (
                        <p className="mt-2 text-sm text-red-600">
                          Pengumuman belum dibuka atau sudah ditutup
                        </p>
                      )}
                    </div>

                    {/* Pilih Sekolah */}
                    <div>
                      <SearchableSelect
                        label="Pilih Sekolah"
                        name="sekolah"
                        value={sekolah}
                        onChange={handleSekolahChange}
                        options={sekolahList.map(s => ({
                          value: s.id_sekolah.toString(),
                          label: s.nama
                        }))}
                        placeholder={loading ? 'Memuat data sekolah...' : 'Pilih Sekolah'}
                        className={!jenjang || loading || !jadwalActive || !activeJenjangList.includes(jenjang) ? 'bg-gray-100 cursor-not-allowed' : ''}
                        disabled={!jenjang || loading || !jadwalActive || !activeJenjangList.includes(jenjang)}
                        error={error}
                      />
                    </div>
                  </div>
                </div>

                {/* Hasil Seleksi */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Hasil Seleksi</h3>
                  <p className='text-gray-600'>hasil seleksi untuk sekolah tujuan terkait dapat dilihat melalui tombol di bawah ini</p><br />
                  
                  {sekolah ? (
                    <div className="text-left">
                      <button
                        onClick={handleLihatHasil}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaChrome className="mr-2 " />
                        Tampilkan Hasil PPDB
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center">
                      Silahkan pilih jenjang dan sekolah untuk melihat hasil seleksi
                    </p>
                  )}
                </div>
              </>
            ) : (
              // Tampilan ketika jadwal belum dibuka
              <div className="p-8">
                <div className="bg-red-50 rounded-lg p-6 flex items-start gap-4 ">
                  <div className="text-red-500 mt-1">
                    <FaExclamationCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Jadwal Pengumuman Belum Dibuka
                    </h3>
                    <p className="text-gray-600">
                      Mohon menunggu hingga jadwal pengumuman dibuka sesuai dengan timeline yang telah ditentukan. 
                      Silahkan cek kembali di lain waktu.
                    </p>
                  </div>
                </div>

                {/* Timeline Info */}
                <div className="mt-6 text-sm text-gray-500">
                  <p>* Pengumuman akan dapat diakses sesuai dengan jadwal yang telah ditentukan.</p>
                  <p>* Pastikan untuk menyimpan nomor pendaftaran dan password Anda.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pengumuman;